# Documento MVP - SentimentoIA

## 1. Visao geral

O SentimentoIA e um MVP de monitoramento de reputacao digital. O sistema permite que um usuario pesquise uma marca, colete mencoes publicas, classifique sentimento, gere metricas e receba uma analise executiva produzida por LLM para apoiar tomada de decisao.

O foco do MVP e validar o fluxo completo:

1. Cadastro e login do usuario.
2. Busca de mencoes por marca.
3. Coleta de dados reais em fontes integradas.
4. Classificacao automatica de sentimento, criticidade e urgencia.
5. Dashboard com metricas e graficos.
6. Tela de analise com recomendacoes da LLM.
7. Exportacao de relatorios em CSV e PDF.

## 2. Objetivo do MVP

O objetivo e entregar uma versao funcional capaz de demonstrar valor para gestores, times de marketing, atendimento e reputacao.

O sistema responde perguntas como:

- Quantas mencoes recentes existem sobre uma marca?
- O sentimento geral e positivo, neutro ou negativo?
- Quais fontes concentram mais comentarios?
- Existem mencoes criticas?
- Quais aspectos aparecem com mais frequencia?
- Que decisao o gestor deve tomar com base nos dados atuais?

## 3. Funcionalidades principais

### Autenticacao

- Cadastro de usuario.
- Login com email e senha.
- Sessao com token JWT.
- Rotas protegidas no frontend.
- Botao `Sair` nas telas internas.

### Busca de mencoes

Tela pos-login onde o usuario informa:

- Nome da marca ou termo pesquisado.
- Fontes desejadas.
- Localidade opcional.
- Periodo padrao de analise.

No MVP, as fontes implementadas no backend sao:

- Reddit publico.
- Google Places, quando uma chave real estiver configurada.
- X/Twitter via snscrape, mantido desativado por padrao por ser instavel e nao oficial.

### Dashboard

Apresenta os dados da ultima busca concluida:

- Total de mencoes.
- Score de reputacao.
- Mencoes criticas.
- Urgencia media.
- Grafico de sentimentos.
- Grafico por fonte.
- Grafico de aspectos mais citados.
- Mencoes recentes.

### Analise IA

A tela de analise usa a LLM configurada para gerar:

- Tomada de decisao recomendada.
- Resumo executivo.
- Riscos principais.
- Oportunidades.
- Plano de acao priorizado.
- Visao geral de sentimento.
- Evidencias baseadas nas mencoes coletadas.

Atualmente o projeto esta configurado para usar OpenRouter com Gemma 3 27B free:

```env
OPENROUTER_MODEL=google/gemma-3-27b-it:free
```

### Relatorios

O MVP permite exportar:

- CSV com dados tabulares das mencoes.
- PDF executivo com resumo, indicadores, riscos, oportunidades e amostra de mencoes.

## 4. Tecnologias usadas

### Frontend

- React.
- TypeScript.
- Vite.
- Wouter para rotas.
- Tailwind CSS e estilos customizados.
- Lucide React para icones.
- Recharts para graficos.

### Backend

- Python.
- FastAPI.
- Uvicorn.
- Pydantic e pydantic-settings.
- PyMongo/Motor para MongoDB.
- python-jose para JWT.
- bcrypt/passlib para senha.
- httpx para chamadas HTTP.
- ReportLab para PDF.

### Banco de dados

- MongoDB Atlas.

Colecoes usadas no fluxo principal:

- `users`
- `mentions`
- `search_jobs`
- `alerts`
- `reports`

### Inteligencia artificial

- OpenRouter como provedor LLM principal.
- Modelo atual: `google/gemma-3-27b-it:free`.
- Ollama pode ser usado como fallback local, se habilitado.

### Integracoes de coleta

- Reddit Search JSON publico.
- Google Places API, se `GOOGLE_PLACES_API_KEY` for real.
- X/Twitter via snscrape, opcional e desativado por padrao.

## 5. Arquitetura resumida

```txt
Usuario
  |
  v
Frontend React/Vite
  |
  v
Backend FastAPI
  |
  +--> Autenticacao JWT
  +--> Coleta de dados
  +--> Normalizacao
  +--> Classificacao e enriquecimento
  +--> LLM via OpenRouter
  +--> MongoDB Atlas
  +--> Relatorios CSV/PDF
```

## 6. Fluxo de uso

### 1. Tela inicial

A tela inicial publica apresenta o produto e oferece:

- `LOGIN`
- `CADASTRO`

Se o usuario ja estiver autenticado e acessar `/`, ele e redirecionado para `/search`.

### 2. Cadastro ou login

O usuario cria uma conta ou entra com email e senha. Ao autenticar com sucesso, o frontend salva:

- Token JWT.
- Dados basicos do usuario.

Depois do login/cadastro, o usuario vai para:

```txt
/search
```

### 3. Busca

Na tela de busca, o usuario informa a marca. Exemplo:

```txt
nike
```

O frontend chama:

```txt
POST /api/search
```

O backend:

1. Coleta dados nas fontes selecionadas.
2. Normaliza os dados.
3. Remove duplicados simples.
4. Classifica cada mencao.
5. Salva tudo no MongoDB por `search_id`.
6. Chama a LLM para gerar analise executiva.
7. Retorna o resultado para o frontend.

### 4. Dashboard

