import uuid
import pandas as pd

from fastapi import APIRouter, UploadFile, File, HTTPException

from models.schemas import UploadResponse
from utils.storage import save_dataset, get_dataset
from utils.preprocessing import preprocess_dataset


router = APIRouter(prefix="/api", tags=["Upload"])

MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required"
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported"
        )

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds the 10 MB limit"
        )

    try:
        df = pd.read_csv(file.file)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read CSV file"
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty"
        )

    file_id = str(uuid.uuid4())

    processed_df, metadata = preprocess_dataset(df)

    save_dataset(
        file_id=file_id,
        raw_df=df,
        processed_df=processed_df,
        metadata=metadata
    )

    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        metadata=metadata
    )


@router.get("/dataset/{file_id}")
def get_dataset_info(file_id: str):
    dataset = get_dataset(file_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found"
        )

    raw_df = dataset["raw_df"]
    processed_df = dataset["processed_df"]

    return {
        "file_id": file_id,
        "raw_dataset": {
            "rows": len(raw_df),
            "columns": len(raw_df.columns)
        },
        "processed_dataset": {
            "rows": len(processed_df),
            "columns": len(processed_df.columns)
        },
        "metadata": dataset["metadata"]
    }