"""Monitor: scrape Hindi + English news, detect disruptions via NLP."""
from datetime import date, datetime
from typing import Dict, Iterable, List, Optional

import feedparser

from core.database import supabase
from core.supabase_helpers import response_data

KEYWORDS_EN = [
    "supply chain",
    "factory shutdown",
    "flood",
    "semiconductor shortage",
    "disruption",
    "strike",
    "logistics",
    "shortage",
    "shutdown",
    "port congestion",
]

KEYWORDS_HI = [
    "आपूर्ति श्रृंखला",
    "बाढ़",
    "हड़ताल",
    "कारखाना",
    "कमी",
    "बंद",
    "supply chain",
    "flood",
    "strike",
]

RSS_FEEDS = [
    ("en", "https://feeds.bbci.co.uk/news/business/rss.xml"),
    ("en", "http://feeds.reuters.com/reuters/businessNews"),
    ("hi", "https://www.jagran.com/rss/business.xml"),
    ("hi", "https://economictimes.indiatimes.com/rssfeeds/13357212.cms"),
]

_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        try:
            import spacy

            _nlp = spacy.load("en_core_web_sm")
        except Exception:
            _nlp = False
    return _nlp if _nlp else None


def fetch_rss_entries() -> Iterable[Dict[str, str]]:
    for lang, rss_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(rss_url)
        except Exception:
            continue
        keywords = KEYWORDS_HI if lang == "hi" else KEYWORDS_EN
        for entry in feed.entries[:30]:
            title = entry.get("title", "")
            summary = entry.get("summary", entry.get("description", ""))
            link = entry.get("link", "")
            published = entry.get("published", entry.get("updated", ""))
            text = f"{title}\n{summary}".strip()
            lower = text.lower()
            if not any(k.lower() in lower for k in keywords):
                continue
            yield {
                "title": title,
                "summary": summary,
                "link": link,
                "published": published,
                "text": text,
                "lang": lang,
            }


def extract_entity(text: str, labels: List[str]) -> Optional[str]:
    nlp = _get_nlp()
    if not nlp:
        return None
    doc = nlp(text[:5000])
    for ent in doc.ents:
        if ent.label_ in labels:
            return ent.text
    return None


def classify_event_type(text: str) -> str:
    lower = text.lower()
    if "factory" in lower or "कारखाना" in lower:
        return "Factory Shutdown"
    if "flood" in lower or "बाढ़" in lower:
        return "Flood"
    if "strike" in lower or "हड़ताल" in lower:
        return "Strike"
    if "semiconductor" in lower or "chip" in lower:
        return "Semiconductor Shortage"
    if "port" in lower or "logistics" in lower:
        return "Logistics"
    if "pandemic" in lower or "covid" in lower:
        return "Pandemic"
    if "shortage" in lower or "कमी" in lower:
        return "Shortage"
    return "Supply Chain Disruption"


def classify_severity(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in ["critical", "severe", "major", "high", "urgent", "गंभीर"]):
        return "High"
    if any(w in lower for w in ["moderate", "medium", "significant"]):
        return "Medium"
    return "Low"


def _parse_date(value: str) -> str:
    if not value:
        return date.today().isoformat()
    for fmt in ("%Y-%m-%d", "%d %b %Y", "%a, %d %b %Y %H:%M:%S %z"):
        try:
            return datetime.strptime(value[:25], fmt).date().isoformat()
        except ValueError:
            continue
    return date.today().isoformat()


def build_disruption_row(entry: Dict[str, str]) -> Dict[str, object]:
    text = entry["text"]
    location = extract_entity(text, ["GPE", "LOC", "FAC"])
    event_type = classify_event_type(text)
    severity = classify_severity(text)
    industry = "Automotive" if "auto" in text.lower() else "Manufacturing"

    return {
        "location": location or "Global",
        "country": location,
        "event_type": event_type,
        "severity": severity,
        "affected_industry": industry,
        "start_date": _parse_date(entry.get("published", "")),
        "source_url": entry.get("link") or "",
    }


def _already_exists(source_url: str) -> bool:
    if not supabase:
        return False
    if not source_url:
        return False
    rows = response_data(
        supabase.table("disruption_events").select("id").eq("source_url", source_url).limit(1).execute()
    )
    return bool(rows)


def run_news_pipeline() -> dict:
    if not supabase:
        return {
            "fetched": 0,
            "saved": 0,
            "message": "Demo mode: add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env to save live news events.",
        }

    entries = list(fetch_rss_entries())
    saved = 0
    for entry in entries:
        row = build_disruption_row(entry)
        if _already_exists(row.get("source_url", "")):
            continue
        try:
            supabase.table("disruption_events").insert(row).execute()
            saved += 1
        except Exception:
            continue

    return {
        "fetched": len(entries),
        "saved": saved,
        "message": f"Processed {len(entries)} articles, saved {saved} new disruption events.",
    }
