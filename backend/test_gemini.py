from services.llm_service import parse_with_gemini


columns = [
    "Year of Birth",
    "Gender",
    "Ethnicity",
    "Child's First Name",
    "Count",
    "Rank"
]


tests = [
    "Forecast Count for the next 6 months",
    "Predict Rank for the next 3 months",
    "Forecast Count for next 10 months"
]


for text in tests:
    print("REQUEST:", text)

    try:
        intent = parse_with_gemini(text, columns)
        print("RESULT:", intent.model_dump())
    except Exception as e:
        print("ERROR:", e)

    print()