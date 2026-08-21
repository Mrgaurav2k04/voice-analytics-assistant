# ML Engine Backend Integration API

This document provides the integration contract for the ML engine (`engine.py`) to be used by the backend developer in `ml_service.py`.

## 1. `auto_impute`

### Interface
```python
def auto_impute(df, target_col=None)
```

### Input
- `df`: pandas.DataFrame containing the raw dataset.
- `target_col`: string, name of the column to perform imputation on. If `None`, the first numeric column with missing values will be automatically selected.

### Output
Returns a tuple `(processed_df, metadata)`:
- `processed_df`: pandas.DataFrame. The dataset with missing values in `target_col` filled in. Known values are perfectly preserved.
- `metadata`: dictionary with the following schema:
  ```python
  {
      "missing_values_found": int,
      "values_imputed": int,
      "method": string, # e.g. "Linear Interpolation", "Forward Fill", "KNN Imputation"
      "tournament_score": float or None, # RMSE score of the selected method
      "target_col": string
  }
  ```

## 2. `auto_forecast`

### Interface
```python
def auto_forecast(df, target_col, steps=6)
```

### Input
- `df`: pandas.DataFrame. Ideally the `processed_df` output from `auto_impute`.
- `target_col`: string, name of the target column to forecast.
- `steps`: integer, forecast horizon (must be between 1 and 24). Default is 6.

### Output
Returns exactly the following dictionary structure for direct JSON serialization and chart payload generation:
```python
{
    "target_column": string,
    "historical": [
        {
            "timestamp": string, # Extracted or index-based timestamp
            "value": float
        },
        ...
    ],
    "imputed": [
        {
            "timestamp": string,
            "value": float
        },
        ...
    ],
    "forecast": [
        {
            "timestamp": string,
            "value": float
        },
        ...
    ],
    "forecast_lower": [
        {
            "timestamp": string,
            "value": float
        },
        ...
    ],
    "forecast_upper": [
        {
            "timestamp": string,
            "value": float
        },
        ...
    ],
    "model": string # e.g. "Auto-ARIMA" or "Exponential Smoothing"
}
```
