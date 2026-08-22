import pandas as pd


def profile_dataset(df: pd.DataFrame) -> dict:
    numeric_columns = df.select_dtypes(include="number").columns.tolist()

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "numeric_columns": numeric_columns,
        "missing_values": int(df.isna().sum().sum())
    }


def preprocess_dataset(df: pd.DataFrame):
    processed_df = df.copy()

    missing_before = int(processed_df.isna().sum().sum())

    numeric_columns = processed_df.select_dtypes(include="number").columns

    for column in numeric_columns:
        processed_df[column] = processed_df[column].interpolate(
            method="linear",
            limit_direction="both"
        )

    missing_after = int(processed_df.isna().sum().sum())

    metadata = profile_dataset(df)

    metadata["imputed_values"] = missing_before - missing_after
    metadata["status"] = "ready"

    return processed_df, metadata