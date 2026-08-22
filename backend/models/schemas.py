from pydantic import BaseModel
from typing import Optional


class DatasetMetadata(BaseModel):
    rows: int
    columns: int
    column_names: list[str]
    numeric_columns: list[str]
    missing_values: int
    imputed_values: int
    status: str


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    metadata: DatasetMetadata


class ChatRequest(BaseModel):
    message: str
    file_id: str


class ChatResponse(BaseModel):
    text: str
    intent: Optional[dict] = None
    chart_payload: Optional[dict] = None
    audio_base64: Optional[str] = None