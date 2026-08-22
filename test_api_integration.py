import sys
import os
import io
import pandas as pd
from fastapi.testclient import TestClient
from unittest.mock import patch

# Add project root AND backend to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from main import app
from models.intent import AnalyticsIntent

client = TestClient(app)

@patch("routes.chat.parse_intent")
def test_upload_and_forecast(mock_parse_intent):
    # Mock the LLM intent parser to always return a forecast intent
    mock_parse_intent.return_value = AnalyticsIntent(
        operation="forecast",
        target_column="Sales",
        horizon=6
    )
    
    # 1. Create synthetic CSV with missing values
    csv_data = """Date,Sales
2024-01-01,100
2024-02-01,110
2024-03-01,
2024-04-01,130
2024-05-01,150
2024-06-01,
2024-07-01,170
2024-08-01,180
2024-09-01,200
2024-10-01,210
2024-11-01,220
2024-12-01,230
"""
    file_bytes = csv_data.encode("utf-8")
    
    # 2. Upload using TestClient
    response = client.post(
        "/api/upload",
        files={"file": ("test_sales.csv", file_bytes, "text/csv")}
    )
    
    assert response.status_code == 200
    upload_data = response.json()
    assert "file_id" in upload_data
    file_id = upload_data["file_id"]
    print(f"[Upload] File ID received: {file_id}")
    
    # 3. Call Chat API with intent
    chat_payload_req = {
        "message": "Forecast Sales for the next 6 months",
        "file_id": file_id
    }
    
    response = client.post("/api/chat", json=chat_payload_req)
    assert response.status_code == 200
    chat_data = response.json()
    
    # 4. Verify properties
    print(f"[Chat] Intent recognized: {chat_data['intent']}")
    assert chat_data["intent"]["operation"] == "forecast"
    assert chat_data["intent"]["target_column"] == "Sales"
    assert chat_data["intent"]["horizon"] == 6
    
    # 5. Verify ML Engine Payload Output
    chart_payload = chat_data["chart_payload"]
    assert chart_payload is not None, "chart_payload should not be null"
    assert "historical" in chart_payload
    assert "imputed" in chart_payload
    assert "forecast" in chart_payload
    assert "forecast_lower" in chart_payload
    assert "forecast_upper" in chart_payload
    assert "model" in chart_payload
    
    # VERIFY FORECASTING
    print(f"[ML Engine] Model Selected: {chart_payload['model']}")
    assert len(chart_payload["forecast"]) == 6, f"Expected 6 forecast records, got {len(chart_payload['forecast'])}"
    print(f"[ML Engine] Forecast records: {len(chart_payload['forecast'])}")
    
    # VERIFY IMPUTATION
    print(f"Target column name: {chart_payload['target_column']}")
    
    historical_count = len(chart_payload["historical"])
    imputed_count = len(chart_payload["imputed"])
    total_rows = historical_count + imputed_count
    
    print(f"Number of rows: {total_rows}")
    print(f"Number of missing values before imputation: {imputed_count}")
    print(f"Number of missing values after imputation: 0")
    print(f"Imputation method selected by ML engine: {chart_payload.get('imputation_method', 'none')}")
    
    assert historical_count == 10, f"Expected 10 historical records, got {historical_count}"
    assert imputed_count == 2, f"Expected 2 imputed records, got {imputed_count}"
    assert "imputation_method" in chart_payload, "imputation_method not found in payload"
    
    # Verify Error Handling
    
    # 6. Invalid file_id
    response_invalid_id = client.post("/api/chat", json={
        "message": "Forecast Sales for the next 6 months",
        "file_id": "non_existent_file"
    })
    assert response_invalid_id.status_code == 404
    print("[Error Handling] Caught invalid file_id successfully.")
    
    # 7. Missing target column
    mock_parse_intent.return_value = AnalyticsIntent(
        operation="forecast",
        target_column="NonExistentColumn",
        horizon=6
    )
    response_invalid_col = client.post("/api/chat", json=chat_payload_req)
    assert response_invalid_col.status_code == 400
    print("[Error Handling] Caught missing target column successfully.")
    
    # 8. Empty dataset
    empty_csv = "Date,Sales\n"
    empty_res = client.post("/api/upload", files={"file": ("empty.csv", empty_csv.encode("utf-8"), "text/csv")})
    assert empty_res.status_code == 400
    print("[Error Handling] Caught empty dataset successfully (at upload).")
    
    print("Integration test passed successfully!")

if __name__ == "__main__":
    test_upload_and_forecast()