Ao concluir a busca com dados, o usuario e direcionado para:

```txt
/dashboard
```

Essa tela consome:

```txt
GET /api/dashboard
```

### 5. Analise IA

A tela de analise consome a mesma pesquisa atual e usa `llm_analysis` para exibir recomendacoes.

Tambem existe botao para regenerar a analise:

```txt
GET /api/insights?refresh=true
```

Esse recurso e util quando:

- A LLM foi trocada.
- A analise antiga estava indisponivel.
- O usuario quer atualizar a tomada de decisao.

## 7. Classificacao e enriquecimento

O MVP usa duas camadas de inteligencia:

### Camada 1: regras locais rapidas

Arquivo principal:

```txt
backend/app/services/enrichment_service.py
```

Essa camada classifica cada mencao com base em termos positivos, negativos e criticos.

Campos gerados:

- `sentiment`: `positivo`, `neutro` ou `negativo`.
- `confidence`: confianca estimada.
- `criticality`: `baixa`, `media` ou `alta`.
- `urgency_score`: pontuacao de urgencia entre 0 e 1.
- `critical_terms`: termos de risco encontrados.
- `aspects`: temas como preco, entrega, atendimento, produto e experiencia.
- `reputation_score`: pontuacao de reputacao entre 0 e 100.

### Camada 2: LLM para decisao

Arquivo principal:

```txt
backend/app/services/llm_service.py
```

A LLM recebe uma amostra das mencoes coletadas e retorna JSON estruturado com:

- `executive_summary`
- `sentiment_overview`
- `risks`
- `opportunities`
- `recommended_actions`
- `decision_guidance`
- `trend`

A tela `/analysis` usa esses campos para mostrar a decisao recomendada.

## 8. Configuracao do ambiente

Arquivo:

```txt
backend/.env
```

Campos principais:

```env
ENV=development
DEBUG=True

MONGODB_URI=sua_uri_mongodb
DATABASE_NAME=sentimento_db

OPENROUTER_API_KEY=sua_chave_openrouter
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemma-3-27b-it:free

OLLAMA_ENABLED=False
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

GOOGLE_PLACES_API_KEY=SUA_CHAVE_GOOGLE_PLACES
REDDIT_USER_AGENT=webapp-sentimento/1.0
X_SNSCRAPE_ENABLED=False
X_MAX_RESULTS=20

SECRET_KEY=troque-por-uma-chave-grande-e-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Observacao: nao publique chaves reais em repositorios publicos.

## 9. Como rodar o backend

Entre na pasta do backend:

```bash
cd webapp-sentimento/backend
```

Crie e ative o ambiente virtual:

```bash
py -3.11 -m venv venv
venv\Scripts\Activate
```

Instale dependencias:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Rode a API:

```bash
uvicorn app.main:app --reload
```

URLs uteis:

```txt
http://127.0.0.1:8000/health
http://127.0.0.1:8000/api/status/integrations
```

## 10. Como rodar o frontend

Em outro terminal, entre na pasta principal:

```bash
cd webapp-sentimento
```

Instale dependencias:

```bash
npm install
```
OU

```bash
npm install --legacy-peer-deps
```

Rode o frontend:

```bash
npm run dev
```

O frontend usa:

```env
VITE_API_URL=http://localhost:8000
```

Abra no navegador:

```txt
http://localhost:3000
```

ou a porta exibida no terminal do Vite.

## 11. Endpoints principais

### Autenticacao

```txt
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### Busca

```txt
POST /api/search
```

Exemplo de body:

```json
{
  "brand_name": "Nike",
  "sources": ["reddit"],
  "period_days": 30,
  "locality": "",
  "replace_existing": true
}
```

### Dashboard

```txt
GET /api/dashboard
GET /api/dashboard?search_id=...
```

### Analise IA

```txt
GET /api/insights
GET /api/insights?refresh=true
```

### Mencoes

```txt
GET /api/mentions
```

### Relatorios

```txt
GET /api/reports/export/csv
GET /api/reports/export/pdf
```

## 12. Telas do sistema

### `/`

Tela inicial publica com login e cadastro.

### `/login`

Tela de autenticacao.

### `/register`

Tela de cadastro.

### `/search`

Primeira tela apos login. Permite iniciar busca por marca.

### `/dashboard`

Mostra graficos e indicadores da ultima busca.

### `/analysis`

Mostra decisao recomendada pela LLM, riscos, oportunidades e plano de acao.

### `/reports`

Permite baixar CSV e PDF.

## 13. Limitacoes atuais do MVP

- Google Places exige chave real para funcionar.
- Reddit publico pode limitar ou bloquear requisicoes em alto volume.
- X/Twitter via snscrape e experimental e esta desativado por padrao.
- A classificacao local e baseada em regras simples, nao em modelo treinado.
- A LLM depende de disponibilidade e limites do OpenRouter/modelo gratuito.
- O cache pode reaproveitar busca recente se configurado.

## 14. Proximos passos sugeridos

- Adicionar historico visual de buscas.
- Permitir selecionar `search_id` no dashboard.
- Criar filtros reais por periodo, fonte e sentimento.
- Adicionar fila/background job para buscas mais longas.
- Melhorar coleta com APIs oficiais.
- Criar painel administrativo.
- Adicionar testes automatizados para endpoints principais.
- Adicionar deploy com Docker.

