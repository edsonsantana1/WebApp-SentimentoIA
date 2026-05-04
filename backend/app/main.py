import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.api.auth_router import router as auth_router
from app.auth_utils import get_current_user
from app.config import settings
from app.database import MongoDB, get_db
from app.models import SearchRequest
from app.services.collector_service import CollectorService
from app.services.enrichment_service import EnrichmentService
from app.services.llm_service import LLMService
from app.services.normalization_service import normalize_mention, utcnow
from app.services.report_service import ReportService
from app.services.search_service import SearchService

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    text: str
    brand_name: str | None = None
    source: str = "manual"


async def auto_refresh_loop() -> None:
    """Atualização automática opcional.

    Quando AUTO_REFRESH_ENABLED=True, o backend reexecuta buscas recentes.
    Isso mantém dashboard/histórico vivos sem depender do usuário clicar novamente.
    """
    while settings.AUTO_REFRESH_ENABLED:
        try:
            db = get_db()
            if db is not None:
                jobs = list(db.search_jobs.find({"status": "completed"}).sort("created_at", -1).limit(20))
                for job in jobs:
                    await SearchService.run_search(
                        user_id=job["user_id"],
                        query=job["query"],
                        sources=job.get("sources", ["google", "reddit", "x"]),
                        period_days=job.get("period_days", 30),
                        locality=job.get("locality"),
                        use_cache=False,
                    )
        except Exception as exc:
            logger.error("Erro no auto refresh: %s", exc)

        await asyncio.sleep(settings.AUTO_REFRESH_INTERVAL_MINUTES * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await MongoDB.connect_db()

    task = None
    if settings.AUTO_REFRESH_ENABLED:
        task = asyncio.create_task(auto_refresh_loop())

    try:
        yield
    finally:
        if task:
            task.cancel()
        await MongoDB.close_db()


app = FastAPI(
    title="SentimentoIA API",
    description="Backend sem Apify: Google Places, Reddit, X/snscrape, OpenRouter/Ollama, MongoDB, CSV/PDF.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Autenticação"])


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Evita que exceções inesperadas virem resposta HTML quebrada no frontend."""
    logger.exception("Erro não tratado: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": str(exc),
            "path": str(request.url.path),
        },
    )


@app.get("/health")
async def health():
    """Healthcheck simples para saber se o backend está ativo."""
    return {"ok": True, "service": "SentimentoIA API", "version": "2.0.0"}


@app.get("/api/status/integrations")
async def integrations_status():
    """Mostra se as integrações principais estão configuradas."""
    llm = await LLMService.healthcheck()
    return {
        "google_places_configured": bool(settings.GOOGLE_PLACES_API_KEY and settings.GOOGLE_PLACES_API_KEY != "SUA_CHAVE_GOOGLE_PLACES"),
        "reddit_public_enabled": True,
        "x_snscrape_enabled": settings.X_SNSCRAPE_ENABLED,
        "mongodb_configured": bool(settings.MONGODB_URI),
        "llm": llm,
        "apify_removed": True,
    }


@app.post("/api/search")
async def search_mentions(payload: SearchRequest, current_user: dict[str, Any] = Depends(get_current_user)):
    """Executa busca real e salva tudo por search_id.

    Entrada esperada:
    {
      "brand_name": "Nike",
      "sources": ["google", "reddit", "x"],
      "period_days": 30,
      "locality": "São Paulo",
      "replace_existing": false
    }

    Observação:
    - replace_existing=True força nova busca.
    - replace_existing=False permite cache inteligente por CACHE_TTL_MINUTES.
    """
    sources = [getattr(source, "value", str(source)) for source in payload.sources]
    user_id = str(current_user.get("_id") or current_user.get("id"))

    result = await SearchService.run_search(
        user_id=user_id,
        query=payload.brand_name,
        sources=sources,
        period_days=payload.period_days,
        locality=payload.locality,
        use_cache=not payload.replace_existing,
    )
    return result


@app.get("/api/dashboard")
async def dashboard(
    search_id: str | None = Query(None),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Retorna dados do dashboard da última busca ou de um search_id específico."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    return SearchService.dashboard(user_id, search_id)


@app.get("/api/mentions")
async def mentions(
    search_id: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Lista menções da última busca do usuário ou de um search_id específico."""
    db = get_db()
    user_id = str(current_user.get("_id") or current_user.get("id"))

    if not search_id:
        last = db.search_jobs.find_one({"user_id": user_id, "status": "completed"}, sort=[("created_at", -1)])
        if not last:
            return []
        search_id = last["search_id"]

    data = list(
        db.mentions.find({"user_id": user_id, "search_id": search_id}, {"raw": 0})
        .sort("published_at", -1)
        .limit(limit)
    )
    return SearchService.serialize_many(data)


