from models.intent import AnalyticsIntent
from services.fallback_parser import fallback_parse
from services.llm_service import parse_with_gemini


def parse_intent(text: str, df) -> AnalyticsIntent:
    import time
    try:
        print("[INTENT_SERVICE] Attempting LLM parse")
        llm_start = time.time()
        intent = parse_with_gemini(
            text,
            df.columns.tolist()
        )
        print(f"[INTENT_SERVICE] LLM parse succeeded in {time.time() - llm_start:.2f} seconds")
        return intent
    except Exception as e:
        print(f"[INTENT_SERVICE] LLM parse failed: {e}. Falling back to regex parser.")
        fallback_start = time.time()
        intent = fallback_parse(text, df)
        print(f"[INTENT_SERVICE] Fallback parse succeeded in {time.time() - fallback_start:.2f} seconds")
        return intent