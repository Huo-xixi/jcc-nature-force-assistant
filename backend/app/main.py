from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .schemas.domain import RecommendationRequest, RecommendationResult, VisionRecognitionRequest
from .services.data_repository import JsonDataRepository
from .services.recommendation import RecommendationService
from .services.vision import recognize_one_cost_base64


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "processed" / "s18_18_4"
repository = JsonDataRepository(DATA_DIR)
service = RecommendationService(repository)

app = FastAPI(
    title="金铲铲自然之力智能推荐 API",
    version="0.1.0",
    description="课程创新实践项目的可解释推荐后端原型。",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["null", "http://127.0.0.1:4173", "http://localhost:4173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "dataset": repository.metadata["dataset_id"]}


@app.get("/api/v1/data/summary")
def data_summary() -> dict:
    return repository.summary()


@app.post("/api/v1/recommendations", response_model=list[RecommendationResult])
def recommendations(request: RecommendationRequest) -> list[dict]:
    return service.recommend(request.champion_ids, request.item_ids, request.top_k)


@app.post("/api/v1/vision/recognize-one-cost")
def recognize_one_cost(request: VisionRecognitionRequest) -> dict:
    return recognize_one_cost_base64(request.image_base64, request.filename)
