import pytest
import asyncio
from app.services.sentiment_service import SentimentService
from app.models import SentimentType, CriticalityLevel

class TestSentimentService:
    """Testes para o serviço de análise de sentimento"""
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_positive(self):
        """Testa análise de sentimento positivo"""
        text = "Excelente produto! Muito satisfeito com a qualidade e o atendimento."
        result = await SentimentService.analyze_sentiment(text)
        
        assert result is not None
        assert "sentiment" in result
        assert "confidence" in result
        assert result["confidence"] >= 0
        assert result["confidence"] <= 1
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_negative(self):
        """Testa análise de sentimento negativo"""
        text = "Péssimo serviço! Atendimento ruim, produto de baixa qualidade."
        result = await SentimentService.analyze_sentiment(text)
        
        assert result is not None
        assert "sentiment" in result
        assert "criticality" in result
    
    @pytest.mark.asyncio
    async def test_analyze_sentiment_empty_text(self):
        """Testa análise com texto vazio"""
        result = await SentimentService.analyze_sentiment("")
        
        assert result is not None
        assert result["sentiment"] == SentimentType.NEUTRO
        assert result["confidence"] == 0.0
    
    @pytest.mark.asyncio
    async def test_calculate_reputation_score(self):
        """Testa cálculo de score de reputação"""
        analyses = [
            {"sentiment": SentimentType.POSITIVO, "urgency_score": 0.1},
            {"sentiment": SentimentType.POSITIVO, "urgency_score": 0.2},
            {"sentiment": SentimentType.NEGATIVO, "urgency_score": 0.8},
        ]
        
        score = SentimentService.calculate_reputation_score(analyses)
        
        assert score >= 0
        assert score <= 10
    
    @pytest.mark.asyncio
    async def test_get_critical_mentions(self):
        """Testa identificação de menções críticas"""
        analyses = [
            {"urgency_score": 0.9},
            {"urgency_score": 0.5},
            {"urgency_score": 0.8},
            {"urgency_score": 0.3},
        ]
        
        critical = SentimentService.get_critical_mentions(analyses, threshold=0.7)
        
        assert len(critical) == 2
        assert all(m["urgency_score"] > 0.7 for m in critical)
    
    @pytest.mark.asyncio
    async def test_generate_executive_summary(self):
        """Testa geração de resumo executivo"""
        mentions_analyses = [
            {
                "sentiment": SentimentType.POSITIVO,
                "urgency_score": 0.2,
                "aspects": ["qualidade", "preço"]
            },
            {
                "sentiment": SentimentType.NEGATIVO,
                "urgency_score": 0.8,
                "aspects": ["atendimento", "entrega"]
            },
        ]
        
        summary = await SentimentService.generate_executive_summary(mentions_analyses)
        
        assert summary is not None
        assert len(summary) > 0

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
