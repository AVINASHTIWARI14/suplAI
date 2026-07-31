from fastapi import APIRouter, BackgroundTasks, Depends

from core.deps import get_optional_user
from core.models import PipelineResult
from services.nlp_service import run_news_pipeline

router = APIRouter()


@router.post("/run", response_model=PipelineResult)
def trigger_pipeline(background_tasks: BackgroundTasks, _user=Depends(get_optional_user)) -> PipelineResult:
    result = run_news_pipeline()
    return PipelineResult(**result)


@router.post("/run-async")
def trigger_pipeline_async(background_tasks: BackgroundTasks, _user=Depends(get_optional_user)) -> dict:
    background_tasks.add_task(run_news_pipeline)
    return {"message": "NLP pipeline started in background"}
