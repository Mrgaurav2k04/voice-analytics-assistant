from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest, ChatResponse
from utils.storage import get_dataset
from services.intent_service import parse_intent


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

    return ChatResponse(
        text="I understood your analytics request.",
        intent=intent.model_dump(),
        chart_payload=None,
        audio_base64=None
    )