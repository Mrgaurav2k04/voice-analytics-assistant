import pandas as pd

from services.fallback_parser import fallback_parse


df = pd.DataFrame({
    "date": ["2026-01", "2026-02", "2026-03"],
    "sales": [100, 120, 140],
    "profit": [20, 25, 30]
})


tests = [
    "Forecast sales for the next 6 months",
    "Predict profit for next 3 months",
    "Forecast sales for 10 months",
    "Predict something for the next 4 months"
]


for text in tests:
    intent = fallback_parse(text, df)

    print(text)
    print(intent.model_dump())
    print()