import numpy as np
import pandas as pd
from engine import auto_impute, auto_forecast
import warnings

warnings.filterwarnings("ignore")

def generate_synthetic_datasets(n=10):
    datasets = []
    for i in range(n):
        np.random.seed(42 + i)
        n_samples = 100
        
        # Base patterns
        if i % 3 == 0:
            # Linear trend
            clean_data = np.linspace(10, 50, n_samples)
        elif i % 3 == 1:
            # Sine wave seasonality
            clean_data = 20 + 10 * np.sin(np.linspace(0, 4 * np.pi, n_samples))
        else:
            # Random walk
            clean_data = np.cumsum(np.random.normal(0, 1, n_samples)) + 50
            
        # Add noise
        clean_data += np.random.normal(0, 2, n_samples)
        
        # Create corrupted version for imputation testing
        corrupted_data = clean_data.copy()
        missing_indices = np.random.choice(n_samples, int(n_samples * 0.15), replace=False)
        corrupted_data[missing_indices] = np.nan
        
        df = pd.DataFrame({"value": corrupted_data})
        datasets.append({
            "id": i + 1,
            "df": df,
            "clean_data": clean_data,
            "missing_indices": missing_indices
        })
    return datasets

def run_evaluation_harness():
    print("==================================================")
    print("Starting ML/Time-Series Evaluation Harness")
    print("==================================================\n")
    
    datasets = generate_synthetic_datasets(10)
    
    total_imputation_mae = 0
    total_forecast_mae = 0
    
    for ds in datasets:
        print(f"Dataset {ds['id']}:")
        df = ds['df']
        clean_data = ds['clean_data']
        missing_indices = ds['missing_indices']
        
        # 1. Test Imputation
        processed_df, meta = auto_impute(df, target_col="value")
        imputed_array = processed_df["value"].values
        
        imp_errors = [abs(imputed_array[idx] - clean_data[idx]) for idx in missing_indices]
        imp_mae = np.mean(imp_errors) if imp_errors else 0
        total_imputation_mae += imp_mae
        print(f"  [Imputation] Method: {meta['method']} | MAE: {imp_mae:.2f}")
        
        # 2. Test Forecasting
        # To test forecasting, we hold out the last 10 points
        holdout_steps = 10
        train_clean = clean_data[:-holdout_steps]
        test_clean = clean_data[-holdout_steps:]
        
        train_df = pd.DataFrame({"value": train_clean})
        # Mock imputation metadata required by forecast
        train_df["value_is_imputed"] = [False] * len(train_clean)
        
        forecast_res = auto_forecast(train_df, "value", steps=holdout_steps)
        forecast_vals = [f["value"] for f in forecast_res["forecast"]]
        
        f_errors = [abs(forecast_vals[i] - test_clean[i]) for i in range(holdout_steps)]
        f_mae = np.mean(f_errors)
        total_forecast_mae += f_mae
        print(f"  [Forecast]   Model: {forecast_res['model']} | MAE: {f_mae:.2f}\n")
        
    avg_imp_mae = total_imputation_mae / len(datasets)
    avg_f_mae = total_forecast_mae / len(datasets)
    
    print("==================================================")
    print("Final Average Results across 10 datasets:")
    print(f"Imputation MAE: {avg_imp_mae:.2f}")
    print(f"Forecast MAE:   {avg_f_mae:.2f}")
    print("==================================================")

if __name__ == "__main__":
    run_evaluation_harness()