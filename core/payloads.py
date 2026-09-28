"""Canonical request shapes for prompts and cache keys.

Advisor only reads the first N past meals. Cook-for-me only reads foodItems
and must stay inside the 8k model window. Extra fields (images, emails,
older meals) must not reach the prompt or the cache key, or every new
logged meal would miss.
"""
from __future__ import annotations

from typing import Any, Iterable, List, Optional

# Matches advisor_service: only the first three past meals are prompted.
ADVISOR_PAST_MEALS_LIMIT = 3

# llama3-8b-8192 on the cook-for-me path.
COOK_CONTEXT_WINDOW = 8192
COOK_MAX_COMPLETION_TOKENS = 1024
COOK_SYSTEM_RESERVE_TOKENS = 64
COOK_PROMPT_TOKEN_BUDGET = (
    COOK_CONTEXT_WINDOW - COOK_MAX_COMPLETION_TOKENS - COOK_SYSTEM_RESERVE_TOKENS
)

USER_PROMPT_FIELDS = (
    "firstName",
    "lastName",
    "age",
    "weight",
    "height",
    "gender",
    "purpose",
)


def estimate_tokens(text: str) -> int:
    """Cheap char/4 estimate — enough to keep cook-for-me inside 8k."""
    if not text:
        return 0
    return max(1, len(text) // 4)


def canonicalize_user(user: Any) -> dict:
    """Keep only profile fields the prompts interpolate."""
    if not isinstance(user, dict):
        return {}
    return {field: user.get(field) for field in USER_PROMPT_FIELDS}


def food_items_of(meal: Any) -> Any:
    """Meals arrive as full rows or as a bare foodItems payload."""
    if isinstance(meal, dict) and "foodItems" in meal:
        return meal["foodItems"]
    return meal


def canonicalize_recent_meal(recent_meal: Any) -> Any:
    if recent_meal is None:
        return None
    if isinstance(recent_meal, dict):
        return {"foodItems": recent_meal.get("foodItems")}
    return recent_meal


def _as_meal_list(meals: Any) -> List[Any]:
    if meals is None:
        return []
    if isinstance(meals, list):
        return meals
    return list(meals)


def order_meals_recent_first(meals: Iterable[Any]) -> List[Any]:
    items = list(meals)
    if items and all(isinstance(m, dict) and m.get("createdAt") for m in items):
        return sorted(items, key=lambda m: str(m.get("createdAt")), reverse=True)
    return items


def canonicalize_past_meals(
    past_meals: Any, limit: int = ADVISOR_PAST_MEALS_LIMIT
) -> List[Any]:
    ordered = order_meals_recent_first(_as_meal_list(past_meals))
    return [food_items_of(meal) for meal in ordered[: max(0, limit)]]


def extract_food_item_list(meal_history: Any) -> List[Any]:
    ordered = order_meals_recent_first(_as_meal_list(meal_history))
    return [food_items_of(meal) for meal in ordered]


def advisor_key_material(recent_meal: Any, user: Any, past_meals: Any) -> dict:
    return {
        "recent_meal": canonicalize_recent_meal(recent_meal),
        "user": canonicalize_user(user),
        "past_meals": canonicalize_past_meals(past_meals),
    }


def cook_key_material(user_profile: Any, formatted_history: Any) -> dict:
    return {
        "user": canonicalize_user(user_profile),
        "meal_history": formatted_history,
    }


def canonicalize_chat_prompt(prompt: Optional[str]) -> str:
    return " ".join((prompt or "").split())
