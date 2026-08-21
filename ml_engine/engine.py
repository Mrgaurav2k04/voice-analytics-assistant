import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.impute import KNNImputer
import pmdarima as pm

def auto_impute(df, target_col=None):
    """
    Fulfills PRD Section 10: Imputation module.
    Runs a tournament of imputation strategies, selects the best, and returns processed_df.
    Returns: (processed_df, metadata_dict)
    """
    if target_col is None:
        # Auto-detect first numeric column with missing values
        for col in df.select_dtypes(include=[np.number]).columns:
            if df[col].isna().sum() > 0:
                target_col = col
                break
        if target_col is None:
            target_col = df.select_dtypes(include=[np.number]).columns[0]
            
    processed_df = df.copy()
    series = processed_df[target_col]
    missing_mask = series.isna()
    missing_count = int(missing_mask.sum())
    
    # Mark which rows were imputed for charting
    processed_df[f"{target_col}_is_imputed"] = missing_mask
    
    if missing_count == 0:
        return processed_df, {
            "missing_values_found": 0,
            "values_imputed": 0,
            "method": "none",
            "target_col": target_col
        }
    
    # Tournament: We'll evaluate strategies on a known slice if possible
    # Create a synthetic test set by masking 10% of known values
    known_indices = np.where(~missing_mask)[0]
    
    if len(known_indices) > 10:
        mask_count = max(1, int(len(known_indices) * 0.1))
        test_indices = np.random.choice(known_indices, mask_count, replace=False)
    else:
        test_indices = []

    methods = {}
    
    # Method 1: Linear Interpolation
    s_linear = series.copy()
    if len(test_indices) > 0:
        s_linear.iloc[test_indices] = np.nan
    s_linear = s_linear.interpolate(method='linear', limit_direction='both')
    methods['Linear Interpolation'] = s_linear

    # Method 2: Forward Fill
    s_ffill = series.copy()
    if len(test_indices) > 0:
        s_ffill.iloc[test_indices] = np.nan
    s_ffill = s_ffill.ffill().bfill()
    methods['Forward Fill'] = s_ffill
    
    # Method 3: KNN
    def run_knn(s):
        n = len(s)
        feat = pd.DataFrame(index=s.index)
        feat['value'] = s
        feat['t'] = np.arange(n)
        feat['roll_mean_3'] = s.rolling(3, center=True, min_periods=1).mean()
        feat['roll_std_3'] = s.rolling(3, center=True, min_periods=1).std().fillna(0)
        imputer = KNNImputer(n_neighbors=min(5, len(s)), weights='distance')
        imputed_feat = imputer.fit_transform(feat)
        return pd.Series(imputed_feat[:, 0], index=s.index)

    s_knn_test = series.copy()
    if len(test_indices) > 0:
        s_knn_test.iloc[test_indices] = np.nan
    methods['KNN Imputation'] = run_knn(s_knn_test)

    best_method = 'Linear Interpolation'
    best_score = float('inf')

    if len(test_indices) > 0:
        actuals = series.iloc[test_indices]
        for name, pred_series in methods.items():
            preds = pred_series.iloc[test_indices]
            rmse = np.sqrt(np.mean((actuals - preds)**2))
            if rmse < best_score:
                best_score = rmse
                best_method = name

    # Apply the winning method to the actual missing data
    if best_method == 'Linear Interpolation':
        final_series = series.interpolate(method='linear', limit_direction='both')
    elif best_method == 'Forward Fill':
        final_series = series.ffill().bfill()
    else:
        final_series = run_knn(series)
        
    processed_df[target_col] = final_series

    metadata = {
        "missing_values_found": missing_count,
        "values_imputed": missing_count,
        "method": best_method,
        "tournament_score": best_score if best_score != float('inf') else None,
        "target_col": target_col
    }
    
    return processed_df, metadata


def auto_forecast(df, target_col, steps=6):
    """
    Fulfills PRD Section 10 & 11: Forecasting and generating the unified chart payload.
    Expects df to be the processed_df from auto_impute.
    Returns: list[dict] matching chart_payload.data schema
    """
    processed_values = df[target_col].tolist()
    
    is_imputed_col = f"{target_col}_is_imputed"
    if is_imputed_col in df.columns:
        is_imputed_mask = df[is_imputed_col].tolist()
    else:
        is_imputed_mask = [False] * len(processed_values)
        
    # Forecast with confidence intervals using auto_arima
    model = pm.auto_arima(
        processed_values, 
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
    
    # Historical + imputed rows
    for i, (val, is_imp) in enumerate(zip(processed_values, is_imputed_mask)):
        row = {
            "date": (base_date + timedelta(days=i*30)).strftime("%Y-%m-%d"),
            "historical": None if is_imp else val,
            "imputed": val if is_imp else None,
            "forecast": None,
            "lower_bound": None,
            "upper_bound": None
        }
        chart_data.append(row)
    
    # Forecast rows
    for i in range(steps):
        row = {
            "date": (base_date + timedelta(days=(len(processed_values)+i)*30)).strftime("%Y-%m-%d"),
            "historical": None,
            "imputed": None,
            "forecast": forecast_values[i],
            "lower_bound": lower_bounds[i],
            "upper_bound": upper_bounds[i]
        }
        chart_data.append(row)
    
    return chart_data