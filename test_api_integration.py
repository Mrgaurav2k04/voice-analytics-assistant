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
    chat_payload = {
        "message": "Forecast Sales for the next 6 months",
        "file_id": file_id
    }
    
    response = client.post("/api/chat", json=chat_payload)
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
    
    print(f"[ML Engine] Model Selected: {chart_payload['model']}")
    print(f"[ML Engine] Imputed records: {len(chart_payload['imputed'])}")
    print(f"[ML Engine] Forecast records: {len(chart_payload['forecast'])}")
    print("Integration test passed successfully!")

if __name__ == "__main__":
    test_upload_and_forecast()
