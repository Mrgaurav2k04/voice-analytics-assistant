from typing import Literal

from pydantic import BaseModel, Field


class AnalyticsIntent(BaseModel):
    operation: Literal["forecast"] = "forecast"
    target_column: str
    horizon: int = Field(default=6, ge=1, le=24)
    visualization: Literal["line"] = "line"