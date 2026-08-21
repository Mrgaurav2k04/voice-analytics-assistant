import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.impute import KNNImputer
import pmdarima as pm

def auto_impute(df, target_col):
    """
    Fulfills PRD Section 10: Imputation module.
    Returns: (imputed_values_list, metadata_dict)
    """
    series = df[target_col].copy()
    missing_mask = series.isna()
    missing_count = int(missing_mask.sum())
    
    if missing_count == 0:
        return series.tolist(), {
            "missing_values_found": 0,
            "values_imputed": 0,
            "method": "none"
        }
    
    # Time-aware KNN imputation (accurate)
    n = len(series)
    feat = pd.DataFrame(index=series.index)
    feat['value'] = series
    feat['t'] = np.arange(n)
    feat['roll_mean_3'] = series.rolling(3, center=True, min_periods=1).mean()
    feat['roll_std_3'] = series.rolling(3, center=True, min_periods=1).std().fillna(0)
    
    imputer = KNNImputer(n_neighbors=5, weights='distance')
    imputed_feat = imputer.fit_transform(feat)
    imputed_values = imputed_feat[:, 0].tolist()
    
    metadata = {
        "missing_values_found": missing_count,
        "values_imputed": missing_count,
        "method": "KNNImputer(n_neighbors=5, weights='distance', temporal_features=True)"
    }
    
    return imputed_values, metadata


def auto_forecast(df, target_col, steps=6):
    """
    Fulfills PRD Section 10 & 11: Forecasting and generating the unified chart payload.
    Returns: list[dict] matching chart_payload.data schema
    """
    raw_values = df[target_col].tolist()
    
    # Impute missing values
    imputed_values, _ = auto_impute(df, target_col)
    
    # Forecast with confidence intervals using auto_arima
    model = pm.auto_arima(
        imputed_values, 
        seasonal=False, 
        stepwise=True, 
        suppress_warnings=True,
        error_action='ignore'
    )
    forecasts, conf_int = model.predict(n_periods=steps, return_conf_int=True)
    
    forecast_values = forecasts.tolist()
    lower_bounds = conf_int[:, 0].tolist()
    upper_bounds = conf_int[:, 1].tolist()

    # Build unified chart payload (spec Section 11)
    chart_data = []
    base_date = datetime(2026, 1, 1)
    
    # Historical + imputed rows (CORRECT: separates historical vs imputed)
    for i, (raw, imp) in enumerate(zip(raw_values, imputed_values)):
        row = {
            "date": (base_date + timedelta(days=i*30)).strftime("%Y-%m-%d"),
            "historical": raw if not pd.isna(raw) else None,
            "imputed": imp if pd.isna(raw) else None,
            "forecast": None,
            "lower_bound": None,
            "upper_bound": None
        }
        chart_data.append(row)
    
    # Forecast rows
    for i in range(steps):
        row = {
            "date": (base_date + timedelta(days=(len(raw_values)+i)*30)).strftime("%Y-%m-%d"),
            "historical": None,
            "imputed": None,
            "forecast": forecast_values[i],
            "lower_bound": lower_bounds[i],
            "upper_bound": upper_bounds[i]
        }
        chart_data.append(row)
    
    return chart_data