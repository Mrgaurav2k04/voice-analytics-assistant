import os
import json
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types

from models.intent import AnalyticsIntent


load_dotenv()


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    # Add a reasonable timeout so the API doesn't hang indefinitely.
    # This ensures that if the LLM is unreachable, it raises an Exception and triggers the regex fallback.
    return genai.Client(
        api_key=api_key,
        http_options={'timeout': 10.0}
    )


def parse_with_gemini(text: str, columns: list[str]) -> AnalyticsIntent:
    print("[LLM] Initializing Gemini client")
    client = get_gemini_client()

    prompt = f"""
You are an analytics command parser.

Convert the user's request into JSON.

Available dataset columns:
{json.dumps(columns)}

User request:
{text}

Return ONLY valid JSON with exactly these fields:

{{
  "operation": "forecast",
  "target_column": "column name",
  "horizon": 6,
  "visualization": "line"
}}

Rules:
- operation must be "forecast"
- target_column must exactly match one of the available dataset columns
- horizon must be an integer between 1 and 24
- if the user does not specify a horizon, use 6
- visualization must be "line"
- do not invent column names
- return JSON only
"""

    print("[LLM] Calling Gemini")
    start_time = time.time()
    
    # Use a configuration with timeout and explicitly avoid tools if they might trigger AFC hangs
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            # We don't need function calling, so disable it implicitly by not passing tools
        )
    )

    elapsed = time.time() - start_time
    print(f"[LLM] Gemini returned in {elapsed:.2f} seconds")

    raw_text = response.text.strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError("Gemini returned invalid JSON") from e

    return AnalyticsIntent(**parsed)