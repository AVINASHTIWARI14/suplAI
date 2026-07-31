"""CLI entry: python nlp_pipeline.py — runs news monitor + NLP detection."""
from services.nlp_service import run_news_pipeline

if __name__ == "__main__":
    result = run_news_pipeline()
    print(result["message"])
