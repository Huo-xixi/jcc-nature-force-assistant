from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    champion_ids: list[str] = Field(default_factory=list)
    item_ids: list[str] = Field(default_factory=list)
    top_k: int = Field(default=3, ge=1, le=10)


class VisionRecognitionRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    filename: str = Field(default="uploaded-image", max_length=255)


class ScoreBreakdown(BaseModel):
    champion_match: float
    item_fit: float
    trait_coverage: float
    meta_strength: float


class RecommendationResult(BaseModel):
    lineup_id: str
    lineup_name: str
    score: float
    breakdown: ScoreBreakdown
    missing_core_champions: list[str]
    craftable_recommended_items: list[str]
    explanation: list[str]
