from fastapi import APIRouter, HTTPException
import sys
import os

# Add the project root to sys.path so ml_engine can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from models.schemas import ChatRequest, ChatResponse
from utils.storage import get_dataset
from services.intent_service import parse_intent
from ml_engine.engine import auto_impute, auto_forecast

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    dataset = get_dataset(request.file_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    df = dataset["processed_df"]

    try:
        intent = parse_intent(request.message, df)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    chart_payload = None

    if intent.operation == "forecast":
        # Use raw_df for ML forecasting to allow auto_impute to handle missing values
        ml_df = dataset["raw_df"].copy()
        if ml_df.empty:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data for forecasting"
            )
            
        if intent.target_column and intent.target_column not in ml_df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{intent.target_column}' not found in dataset"
            )
            
        try:
            # Impute any missing values first
            ml_df, impute_meta = auto_impute(ml_df, target_col=intent.target_column)
            
            # Forecast
            chart_payload = auto_forecast(
                df=ml_df, 
                target_col=intent.target_column, 
                steps=intent.horizon
            )
            chart_payload["imputation_method"] = impute_meta.get("method", "none")
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Forecasting engine error: {str(e)}"
            )

    return ChatResponse(
        text="I understood your analytics request.",
        intent=intent.model_dump(),
        chart_payload=chart_payload,
        audio_base64=None
    )