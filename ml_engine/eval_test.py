import pandas as pd
import numpy as np
from engine import auto_impute

def run_evaluation_harness():
    print("Running Autonomous Imputation Evaluation Harness...")
    test_cases = 10
    total_rmse = 0
    
    for i in range(test_cases):
        np.random.seed(i)
        clean_data = np.linspace(10, 50, 50) + np.random.normal(0, 2, 50)
        
        # Artificially punch holes (corruption)
        corrupted_data = clean_data.copy()
        missing_indices = np.random.choice(50, 10, replace=False)
        corrupted_data[missing_indices] = np.nan
        
        df = pd.DataFrame({"consumption": corrupted_data})
        imputed_array = auto_impute(df, target_col="consumption")
        
        errors = [
            (imputed_array[idx] - clean_data[idx])**2 
            for idx in missing_indices
        ]
        
        rmse = np.sqrt(np.mean(errors))
        total_rmse += rmse
        print(f"Test Case {i+1} | Imputation RMSE: {rmse:.2f}")

    print(f"\nAverage RMSE across {test_cases} test cases: {total_rmse/test_cases:.2f}")

if __name__ == "__main__":
    run_evaluation_harness()