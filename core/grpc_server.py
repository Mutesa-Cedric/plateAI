"""
PlateAI core — private gRPC AI worker.

Bound to loopback by default. Only the Express app server should dial this
service; mobile/web clients never connect here.
"""
from __future__ import annotations

import base64
import json
import logging
import sys
import time
import uuid
from concurrent import futures
from pathlib import Path

import grpc

# Ensure `core/` is on sys.path when launched as a script.
CORE_DIR = Path(__file__).resolve().parent
if str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))

from config import Config  # noqa: E402
from generated import ai_pb2, ai_pb2_grpc  # noqa: E402
from services.advisor_service import advisor_service  # noqa: E402
from services.chat_service import respond_prompt  # noqa: E402
from services.cook_meal_service import suggest_next_meal  # noqa: E402
from services.diet_check_service import diet_check  # noqa: E402
from services.english_stt_service import english_speech_to_text  # noqa: E402
from services.english_tts_service import english_text_to_speech  # noqa: E402
from services.kinyarwanda_stt_service import kinyarwanda_speech_to_text  # noqa: E402
from services.kinyarwanda_tts_service import kinyarwanda_text_to_speech  # noqa: E402

logging.basicConfig(
    level=logging.DEBUG if Config.DEBUG else logging.INFO,
    format="%(asctime)s [core] %(levelname)s %(message)s",
)
log = logging.getLogger("plateai.core")

AUDIO_CHUNK_SIZE = 16 * 1024


def _preview(text: str | None, limit: int = 160) -> str:
    """Safe length-limited preview for non-sensitive operational strings only."""
    if text is None:
        return "<none>"
    s = str(text).replace("\n", "\\n").replace("\r", "\\r")
    if len(s) > limit:
        return s[:limit] + f"…(+{len(s) - limit} chars)"
    return s


def _peer(context) -> str:
    try:
        return context.peer() or "unknown"
    except Exception:  # noqa: BLE001
        return "unknown"


def _req_id() -> str:
    return uuid.uuid4().hex[:10]


def _chunk_bytes(data: bytes, content_type: str):
    if not data:
        yield ai_pb2.AudioChunk(data=b"", content_type=content_type)
        return
    first = True
    for i in range(0, len(data), AUDIO_CHUNK_SIZE):
        piece = data[i : i + AUDIO_CHUNK_SIZE]
        yield ai_pb2.AudioChunk(
            data=piece,
            content_type=content_type if first else "",
        )
        first = False


def _is_abort(exc: BaseException) -> bool:
    """context.abort() raises an Exception that must not be remapped to INTERNAL."""
    # grpcio historically raises Exception from abort(); newer builds may use AbortError.
    name = type(exc).__name__
    if name in {"AbortError", "_AbortError", "RpcError"}:
        return True
    # Message pattern used by grpc._server.abort
    msg = str(exc)
    if "AbortError" in name or "Locally aborted" in msg:
        return True
    return False


