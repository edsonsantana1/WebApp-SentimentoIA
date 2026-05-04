import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from urllib.parse import quote

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class ApifyService:
    """Coleta menções reais via Apify Actors.

    Regras:
    - Nunca cria dados mockados.
    - Salva somente itens retornados por Apify.
    - Mantém autor, URL, nota, data e raw quando o Actor fornecer.
    - Se um Actor falhar ou retornar schema inesperado, registra em connector_errors.
    """

    ACTOR_DEFAULTS = {
        "google": "compass~crawler-google-places",
        "instagram": "apify~instagram-tagged-scraper",
        "x": "api-ninja~x-twitter-advanced-search",
        "twitter": "api-ninja~x-twitter-advanced-search",
    }

    def __init__(self) -> None:
        self.api_key = settings.APIFY_API_KEY
        self.base_url = settings.APIFY_API_URL.rstrip("/")
        self.timeout = httpx.Timeout(240.0, connect=30.0)

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and "xxxx" not in self.api_key)

    def configured_sources(self) -> Dict[str, bool]:
        sources = ["google", "instagram", "yelp", "x", "trustpilot", "tripadvisor", "facebook"]
        return {source: bool(self._actor_for_source(source)) for source in sources}


    async def collect_mentions(
        self,
        brand_name: str,
        sources: List[str],
        period_days: int = 30,
        locality: Optional[str] = None,
        max_items: int = 50,
    ) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        mentions: List[Dict[str, Any]] = []
        connector_errors: List[Dict[str, Any]] = []

        if not self.is_configured():
            return [], [{"source": "apify", "error": "APIFY_API_KEY não configurada ou ainda está como placeholder"}]

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for source in sources:
                source = self._normalize_source_name(source)
                actor_id = self._actor_for_source(source)
                if not actor_id:
                    connector_errors.append({
                        "source": source,
                        "error": "Fonte selecionada sem Actor configurado no .env",
                    })
                    continue

                run_input = self._build_input(source, brand_name, period_days, locality, max_items)

                try:
                    raw_items = await self._run_actor(client, actor_id, run_input)
                    source_mentions = self._normalize_items(
                        raw_items,
                        source=source,
                        brand_name=brand_name,
                        period_days=period_days,
                    )
                    mentions.extend(source_mentions)
                    if not source_mentions:
                        connector_errors.append({
                            "source": source,
                            "actor": actor_id,
                            "error": "Actor executou, mas não retornou menções normalizáveis para esta busca",
                        })
                    logger.info("✓ Apify %s retornou %s itens normalizados", source, len(source_mentions))
                except Exception as exc:
                    logger.exception("✗ Falha no conector Apify %s", source)
                    connector_errors.append({"source": source, "actor": actor_id, "error": str(exc)})

        unique: List[Dict[str, Any]] = []
        seen = set()
        for mention in mentions:
            key = (
                mention.get("source"),
                mention.get("source_id") or "",
                mention.get("url") or "",
                (mention.get("text") or "")[:220],
                mention.get("author") or "",
            )
            if key in seen:
                continue
            seen.add(key)
            unique.append(mention)

        return unique, connector_errors

    async def _run_actor(self, client: httpx.AsyncClient, actor_id: str, run_input: Dict[str, Any]) -> List[Dict[str, Any]]:
        encoded_actor = quote(actor_id, safe="~")
        url = f"{self.base_url}/acts/{encoded_actor}/run-sync-get-dataset-items"
        params = {
            "token": self.api_key,
            "clean": "true",
            "format": "json",
            "memory": "1024",
            "timeout": "180",
        }
        response = await client.post(url, params=params, json=run_input)
        if response.status_code >= 400:
            raise RuntimeError(f"Apify HTTP {response.status_code}: {response.text[:1000]}")
        data = response.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            if isinstance(data.get("items"), list):
                return data["items"]
            if isinstance(data.get("data"), list):
                return data["data"]
            return [data]
        return []

    def _actor_for_source(self, source: str) -> Optional[str]:
        env_map = {
            "google": settings.APIFY_ACTOR_GOOGLE,
            "instagram": settings.APIFY_ACTOR_INSTAGRAM,
            "yelp": settings.APIFY_ACTOR_YELP,
            "x": settings.APIFY_ACTOR_X,
            "twitter": settings.APIFY_ACTOR_X,
            "trustpilot": settings.APIFY_ACTOR_TRUSTPILOT,
            "tripadvisor": settings.APIFY_ACTOR_TRIPADVISOR,
            "facebook": settings.APIFY_ACTOR_FACEBOOK,
        }
        actor = env_map.get(source) or self.ACTOR_DEFAULTS.get(source)
        return actor.strip() if isinstance(actor, str) and actor.strip() else None

    def _build_input(self, source: str, brand_name: str, period_days: int, locality: Optional[str], max_items: int) -> Dict[str, Any]:
        query = f"{brand_name} {locality}".strip() if locality else brand_name
        since = (datetime.now(timezone.utc) - timedelta(days=period_days)).date().isoformat()

        if source == "google":
            return {
                "searchStringsArray": [query],
                "searchStrings": [query],
                "query": query,
                "language": "pt-BR",
                "maxReviews": max_items,
                "maxItems": max_items,
                "reviewsSort": "newest",
                "includeReviews": True,
                "personalData": True,
                "reviewsStartDate": since,
            }

        if source == "instagram":
            username = brand_name.replace("@", "").replace(" ", "").strip()
            return {
                "usernames": [username],
                "username": username,
                "resultsLimit": max_items,
                "maxItems": max_items,
                "includeComments": True,
                "search": query,
            }

        if source in {"x", "twitter"}:
            return {
                "query": f'"{query}" lang:pt -is:retweet',
                "queries": [f'"{query}" lang:pt -is:retweet'],
                "maxItems": max_items,
                "sort": "Latest",
                "startDate": since,
                "lang": "pt",
            }

        if source == "yelp":
            return {
                "searchTerms": [query],
                "search": query,
                "query": query,
                "location": locality or "",
                "maxItems": max_items,
                "maxReviews": max_items,
                "sortBy": "date_desc",
            }

        # Estas fontes exigem actor configurado e podem ter schema próprio.
        return {
            "query": query,
            "search": query,
            "searchStrings": [query],
            "maxItems": max_items,
            "maxReviews": max_items,
            "language": "pt-BR",
            "startDate": since,
        }

    def _normalize_items(self, items: List[Dict[str, Any]], source: str, brand_name: str, period_days: int) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        cutoff = datetime.utcnow() - timedelta(days=period_days)

        for item in items:
            candidates = [item] + self._extract_nested_mentions(item)
            for candidate in candidates:
                text = self._first_text(candidate, [
                    "text", "reviewText", "review", "caption", "description", "content", "fullText",
                    "tweetText", "comment", "body", "message", "snippet", "originalText", "translatedText",
                    "title",
                ])
                if not text or not text.strip():
                    continue

                published_at = self._first_date(candidate, [
                    "publishedAt", "publishedDate", "date", "createdAt", "timestamp", "time", "reviewDate",
                    "takenAt", "created_at",
                ])
                if published_at and published_at < cutoff:
                    continue

                author = self._first_text(candidate, [
                    "author", "authorName", "reviewerName", "reviewer", "userName", "username",
                    "ownerUsername", "screenName", "profileName", "name", "fullName", "user",
                ])
                url = self._first_text(candidate, [
                    "url", "reviewUrl", "postUrl", "tweetUrl", "link", "permalink", "placeUrl", "sourceUrl",
                ])
                rating = self._first_number(candidate, ["rating", "stars", "score", "reviewRating", "starRating"])
                source_id = self._first_text(candidate, ["id", "reviewId", "postId", "tweetId", "shortCode", "pk"]) or url or ""

                normalized.append({
                    "brand_name": brand_name,
                    "source": source,
                    "source_id": str(source_id),
                    "text": text.strip(),
                    "author": author,
                    "rating": rating,
                    "url": url,
                    "published_at": published_at or datetime.utcnow(),
                    "raw": candidate,
                })

        return normalized

    def _extract_nested_mentions(self, item: Dict[str, Any]) -> List[Dict[str, Any]]:
        nested_keys = [
            "reviews", "comments", "latestComments", "topComments", "items", "posts", "tweets",
            "results", "data", "mentions", "replies",
        ]
        nested: List[Dict[str, Any]] = []
        for key in nested_keys:
            value = item.get(key)
            if isinstance(value, list):
                nested.extend([v for v in value if isinstance(v, dict)])
        return nested

    def _first_text(self, item: Dict[str, Any], keys: List[str]) -> Optional[str]:
        for key in keys:
            value = item.get(key)
            text = self._coerce_text(value)
            if text:
                return text
        return None

    def _coerce_text(self, value: Any) -> Optional[str]:
        if isinstance(value, str) and value.strip():
            return value
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, dict):
            for subkey in ("text", "name", "fullName", "username", "title", "body", "content"):
                sub = value.get(subkey)
                if isinstance(sub, str) and sub.strip():
                    return sub
        return None

    def _first_number(self, item: Dict[str, Any], keys: List[str]) -> Optional[float]:
        for key in keys:
            value = item.get(key)
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                try:
                    return float(value.replace(",", "."))
                except ValueError:
                    pass
            if isinstance(value, dict):
                for subkey in ("rating", "value", "score"):
                    sub = value.get(subkey)
                    if isinstance(sub, (int, float)):
                        return float(sub)
        return None

    def _first_date(self, item: Dict[str, Any], keys: List[str]) -> datetime:
        for key in keys:
            parsed = self._parse_date(item.get(key))
            if parsed:
                return parsed
        return datetime.utcnow()

    def _parse_date(self, value: Any) -> Optional[datetime]:
        if isinstance(value, datetime):
            return value.replace(tzinfo=None)
        if isinstance(value, (int, float)):
            try:
                if value > 10_000_000_000:
                    value = value / 1000
                return datetime.fromtimestamp(value, tz=timezone.utc).replace(tzinfo=None)
            except Exception:
                return None
        if isinstance(value, str) and value.strip():
            raw = value.strip().replace("Z", "+00:00")
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
                try:
                    return datetime.strptime(raw[:10], fmt)
                except Exception:
                    pass
            try:
                return datetime.fromisoformat(raw).replace(tzinfo=None)
            except Exception:
                return None
        return None

    def _normalize_source_name(self, source: str) -> str:
        source = (source or "").lower().strip()
        if source == "twitter":
            return "x"
        return source
