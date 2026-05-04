import json
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Serviço de IA.

    Ordem:
    1. OpenRouter ou outro modelo compatível.
    2. Ollama local como fallback opcional.
    3. Fallback seguro sem quebrar backend.
    """

    @staticmethod
    def openrouter_configured() -> bool:
        return bool(
            settings.LLM_API_KEY
            and "xxxx" not in settings.LLM_API_KEY.lower()
            and settings.LLM_MODEL
        )

    @staticmethod
    async def analyze_mentions(brand: str, mentions: list[dict[str, Any]]) -> dict[str, Any]:
        """Pede para a LLM gerar análise executiva estruturada em JSON."""
        if not mentions:
            return LLMService.empty_analysis("Sem menções coletadas para análise.")

        compact = [
            {
                "source": m.get("source"),
                "author": m.get("author"),
                "date": str(m.get("published_at")),
                "rating": m.get("rating"),
                "text": (m.get("text") or "")[:700],
            }
            for m in mentions[:40]
        ]

        prompt = f"""
Use somente as mencoes fornecidas como evidencia. Nao invente fatos externos.
Seu foco e orientar tomada de decisao de um gestor.
Você é um consultor sênior de reputação digital e experiência do cliente.

Analise as menções abaixo sobre a marca/termo "{brand}" e retorne SOMENTE JSON válido com:
{{
  "executive_summary": "resumo executivo em português",
  "sentiment_overview": "visão geral do sentimento",
  "risks": ["riscos principais"],
  "opportunities": ["oportunidades"],
  "recommended_actions": ["ações recomendadas"],
  "decision_guidance": "tomada de decisão objetiva para gestor",
  "trend": "subindo|estável|caindo|indefinido"
}}

Menções:
{json.dumps(compact, ensure_ascii=False)}
""".strip()

        # Tenta OpenRouter primeiro.
        if LLMService.openrouter_configured():
            try:
                return await LLMService._call_openrouter(prompt)
            except Exception as exc:
                logger.error("OpenRouter falhou; tentando fallback Ollama: %s", exc)

        # Fallback local.
        if settings.OLLAMA_ENABLED:
            try:
                return await LLMService._call_ollama(prompt)
            except Exception as exc:
                logger.error("Ollama falhou: %s", exc)

        return LLMService.empty_analysis("LLM indisponível. Configure OPENROUTER_API_KEY/OPENROUTER_MODEL ou habilite Ollama.")

    @staticmethod
    async def _call_openrouter(prompt: str) -> dict[str, Any]:
        url = f"{settings.LLM_API_URL.rstrip('/')}/chat/completions"
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": "Responda somente JSON válido, sem markdown."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.LLM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code >= 400:
                raise RuntimeError(f"OpenRouter HTTP {resp.status_code}: {resp.text[:500]}")

            content = resp.json()["choices"][0]["message"]["content"]
            return LLMService._parse_json(content)

    @staticmethod
    async def _call_ollama(prompt: str) -> dict[str, Any]:
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                url,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            if resp.status_code >= 400:
                raise RuntimeError(f"Ollama HTTP {resp.status_code}: {resp.text[:500]}")
            content = resp.json().get("response", "")
            return LLMService._parse_json(content)

    @staticmethod
    def _parse_json(content: str) -> dict[str, Any]:
        """Extrai JSON mesmo se o modelo devolver texto ao redor."""
        content = (content or "").strip()
        try:
            return json.loads(content)
        except Exception:
            start = content.find("{")
            end = content.rfind("}")
            if start >= 0 and end > start:
                return json.loads(content[start : end + 1])
            raise ValueError("LLM não retornou JSON válido")

    @staticmethod
    def empty_analysis(reason: str) -> dict[str, Any]:
        return {
            "executive_summary": reason,
            "sentiment_overview": "indefinido",
            "risks": [],
            "opportunities": [],
            "recommended_actions": [],
            "decision_guidance": reason,
            "trend": "indefinido",
        }

    @staticmethod
    async def healthcheck() -> dict[str, Any]:
        """Diagnóstico simples para /api/status/integrations."""
        result = {
            "openrouter_configured": LLMService.openrouter_configured(),
            "openrouter_model": settings.LLM_MODEL,
            "ollama_enabled": settings.OLLAMA_ENABLED,
            "ollama_model": settings.OLLAMA_MODEL,
        }

        if LLMService.openrouter_configured():
            try:
                test = await LLMService._call_openrouter('Retorne {"ok": true}')
                result["openrouter_ok"] = bool(test)
            except Exception as exc:
                result["openrouter_ok"] = False
                result["openrouter_error"] = str(exc)

        return result
