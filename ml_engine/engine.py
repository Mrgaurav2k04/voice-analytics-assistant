import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer
import pmdarima as pm
from datetime import datetime, timedelta

def auto_impute(df, target_col):
    """Fulfills PRD Section 10: Imputation module"""
    imputer = KNNImputer(n_neighbors=3)
    df_imputed = pd.DataFrame(imputer.fit_transform(df[[target_col]]), columns=[target_col])
    return df_imputed[target_col].tolist()

def auto_forecast(df, target_col, steps=6):
    """
    Fulfills PRD Section 10 & 11: Forecasting and generating the unified chart payload.
    """
    raw_values = df[target_col].tolist()
    
    # Impute missing values
    imputed_values = auto_impute(df, target_col)
    
    # Forecast with confidence intervals using auto_arima
    model = pm.auto_arima(imputed_values, seasonal=False, stepwise=True, suppress_warnings=True)
    forecasts, conf_int = model.predict(n_periods=steps, return_conf_int=True)
    
    forecast_values = forecasts.tolist()
    lower_bounds = conf_int[:, 0].tolist()
    upper_bounds = conf_int[:, 1].tolist()

    chart_data = []
    base_date = datetime(2026, 1, 1) # Fallback date structure for timeline
    
    # 1. Map Historical and Imputed Data
    for i in range(len(raw_values)):
        current_date = (base_date + timedelta(days=30*i)).strftime("%Y-%m-%d")
        is_missing = pd.isna(raw_values[i])
        
        chart_data.append({
            "date": current_date,
            "historical": None if is_missing else raw_values[i],
            "imputed": imputed_values[i] if is_missing else None,
            "forecast": None,
            "lower_bound": None,
            "upper_bound": None
        })
        
    # 2. Map Forecast Data
    last_date = base_date + timedelta(days=30*(len(raw_values)-1))
    for i in range(steps):
        current_date = (last_date + timedelta(days=30*(i+1))).strftime("%Y-%m-%d")
        chart_data.append({
            "date": current_date,
            "historical": None,
            "imputed": None,
            "forecast": forecast_values[i],
            "lower_bound": lower_bounds[i],
            "upper_bound": upper_bounds[i]
        })

    return chart_data