from models.intent import AnalyticsIntent
from services.fallback_parser import fallback_parse
from services.llm_service import parse_with_gemini


def parse_intent(text: str, df) -> AnalyticsIntent:
    try:
        return parse_with_gemini(
            text,
            df.columns.tolist()
        )
    except Exception:
        return fallback_parse(text, df)