class PlateAIServicer(ai_pb2_grpc.PlateAIServicer):
    def Health(self, request, context):
        rid = _req_id()
        log.info("[%s] Health ← peer=%s", rid, _peer(context))
        resp = ai_pb2.HealthResponse(status="ok", service="core")
        log.info("[%s] Health → status=%s service=%s", rid, resp.status, resp.service)
        return resp

    def DietCheck(self, request, context):
        rid = _req_id()
        t0 = time.perf_counter()
        image_len = len(request.image) if request.image else 0
        b64_len = len(request.base64) if request.base64 else 0
        log.info(
            "[%s] DietCheck ← peer=%s image_bytes=%s base64_chars=%s",
            rid,
            _peer(context),
            image_len,
            b64_len,
        )

        # Validate outside the catch-all so abort() is not remapped to INTERNAL.
        if not request.image and not request.base64:
            log.warning("[%s] DietCheck rejected: missing image", rid)
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "image or base64 required")

        try:
            if request.image:
                b64 = base64.b64encode(request.image).decode("utf-8")
            else:
                b64 = request.base64
            result = diet_check(b64)
            payload = json.dumps(result)
            ms = (time.perf_counter() - t0) * 1000
            log.info(
                "[%s] DietCheck → ok in %.1fms result_json_chars=%s",
                rid,
                ms,
                len(payload),
            )
            return ai_pb2.DietCheckResponse(result_json=payload)
        except Exception as exc:  # noqa: BLE001
            if _is_abort(exc):
                raise
            log.exception(
                "[%s] DietCheck failed after %.1fms: %s",
                rid,
                (time.perf_counter() - t0) * 1000,
                exc,
            )
            context.abort(grpc.StatusCode.INTERNAL, str(exc))

    def Advisor(self, request, context):
        rid = _req_id()
        t0 = time.perf_counter()
        log.info(
            "[%s] Advisor ← peer=%s recent_meal_chars=%s user_chars=%s past_meals_chars=%s",
            rid,
            _peer(context),
            len(request.recent_meal_json or ""),
            len(request.user_json or ""),
            len(request.past_meals_json or ""),
        )
        # No default body previews — may contain health/PII (opt-in only).
        if Config.LOG_SENSITIVE_PREVIEWS:
            log.debug(
                "[%s] Advisor body (LOG_SENSITIVE_PREVIEWS) recent=%s user=%s past=%s",
                rid,
                _preview(request.recent_meal_json),
                _preview(request.user_json),
                _preview(request.past_meals_json),
            )
        try:
            recent_meal = json.loads(request.recent_meal_json or "null")
            user = json.loads(request.user_json or "null")
            past_meals = json.loads(request.past_meals_json or "[]")
            analysis = advisor_service(recent_meal, user, past_meals)
            advice = analysis.get("advice", "")
            ms = (time.perf_counter() - t0) * 1000
            log.info(
                "[%s] Advisor → ok in %.1fms advice_chars=%s",
                rid,
                ms,
                len(advice),
            )
            return ai_pb2.AdvisorResponse(advice=advice)
        except Exception as exc:  # noqa: BLE001
            if _is_abort(exc):
                raise
            log.exception("[%s] Advisor failed: %s", rid, exc)
            context.abort(grpc.StatusCode.INTERNAL, str(exc))

    def CookForMe(self, request, context):
        rid = _req_id()
        t0 = time.perf_counter()
        log.info(
            "[%s] CookForMe ← peer=%s user_chars=%s meal_history_chars=%s",
            rid,
            _peer(context),
            len(request.user_json or ""),
            len(request.meal_history_json or ""),
        )
        if Config.LOG_SENSITIVE_PREVIEWS:
            log.debug(
                "[%s] CookForMe body (LOG_SENSITIVE_PREVIEWS) user=%s history=%s",
                rid,
                _preview(request.user_json),
                _preview(request.meal_history_json),
            )

        user_raw = request.user_json or ""
        history_raw = request.meal_history_json or ""
        # Validate before try so abort keeps INVALID_ARGUMENT.
        if not user_raw.strip() or user_raw.strip() in ("null", "None"):
            log.warning("[%s] CookForMe rejected: missing profile", rid)
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT,
                "user profile and meal history are required",
            )

        try:
            user_profile = json.loads(user_raw or "null")
            meal_history = json.loads(history_raw or "[]")
            if not user_profile or meal_history is None:
                context.abort(
                    grpc.StatusCode.INVALID_ARGUMENT,
                    "user profile and meal history are required",
                )
            meal_res = suggest_next_meal(user_profile, meal_history)
            response = meal_res.get("response", "")
            image = meal_res.get("image", "") or ""
            ms = (time.perf_counter() - t0) * 1000
            log.info(
                "[%s] CookForMe → ok in %.1fms response_chars=%s image_chars=%s",
                rid,
                ms,
                len(response),
                len(image),
            )
            return ai_pb2.CookForMeResponse(response=response, image=image)
        except Exception as exc:  # noqa: BLE001
            if _is_abort(exc):
                raise
            log.exception("[%s] CookForMe failed: %s", rid, exc)
            context.abort(grpc.StatusCode.INTERNAL, str(exc))

    def Chat(self, request, context):
        rid = _req_id()
        t0 = time.perf_counter()
        prompt = request.prompt or ""
        log.info(
            "[%s] Chat ← peer=%s prompt_chars=%s",
            rid,
            _peer(context),
            len(prompt),
        )
        if Config.LOG_SENSITIVE_PREVIEWS:
            log.debug(
                "[%s] Chat prompt (LOG_SENSITIVE_PREVIEWS)=%s",
                rid,
                _preview(prompt),
            )

        if not prompt.strip():
            log.warning("[%s] Chat rejected: empty prompt", rid)
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "prompt is required")

        try:
            msg = respond_prompt(prompt=prompt)
            response = msg.get("response", "")
            ms = (time.perf_counter() - t0) * 1000
            log.info(
                "[%s] Chat → ok in %.1fms response_chars=%s",
                rid,
                ms,
                len(response),
            )
            return ai_pb2.ChatResponse(response=response)
        except Exception as exc:  # noqa: BLE001
            if _is_abort(exc):
                raise
            log.exception("[%s] Chat failed: %s", rid, exc)
            context.abort(grpc.StatusCode.INTERNAL, str(exc))

    def SpeechToText(self, request_iterator, context):
        rid = _req_id()
        t0 = time.perf_counter()
        language = "en"
        content_type = "audio/wav"
        filename = "audio.wav"
        chunks: list[bytes] = []
        frame_count = 0
        config_seen = False
        total = 0
        max_bytes = Config.STT_MAX_AUDIO_BYTES

        log.info("[%s] SpeechToText ← stream open peer=%s", rid, _peer(context))

        try:
            for msg in request_iterator:
                which = msg.WhichOneof("payload")
                if which == "config":
                    language = (msg.config.language or "en").lower()
                    content_type = msg.config.content_type or content_type
                    if msg.config.filename:
                        filename = msg.config.filename
                    config_seen = True
                    log.info(
                        "[%s] SpeechToText ← config language=%s content_type=%s filename=%s",
                        rid,
                        language,
                        content_type,
                        filename,
                    )
                elif which == "audio":
                    if msg.audio:
                        total += len(msg.audio)
                        if total > max_bytes:
                            log.warning(
                                "[%s] SpeechToText rejected: audio exceeds cap %s bytes",
                                rid,
                                max_bytes,
                            )
                            context.abort(
                                grpc.StatusCode.RESOURCE_EXHAUSTED,
                                f"audio exceeds maximum of {max_bytes} bytes",
                            )
                        chunks.append(msg.audio)
                        frame_count += 1
                        if frame_count == 1 or frame_count % 20 == 0:
                            log.debug(
                                "[%s] SpeechToText ← audio frame #%s size=%s total_so_far=%s",
                                rid,
                                frame_count,
                                len(msg.audio),
                                total,
                            )

            audio_bytes = b"".join(chunks)
            log.info(
                "[%s] SpeechToText stream closed config_seen=%s frames=%s total_audio_bytes=%s language=%s content_type=%s filename=%s",
                rid,
                config_seen,
                frame_count,
                len(audio_bytes),
                language,
                content_type,
                filename,
            )

            if not audio_bytes:
                log.warning("[%s] SpeechToText rejected: no audio", rid)
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "no audio received")

            if language == "rw":
                text = kinyarwanda_speech_to_text(audio_bytes, content_type, filename)
            else:
                text = english_speech_to_text(audio_bytes, content_type)

            ms = (time.perf_counter() - t0) * 1000
            log.info(
                "[%s] SpeechToText → ok in %.1fms text_chars=%s",
                rid,
                ms,
                len(text or ""),
            )
            return ai_pb2.SttResponse(text=text or "")
        except Exception as exc:  # noqa: BLE001
            if _is_abort(exc):
                raise
            log.exception(
                "[%s] SpeechToText failed after %.1fms: %s",
                rid,
                (time.perf_counter() - t0) * 1000,
                exc,
            )
            context.abort(grpc.StatusCode.INTERNAL, str(exc))

    def TextToSpeech(self, request, context):
        rid = _req_id()
        t0 = time.perf_counter()
        text = (request.text or "").strip()
        language = (request.language or "en").lower()
        log.info(
            "[%s] TextToSpeech ← peer=%s language=%s text_chars=%s",
            rid,
            _peer(context),
            language,
            len(text),
        )
        if Config.LOG_SENSITIVE_PREVIEWS:
            log.debug(
                "[%s] TextToSpeech text (LOG_SENSITIVE_PREVIEWS)=%s",
                rid,
                _preview(text),
            )

        if not text:
            log.warning("[%s] TextToSpeech rejected: empty text", rid)
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "text is required")

        try:
            if language == "rw":
                audio = kinyarwanda_text_to_speech(text)
                content_type = "audio/mpeg"
            else:
                audio = english_text_to_speech(text)
                content_type = "audio/mpeg"

            synth_ms = (time.perf_counter() - t0) * 1000
            total = len(audio or b"")
            frames = max(1, (total + AUDIO_CHUNK_SIZE - 1) // AUDIO_CHUNK_SIZE) if total else 1
            log.info(
                "[%s] TextToSpeech synthesized in %.1fms audio_bytes=%s content_type=%s streaming frames≈%s (no disk)",
                rid,
                synth_ms,
                total,
                content_type,
                frames,
            )

            sent = 0
            frame_i = 0
            for chunk in _chunk_bytes(audio, content_type):
                frame_i += 1
                sent += len(chunk.data)
                if frame_i == 1 or frame_i % 10 == 0:
                    log.debug(
                        "[%s] TextToSpeech → frame #%s size=%s sent_so_far=%s",
                        rid,
                        frame_i,
                        len(chunk.data),
                        sent,
                    )
                yield chunk

            ms = (time.perf_counter() - t0) * 1000
            log.info(
                "[%s] TextToSpeech → stream complete in %.1fms frames=%s bytes_sent=%s",
                rid,
                ms,
                frame_i,
                sent,
            )
        except Exception as exc:  # noqa: BLE001
            if _is_abort(exc):
                raise
            log.exception("[%s] TextToSpeech failed: %s", rid, exc)
            context.abort(grpc.StatusCode.INTERNAL, str(exc))


def serve() -> None:
    host = Config.GRPC_HOST
    port = Config.GRPC_PORT
    bind_addr = f"{host}:{port}"

    # Defense-in-depth: warn loudly if binding beyond loopback without TLS.
    if host not in ("127.0.0.1", "localhost", "::1"):
        log.warning(
            "GRPC_HOST=%s is not loopback. Core uses insecure credentials — "
            "only safe on a private network. Prefer 127.0.0.1 for co-located server.",
            host,
        )

    workers = max(1, Config.GRPC_MAX_WORKERS)
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=workers),
        options=[
            ("grpc.max_send_message_length", 50 * 1024 * 1024),
            ("grpc.max_receive_message_length", 50 * 1024 * 1024),
        ],
    )
    ai_pb2_grpc.add_PlateAIServicer_to_server(PlateAIServicer(), server)
    server.add_insecure_port(bind_addr)
    server.start()
    log.info(
        "gRPC core listening on %s (private AI worker, max_workers=%s)",
        bind_addr,
        workers,
    )
    log.info(
        "DEBUG=%s LOG_SENSITIVE_PREVIEWS=%s STT_MAX_AUDIO_BYTES=%s",
        Config.DEBUG,
        Config.LOG_SENSITIVE_PREVIEWS,
        Config.STT_MAX_AUDIO_BYTES,
    )
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