@app.get("/api/insights")
async def insights(
    search_id: str | None = Query(None),
    refresh: bool = Query(False),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Retorna insights da IA para a última busca do usuário."""
    db = get_db()
    user_id = str(current_user.get("_id") or current_user.get("id"))

    query: dict[str, Any] = {"user_id": user_id, "status": "completed"}
    if search_id:
        query["search_id"] = search_id

    job = db.search_jobs.find_one(query, sort=[("created_at", -1)])
    if not job:
        return LLMService.empty_analysis("Execute uma busca real para gerar insights.")

    llm_analysis = job.get("llm_analysis") or {}
    llm_text = str(llm_analysis)
    has_stale_llm = (
        not llm_analysis
        or "GROK_API_KEY" in llm_text
        or "GROK_MODEL" in llm_text
        or "LLM indispon" in llm_text
    )

    if refresh or has_stale_llm:
        mentions = list(db.mentions.find({"user_id": user_id, "search_id": job["search_id"]}, {"raw": 0}).sort("published_at", -1))
        llm_analysis = await LLMService.analyze_mentions(job.get("query") or "", mentions)
        db.search_jobs.update_one(
            {"_id": job["_id"]},
            {"$set": {"llm_analysis": llm_analysis, "updated_at": utcnow()}},
        )
        return llm_analysis

    return llm_analysis


@app.post("/api/analyze")
async def analyze(
    payload: AnalyzeRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Analisa um texto manualmente e salva como menção do usuário."""
    db = get_db()
    user_id = str(current_user.get("_id") or current_user.get("id"))
    text = payload.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Texto não pode estar vazio")

    search_id = f"manual-{user_id}"
    query = payload.brand_name or "Análise Manual"
    mention = normalize_mention(
        query=query,
        source=payload.source or "manual",
        text=text,
        author="manual",
        published_at=utcnow(),
        raw={"manual": True},
    )
    if not mention:
        raise HTTPException(status_code=400, detail="Texto não pode estar vazio")

    mention.update(EnrichmentService.analyze_mention(mention["text"], mention.get("rating")))
    mention.update({
        "user_id": user_id,
        "search_id": search_id,
        "brand_name": query,
    })

    result = db.mentions.insert_one(mention)
    mention["_id"] = result.inserted_id
    return SearchService.serialize(mention)


@app.get("/api/search/history")
async def search_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Histórico de buscas do usuário."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    return {"history": SearchService.history(user_id, limit=limit)}


@app.get("/api/alerts")
async def alerts(
    search_id: str | None = Query(None),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Lista alertas internos, com filtro opcional por search_id."""
    db = get_db()
    user_id = str(current_user.get("_id") or current_user.get("id"))
    query = {"user_id": user_id}
    if search_id:
        query["search_id"] = search_id

    data = list(db.alerts.find(query).sort("created_at", -1).limit(100))
    return {"alerts": SearchService.serialize_many(data)}


@app.get("/api/reports/csv")
async def export_csv(
    search_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Exporta CSV real filtrado pelo search_id."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    return ReportService.export_csv(user_id, search_id)


@app.get("/api/reports/pdf")
async def export_pdf(
    search_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Exporta PDF executivo profissional filtrado pelo search_id."""
    user_id = str(current_user.get("_id") or current_user.get("id"))
    return ReportService.export_pdf(user_id, search_id)


@app.get("/api/reports/export/{format}")
async def export_latest_report(
    format: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Compatibilidade com o frontend: exporta CSV/PDF da última busca concluída."""
    db = get_db()
    user_id = str(current_user.get("_id") or current_user.get("id"))
    last = db.search_jobs.find_one({"user_id": user_id, "status": "completed"}, sort=[("created_at", -1)])
    if not last:
        raise HTTPException(status_code=404, detail="Nenhuma busca concluída para exportar")

    search_id = last["search_id"]
    if format == "csv":
        return ReportService.export_csv(user_id, search_id)
    if format == "pdf":
        return ReportService.export_pdf(user_id, search_id)

    raise HTTPException(status_code=400, detail="Formato inválido. Use csv ou pdf")


@app.delete("/api/dev/clear-data")
async def clear_data(current_user: dict[str, Any] = Depends(get_current_user)):
    """Limpa dados do usuário logado.

    Uso apenas em desenvolvimento/testes.
    """
    db = get_db()
    user_id = str(current_user.get("_id") or current_user.get("id"))
    for collection in ["mentions", "search_jobs", "alerts", "reports"]:
        db[collection].delete_many({"user_id": user_id})
    return {"ok": True, "message": "Dados do usuário removidos"}
