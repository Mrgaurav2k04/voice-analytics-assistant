import numpy as np
import pandas as pd
from engine import auto_impute, auto_forecast

def run_evaluation_harness():
    print("Running Autonomous Imputation Evaluation Harness...")
    test_cases = 10
    total_rmse = 0
    passed = 0
    
    for i in range(test_cases):
        np.random.seed(i)
        clean_data = np.linspace(10, 50, 50) + np.random.normal(0, 2, 50)
        
        corrupted_data = clean_data.copy()
        missing_indices = np.random.choice(50, 10, replace=False)
        corrupted_data[missing_indices] = np.nan
        
        df = pd.DataFrame({"consumption": corrupted_data})
        
        # UNPACK TUPLE
        processed_df, metadata = auto_impute(df, target_col="consumption")
        imputed_array = processed_df["consumption"].values
        
        errors = [
            (imputed_array[idx] - clean_data[idx])**2 
            for idx in missing_indices
        ]
        
        rmse = np.sqrt(np.mean(errors))
        total_rmse += rmse
        
        threshold = 3.0
        if rmse < threshold:
            passed += 1
        status = '✓' if rmse < threshold else '✗'
        print(f"  Case {i+1}: RMSE={rmse:.2f} {status} | {metadata['method']}")

    avg_rmse = total_rmse / test_cases
    print(f"\nAverage RMSE across {test_cases} test cases: {avg_rmse:.2f}")
    print(f"Passed: {passed}/{test_cases} (threshold: {threshold})")
    
    # Test forecasting
    print("\nTesting forecast output schema...")
    df_full = pd.DataFrame({"consumption": clean_data})
    chart_data = auto_forecast(df_full, "consumption", steps=6)
    
    required_keys = {"date", "historical", "imputed", "forecast", "lower_bound", "upper_bound"}
    assert all(set(row.keys()) == required_keys for row in chart_data), "Schema mismatch"
    assert len(chart_data) == 56, f"Expected 56 rows (50 hist + 6 forecast), got {len(chart_data)}"
    
    # Verify historical/imputed separation works
    hist_count = sum(1 for r in chart_data if r['historical'] is not None)
    imp_count = sum(1 for r in chart_data if r['imputed'] is not None)
    fcst_count = sum(1 for r in chart_data if r['forecast'] is not None)
    
    print("  Forecast schema: ✓")
    print(f"  Total rows: {len(chart_data)}")
    print(f"  Historical rows: {hist_count}")
    print(f"  Imputed rows: {imp_count}")
    print(f"  Forecast rows: {fcst_count}")

if __name__ == "__main__":
    run_evaluation_harness()