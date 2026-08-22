import pandas as pd

from services.intent_service import parse_intent


df = pd.DataFrame({
    "Date": ["2026-01", "2026-02", "2026-03"],
    "Sales": [100, 120, 140],
    "Profit": [20, 25, 30]
})


tests = [
    "Forecast Sales for the next 6 months",
    "Predict Profit for the next 3 months",
    "Forecast Sales for the next 10 months"
]


for text in tests:
    print("REQUEST:", text)

    try:
        intent = parse_intent(text, df)
        print("RESULT:", intent.model_dump())
    except Exception as e:
        print("ERROR:", e)

    print()