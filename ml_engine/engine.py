import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer
import pmdarima as pm
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from datetime import datetime, timedelta

def auto_impute(df, target_col=None):
    """
    Automatically detects missing values and fills them using a tournament
    of imputation strategies (Linear, Forward Fill, KNN).
    Only missing values are replaced; known values are strictly preserved.
    """
    if target_col is None:
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
    
    processed_df[f"{target_col}_is_imputed"] = missing_mask
    
    if missing_count == 0:
        return processed_df, {
            "missing_values_found": 0,
            "values_imputed": 0,
            "method": "none",
            "target_col": target_col
        }
    
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

    if best_method == 'Linear Interpolation':
        final_series = series.interpolate(method='linear', limit_direction='both')
    elif best_method == 'Forward Fill':
        final_series = series.ffill().bfill()
    else:
        final_series = run_knn(series)
        
    # Crucial Fix: Only replace missing values, preserve all known values exactly
    processed_df.loc[missing_mask, target_col] = final_series[missing_mask]

    metadata = {
        "missing_values_found": missing_count,
        "values_imputed": missing_count,
        "method": best_method,
        "tournament_score": float(best_score) if best_score != float('inf') else None,
        "target_col": target_col
    }
    
    return processed_df, metadata

def auto_forecast(df, target_col, steps=6):
    """
    Forecasts future values for a given column. 
    Uses a tournament between Auto-ARIMA and Exponential Smoothing.
    Returns a strict JSON-serializable dictionary output.
    """
    series = df[target_col].tolist()
    is_imputed_col = f"{target_col}_is_imputed"
    if is_imputed_col in df.columns:
        is_imputed_mask = df[is_imputed_col].tolist()
    else:
        is_imputed_mask = [False] * len(series)
        
    # Time/Timestamp handling
    time_col = None
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            time_col = col
            break
            
    timestamps = []
    future_timestamps = []
    if time_col:
        dates = df[time_col].tolist()
        timestamps = [d.strftime("%Y-%m-%d %H:%M:%S") if pd.notnull(d) else str(i) for i, d in enumerate(dates)]
        
        if len(dates) >= 2:
            avg_diff = (dates[-1] - dates[0]) / (len(dates) - 1)
            last_date = dates[-1]
            for i in range(1, steps + 1):
                future_timestamps.append((last_date + (avg_diff * i)).strftime("%Y-%m-%d %H:%M:%S"))
        else:
            for i in range(1, steps + 1):
                future_timestamps.append(str(len(series) + i - 1))
    else:
        timestamps = [str(i) for i in range(len(series))]
        future_timestamps = [str(len(series) + i) for i in range(steps)]
        
    # Tournament: Auto-ARIMA vs Exponential Smoothing
    val_size = min(steps, max(1, len(series) // 5))
    if len(series) > 10:
        train_series = series[:-val_size]
        test_series = series[-val_size:]
        
        models = {}
        
        # 1. Auto-ARIMA
        try:
            arima_model = pm.auto_arima(train_series, seasonal=False, stepwise=True, suppress_warnings=True, error_action='ignore')
            arima_preds = arima_model.predict(n_periods=val_size)
            arima_rmse = np.sqrt(np.mean((np.array(test_series) - np.array(arima_preds))**2))
            models['Auto-ARIMA'] = arima_rmse
        except:
            models['Auto-ARIMA'] = float('inf')
            
        # 2. Exponential Smoothing
        try:
            hw_model = ExponentialSmoothing(train_series, trend='add', seasonal=None, initialization_method="estimated").fit()
            hw_preds = hw_model.forecast(val_size)
            hw_rmse = np.sqrt(np.mean((np.array(test_series) - np.array(hw_preds))**2))
            models['Exponential Smoothing'] = hw_rmse
        except:
            models['Exponential Smoothing'] = float('inf')
            
        best_model_name = min(models, key=models.get)
        if models[best_model_name] == float('inf'):
            best_model_name = 'Auto-ARIMA' # fallback
    else:
        best_model_name = 'Auto-ARIMA'
        
    # Refit best model on ALL data
    forecast_values = []
    lower_bounds = []
    upper_bounds = []
    
    if best_model_name == 'Auto-ARIMA':
        try:
            model = pm.auto_arima(series, seasonal=False, stepwise=True, suppress_warnings=True, error_action='ignore')
            preds, conf_int = model.predict(n_periods=steps, return_conf_int=True)
            forecast_values = preds.tolist()
            lower_bounds = conf_int[:, 0].tolist()
            upper_bounds = conf_int[:, 1].tolist()
        except Exception as e:
            # Absolute fallback
            forecast_values = [series[-1]] * steps
            lower_bounds = [series[-1] * 0.9] * steps
            upper_bounds = [series[-1] * 1.1] * steps
    else:
        try:
            model = ExponentialSmoothing(series, trend='add', seasonal=None, initialization_method="estimated").fit()
            preds = model.forecast(steps)
            forecast_values = preds.tolist()
            # HW doesn't give confidence intervals easily out of the box in statsmodels, approximate with historical std
            std = float(np.std(series))
            lower_bounds = [p - (1.96 * std) for p in forecast_values]
            upper_bounds = [p + (1.96 * std) for p in forecast_values]
        except Exception as e:
            forecast_values = [series[-1]] * steps
            lower_bounds = [series[-1] * 0.9] * steps
            upper_bounds = [series[-1] * 1.1] * steps

    # Construct final output dictionary
    historical = []
    imputed = []
    for i, (val, is_imp, ts) in enumerate(zip(series, is_imputed_mask, timestamps)):
        if is_imp:
            imputed.append({"timestamp": ts, "value": float(val)})
        else:
            historical.append({"timestamp": ts, "value": float(val)})
            
    forecast = []
    f_lower = []
    f_upper = []
    for i in range(steps):
        ts = future_timestamps[i]
        forecast.append({"timestamp": ts, "value": float(forecast_values[i])})
        f_lower.append({"timestamp": ts, "value": float(lower_bounds[i])})
        f_upper.append({"timestamp": ts, "value": float(upper_bounds[i])})
        
    return {
        "target_column": target_col,
        "historical": historical,
        "imputed": imputed,
        "forecast": forecast,
        "forecast_lower": f_lower,
        "forecast_upper": f_upper,
        "model": best_model_name
    }