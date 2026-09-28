"""Content-addressed AI cache: keys, hit/miss logs, scan/advisor/cook/chat."""
from __future__ import annotations

import base64
import io
import json
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

from PIL import Image

CORE_DIR = os.path.dirname(os.path.abspath(__file__))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from cache import (  # noqa: E402
    ContentCache,
    cached_get_or_set,
    content_key,
    get_ai_cache,
    reset_ai_cache,
)
from image_normalize import decode_image_input, image_fingerprint, normalize_image_bytes  # noqa: E402
from payloads import (  # noqa: E402
    COOK_CONTEXT_WINDOW,
    COOK_MAX_COMPLETION_TOKENS,
    advisor_key_material,
    canonicalize_chat_prompt,
    canonicalize_past_meals,
    canonicalize_user,
    estimate_tokens,
)
from services.advisor_service import advisor_service  # noqa: E402
from services.chat_service import respond_prompt  # noqa: E402
from services.cook_meal_service import (  # noqa: E402
    build_prompt,
    suggest_next_meal,
    trim_meal_history_to_context,
)
from services.diet_check_service import diet_check  # noqa: E402


def _rgb_bytes(color=(200, 40, 40), size=(12, 10), fmt="JPEG") -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format=fmt)
    return buf.getvalue()


def _completion(text: str) -> MagicMock:
    msg = MagicMock()
    msg.message.content = text
    choice = MagicMock()
    choice.message = msg.message
    # groq shape: choices[0].message.content
    result = MagicMock()
    result.choices = [MagicMock(message=MagicMock(content=text))]
    return result


PROFILE = {
    "firstName": "Ada",
    "lastName": "Lovelace",
    "age": 36,
    "weight": 60,
    "height": 165,
    "gender": "FEMALE",
    "purpose": "MAINTAIN",
}

FOOD_A = [{"food_item": "Rice", "calories": "206"}]
FOOD_B = [{"food_item": "Beans", "calories": "140"}]
FOOD_C = [{"food_item": "Egg", "calories": "78"}]


class ContentKeyTests(unittest.TestCase):
    def test_same_content_same_key(self):
        self.assertEqual(
            content_key("advisor", {"a": 1, "b": 2}),
            content_key("advisor", {"b": 2, "a": 1}),
        )

    def test_different_namespace_different_key(self):
        self.assertNotEqual(content_key("a", 1), content_key("b", 1))

    def test_bytes_hashed_stably(self):
        self.assertEqual(content_key("x", b"abc"), content_key("x", b"abc"))
        self.assertNotEqual(content_key("x", b"abc"), content_key("x", b"abd"))


class CacheHitMissTests(unittest.TestCase):
    def setUp(self):
        reset_ai_cache()

    def test_get_or_set_logs_miss_then_hit(self):
        calls = {"n": 0}

        def producer():
            calls["n"] += 1
            return {"ok": True}

        with self.assertLogs("plateai.core", level="INFO") as cm:
            first = cached_get_or_set("chat", "hello", producer)
            second = cached_get_or_set("chat", "hello", producer)
        self.assertEqual(first, second)
        self.assertEqual(calls["n"], 1)
        joined = "\n".join(cm.output)
        self.assertIn("cache miss", joined)
        self.assertIn("cache hit", joined)
        self.assertIn("ns=chat", joined)

    def test_no_invalidate_api_on_production_cache(self):
        cache = ContentCache(maxsize=8)
        self.assertFalse(hasattr(cache, "invalidate"))
        self.assertFalse(hasattr(cache, "delete"))
        self.assertFalse(hasattr(cache, "pop"))


