from fastapi import FastAPI

from routes.upload import router as upload_router
from routes.chat import router as chat_router


app = FastAPI(
    title="Voice Analytics Assistant API",
    version="1.0.0"
)


app.include_router(upload_router)
app.include_router(chat_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }