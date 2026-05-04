# WebApp Sentimento v11 — Integração Real Completa Sem Apify

Esta versão remove a dependência da Apify e implementa o fluxo profissional:

```txt
1. Coleta de dados
   Google Places, Reddit, X/snscrape

2. Normalização
   texto, autor, data, fonte, link, nota

3. Armazenamento
   MongoDB por busca/search_id

4. Análise IA
   OpenRouter/Grok ou Ollama fallback
   sentimento, resumo, riscos, oportunidades

5. Enriquecimento
   score de reputação
   criticidade
   tendência
   classificação automática

6. Saída
   Dashboard
   Alertas
   Relatórios CSV/PDF
```

## Principais decisões técnicas

- **Apify removido do fluxo principal**: não há dependência de limite mensal da Apify.
- **Cada busca gera um `search_id` único**: evita misturar dados antigos com busca nova.
- **Cache inteligente**: busca igual pode reaproveitar resultado recente.
- **LLM estruturada em JSON**: OpenRouter é principal, Ollama é fallback local.
- **PDF executivo**: relatório com resumo, indicadores, riscos, oportunidades e amostra de menções.
- **Alertas internos**: gerados automaticamente quando há risco reputacional.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Python
- Banco: MongoDB Atlas
- IA principal: OpenRouter
- IA fallback: Ollama local
- Busca: Google Places API, Reddit público, X/snscrape
- Relatórios: CSV e PDF

## Configuração

Crie `backend/.env` baseado em `backend/.env.example`.

Campos principais:

```env
MONGODB_URI=
DATABASE_NAME=sentimento_db

GROK_API_KEY=
GROK_API_URL=https://openrouter.ai/api/v1
GROK_MODEL=deepseek/deepseek-chat-v3-0324:free

OLLAMA_ENABLED=False
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

GOOGLE_PLACES_API_KEY=
REDDIT_USER_AGENT=webapp-sentimento/1.0
X_MAX_RESULTS=20
```

## Instalação backend

```bash
cd backend
py -3.11 -m venv venv
venv\Scripts\Activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Teste:

```txt
http://localhost:8000/health
http://localhost:8000/api/status/integrations
```

## Endpoints principais

### Auth
```txt
POST /api/auth/register
POST /api/auth/login
```

### Busca real
```txt
POST /api/search
Authorization: Bearer SEU_TOKEN
```

Body:

```json
{
  "brand_name": "Nike",
  "sources": ["google", "reddit", "x"],
  "period_days": 30,
  "locality": "São Paulo",
  "replace_existing": true
}
```

Resposta inclui:

```json
{
  "search_id": "...",
  "total": 10,
  "mentions": [],
  "metrics": {},
  "llm_analysis": {},
  "alerts": [],
  "errors": []
}
```

### Dashboard

```txt
GET /api/dashboard
GET /api/dashboard?search_id=...
```

### Histórico

```txt
GET /api/search/history
```

### Alertas

```txt
GET /api/alerts
GET /api/alerts?search_id=...
```

### CSV

```txt
GET /api/reports/csv?search_id=...
```

### PDF

```txt
GET /api/reports/pdf?search_id=...
```

### Limpar dados de teste

```txt
DELETE /api/dev/clear-data
```

## Manutenção

Arquivos principais comentados:

```txt
backend/app/main.py
backend/app/config.py
backend/app/database.py
backend/app/services/collector_service.py
backend/app/services/normalization_service.py
backend/app/services/enrichment_service.py
backend/app/services/llm_service.py
backend/app/services/search_service.py
backend/app/services/report_service.py
```

## Observações importantes

### Google Places
A API retorna reviews limitadas por place. Para grande volume de reviews, é necessário API paga/terceiros.

### Reddit
Usa endpoint público `reddit.com/search.json`. Para produção pesada, recomenda-se OAuth Reddit.

### X/snscrape
`snscrape` é não oficial. Pode quebrar se o X mudar bloqueios.

### Ollama
Para fallback local:

```bash
ollama pull llama3.1:8b
ollama serve
```

Depois:

```env
OLLAMA_ENABLED=True
```

## Segurança

Não coloque chaves reais no GitHub. Se alguma chave foi compartilhada em conversa, revogue e gere outra.