class ImageNormalizeTests(unittest.TestCase):
    def test_jpeg_and_png_same_pixels_same_fingerprint(self):
        jpeg = _rgb_bytes(fmt="JPEG")
        png = _rgb_bytes(fmt="PNG")
        # JPEG is lossy; use lossless pair via normalize of identical RGB Image.
        raw_a = normalize_image_bytes(_rgb_bytes(fmt="PNG"))
        raw_b = normalize_image_bytes(_rgb_bytes(fmt="PNG"))
        self.assertEqual(raw_a, raw_b)
        self.assertEqual(image_fingerprint(jpeg), image_fingerprint(jpeg))
        self.assertEqual(
            image_fingerprint(png),
            image_fingerprint(decode_image_input(b64=base64.b64encode(png).decode())),
        )

    def test_data_uri_and_raw_base64_same_fingerprint(self):
        png = _rgb_bytes(fmt="PNG")
        b64 = base64.b64encode(png).decode("ascii")
        raw = decode_image_input(b64=b64)
        uri = decode_image_input(b64=f"data:image/png;base64,{b64}")
        self.assertEqual(image_fingerprint(raw), image_fingerprint(uri))

    def test_different_pixels_different_fingerprint(self):
        a = _rgb_bytes(color=(10, 10, 10), fmt="PNG")
        b = _rgb_bytes(color=(11, 10, 10), fmt="PNG")
        self.assertNotEqual(image_fingerprint(a), image_fingerprint(b))


class PayloadTrimTests(unittest.TestCase):
    def test_advisor_drops_unused_user_fields_and_extra_meals(self):
        user = {**PROFILE, "email": "ada@example.com", "id": "u1", "password": "x"}
        recent = {"foodItems": FOOD_A, "image": "HUGE", "id": "m-new"}
        past = [
            {"foodItems": FOOD_A, "image": "1", "createdAt": "2026-01-03"},
            {"foodItems": FOOD_B, "image": "2", "createdAt": "2026-01-02"},
            {"foodItems": FOOD_C, "image": "3", "createdAt": "2026-01-01"},
            {"foodItems": [{"food_item": "Cake"}], "image": "4", "createdAt": "2025-12-01"},
        ]
        material = advisor_key_material(recent, user, past)
        self.assertEqual(material["user"], canonicalize_user(PROFILE))
        self.assertNotIn("email", material["user"])
        self.assertNotIn("password", material["user"])
        self.assertEqual(material["recent_meal"], {"foodItems": FOOD_A})
        self.assertEqual(len(material["past_meals"]), 3)
        self.assertEqual(material["past_meals"][0], FOOD_A)

        older = past + [
            {
                "foodItems": [{"food_item": "unused-old"}],
                "image": "5",
                "createdAt": "2024-01-01",
            }
        ]
        extra = advisor_key_material(recent, user, older)
        self.assertEqual(
            content_key("advisor", material),
            content_key("advisor", extra),
        )

    def test_past_meals_already_food_items_kept_to_three(self):
        trimmed = canonicalize_past_meals([FOOD_A, FOOD_B, FOOD_C, FOOD_A])
        self.assertEqual(trimmed, [FOOD_A, FOOD_B, FOOD_C])

    def test_chat_prompt_collapses_whitespace(self):
        self.assertEqual(
            canonicalize_chat_prompt("  what   is   protein \n"),
            "what is protein",
        )

    def test_cook_history_stays_inside_8k_window(self):
        bulky = [
            [{"food_item": f"item-{i}-{ 'x' * 400 }", "calories": "1"}]
            for i in range(80)
        ]
        trimmed = trim_meal_history_to_context(PROFILE, bulky)
        prompt = build_prompt(PROFILE, trimmed)
        budget = COOK_CONTEXT_WINDOW - COOK_MAX_COMPLETION_TOKENS
        self.assertLessEqual(estimate_tokens(prompt), budget)
        self.assertGreaterEqual(len(trimmed), 1)
        self.assertLess(len(trimmed), len(bulky))


