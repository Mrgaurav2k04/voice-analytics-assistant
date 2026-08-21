import re

import pandas as pd

from models.intent import AnalyticsIntent


def get_primary_numeric_column(df: pd.DataFrame) -> str:
    numeric_columns = df.select_dtypes(include="number").columns.tolist()

    if not numeric_columns:
        raise ValueError("Dataset has no numeric columns")

    return numeric_columns[0]


def parse_horizon(text: str) -> int:
    match = re.search(
        r"\b(?:next|for)\s+(\d+)\s*(?:months?|steps?|periods?)?\b",
        text,
        re.IGNORECASE
    )

    if match:
        return max(1, min(int(match.group(1)), 24))

    return 6


def parse_target_column(text: str, df: pd.DataFrame) -> str:
    text_lower = text.lower()

    for column in df.columns:
        if column.lower() in text_lower:
            return column

    return get_primary_numeric_column(df)


def fallback_parse(text: str, df: pd.DataFrame) -> AnalyticsIntent:
    target_column = parse_target_column(text, df)
    horizon = parse_horizon(text)

    return AnalyticsIntent(
        operation="forecast",
        target_column=target_column,
        horizon=horizon,
        visualization="line"
    )