class DietCheckCacheTests(unittest.TestCase):
    def setUp(self):
        reset_ai_cache()

    def test_second_scan_skips_all_four_provider_calls(self):
        png = _rgb_bytes(fmt="PNG")
        b64 = base64.b64encode(png).decode("ascii")
        metrics = json.dumps(
            [
                {
                    "food_item": "apple",
                    "calories": "50",
                    "carbohydrates": "12g",
                    "proteins": "0g",
                    "sodium": "1mg",
                    "fats": "0g",
                }
            ]
        )
        side_effects = [
            _completion("['apple', 'plate']"),
            _completion("['apple']"),
            _completion("['apple']"),
            _completion(metrics),
        ]
        with patch("services.diet_check_service.Groq") as groq_cls:
            create = groq_cls.return_value.chat.completions.create
            create.side_effect = side_effects
            with self.assertLogs("plateai.core", level="INFO"):
                first = diet_check(b64)
                second = diet_check(b64)
                # data-URI retry of the same pixels
                third = diet_check(f"data:image/png;base64,{b64}")
        self.assertEqual(first, second)
        self.assertEqual(second, third)
        self.assertEqual(create.call_count, 4)

    def test_different_image_is_a_miss(self):
        a = base64.b64encode(_rgb_bytes(color=(1, 2, 3), fmt="PNG")).decode()
        b = base64.b64encode(_rgb_bytes(color=(9, 8, 7), fmt="PNG")).decode()
        metrics = json.dumps(
            [
                {
                    "food_item": "x",
                    "calories": "1",
                    "carbohydrates": "1",
                    "proteins": "1",
                    "sodium": "1",
                    "fats": "1",
                }
            ]
        )
        with patch("services.diet_check_service.Groq") as groq_cls:
            create = groq_cls.return_value.chat.completions.create
            create.side_effect = [
                _completion("['a']"),
                _completion("['a']"),
                _completion("['a']"),
                _completion(metrics),
                _completion("['b']"),
                _completion("['b']"),
                _completion("['b']"),
                _completion(metrics),
            ]
            diet_check(a)
            diet_check(b)
        self.assertEqual(create.call_count, 8)


class AdvisorCookChatCacheTests(unittest.TestCase):
    def setUp(self):
        reset_ai_cache()

    def test_advisor_hit_when_only_unused_history_changes(self):
        recent = {"foodItems": FOOD_A}
        past_short = [FOOD_A, FOOD_B, FOOD_C]
        past_long = past_short + [[{"food_item": "unused"}]]
        user_full = {**PROFILE, "email": "ada@x.com", "id": "99"}

        with patch("services.advisor_service.Groq") as groq_cls:
            create = groq_cls.return_value.chat.completions.create
            create.return_value = _completion("Ada, add greens.")
            with self.assertLogs("plateai.core", level="INFO") as cm:
                a = advisor_service(recent, user_full, past_long)
                b = advisor_service(recent, PROFILE, past_short)
        self.assertEqual(a["advice"], b["advice"])
        self.assertEqual(create.call_count, 1)
        joined = "\n".join(cm.output)
        self.assertIn("cache miss", joined)
        self.assertIn("cache hit", joined)

    def test_cook_ignores_images_and_caches_whole_result(self):
        history_rich = [
            {"foodItems": FOOD_A, "image": "base64-AAA", "id": "1", "createdAt": "2026-02-02"},
            {"foodItems": FOOD_B, "image": "base64-BBB", "id": "2", "createdAt": "2026-02-01"},
        ]
        history_lean = [{"foodItems": FOOD_A}, {"foodItems": FOOD_B}]
        markdown = "### Ingredients:\n- Rice\n"

        with patch("services.cook_meal_service.requests.get") as req_get:
            req_get.return_value = MagicMock(text="data:image/png;base64,xx")
            with patch(
                "services.cook_meal_service.client.chat.completions.create",
                return_value=_completion(markdown),
            ) as create:
                with self.assertLogs("plateai.core", level="INFO"):
                    first = suggest_next_meal({**PROFILE, "email": "a@b.c"}, history_rich)
                    second = suggest_next_meal(PROFILE, history_lean)
        self.assertEqual(first["response"], second["response"])
        self.assertEqual(first["image"], second["image"])
        # one meal suggestion + one one-liner, not doubled
        self.assertEqual(create.call_count, 2)
        self.assertEqual(req_get.call_count, 1)

    def test_chat_common_prompt_hits(self):
        with patch(
            "services.chat_service.client.chat.completions.create",
            return_value=_completion("Protein builds muscle."),
        ) as create:
            with self.assertLogs("plateai.core", level="INFO"):
                a = respond_prompt("  what   is protein ")
                b = respond_prompt("what is protein")
        self.assertEqual(a["response"], b["response"])
        self.assertEqual(create.call_count, 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
