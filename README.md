# Projeto Sentimento: Análise de Sentimentos em Tempo Real

## 🎯 Diferenciais do Projeto

Este projeto se destaca por suas funcionalidades inovadoras e robustez, garantindo uma análise de sentimentos eficiente e precisa:

- **Isolamento por `search_id`**: Garante que os dados de diferentes buscas não se misturem, mantendo a integridade e a organização das informações.
- **Cache inteligente**: Otimiza o desempenho e reduz a carga sobre as APIs externas, armazenando resultados de buscas frequentes.
- **IA estruturada em JSON**: Facilita a integração e o processamento dos dados gerados pela inteligência artificial.
- **Score de reputação dinâmico**: Oferece uma métrica atualizada e adaptável para avaliar a reputação de marcas ou tópicos.
- **Sistema de alertas automático**: Notifica proativamente sobre mudanças significativas ou eventos importantes detectados na análise de sentimentos.
- **Relatórios executivos em PDF**: Gera documentos profissionais e de fácil leitura para apresentações e tomadas de decisão.
- **Exportação CSV**: Permite a exportação de dados brutos para análises mais aprofundadas em outras ferramentas.

## 🧱 Stack Tecnológica

A arquitetura do projeto é construída com tecnologias modernas e escaláveis:

| Categoria         | Tecnologia                                     |
| :---------------- | :--------------------------------------------- |
| **Frontend**      | React, TypeScript, Vite                        |
| **Backend**       | FastAPI, Python                                |
| **Banco de Dados**| MongoDB Atlas                                  |
| **IA Principal**  | OpenRouter                                     |
| **IA Fallback**   | Ollama (local)                                 |
| **Coleta de Dados**| Google Places API, Reddit (público), X (snscrape) |
| **Relatórios**    | CSV, PDF                                       |

## ⚙️ Configuração

Para configurar o ambiente do projeto, siga os passos abaixo:

### Variáveis de Ambiente

Crie o arquivo `backend/.env` na raiz do diretório `backend`, baseado no `backend/.env.example`. As variáveis principais são:

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

### 🚀 Instalação

#### Backend

```bash
cd backend
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd client
npm install --legacy-peer-deps
npm run dev
```

### 🧪 Testes

Após a instalação e configuração, você pode verificar o status da aplicação nos seguintes endpoints:

- `http://localhost:8000/health`
- `http://localhost:8000/api/status/integrations`

## 🔌 Endpoints Principais

### 🔐 Autenticação

- `POST /api/auth/register`: Registra um novo usuário.
- `POST /api/auth/login`: Realiza o login do usuário e retorna um token de autenticação.

### 🔍 Busca Inteligente

- `POST /api/search`
  - **Autorização**: `Bearer TOKEN`
  - **Exemplo de Requisição**:
    ```json
    {
      "brand_name": "Nike",
      "sources": ["google", "reddit", "x"],
      "period_days": 30,
      "locality": "São Paulo",
      "replace_existing": true
    }
    ```

### 📊 Dashboard

- `GET /api/dashboard`: Retorna dados do dashboard geral.
- `GET /api/dashboard?search_id=...`: Retorna dados do dashboard para uma busca específica.

### 🧠 Histórico

- `GET /api/search/history`: Retorna o histórico de buscas realizadas.

### 🚨 Alertas

- `GET /api/alerts`: Retorna todos os alertas.
- `GET /api/alerts?search_id=...`: Retorna alertas para uma busca específica.

### 📄 Relatórios

- `GET /api/reports/csv?search_id=...`: Gera e baixa um relatório CSV para uma busca específica.
- `GET /api/reports/pdf?search_id=...`: Gera e baixa um relatório PDF para uma busca específica.

### 🧹 Limpeza (dev)

- `DELETE /api/dev/clear-data`: Limpa dados para fins de desenvolvimento.

## 🛠 Estrutura do Backend

A estrutura do diretório `backend` é organizada da seguinte forma:

```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   └── services/
│       ├── collector_service.py
│       ├── normalization_service.py
│       ├── enrichment_service.py
│       ├── llm_service.py
│       ├── search_service.py
│       └── report_service.py
└── .env.example
```

## ⚠️ Limitações Conhecidas

É importante estar ciente das seguintes limitações:

- **Google Places**:
  - Retorna poucas avaliações por local.
  - Para escala, é necessário um plano pago ou técnicas avançadas de scraping.
- **Reddit**:
  - Utiliza endpoint público.
  - Para uso em produção, recomenda-se a implementação de autenticação OAuth.
- **X (Twitter)**:
  - A biblioteca `snscrape` não é oficial.
  - Pode sofrer interrupções ou quebras a qualquer momento devido a mudanças na API do X.

## 🤖 Uso do Ollama (fallback local)

Para utilizar o Ollama como fallback local, siga os passos:

```bash
ollama pull llama3.1:8b
ollama serve
```

## 📌 Status do Projeto

O projeto encontra-se em um estágio avançado de desenvolvimento:

- ✔ Arquitetura completa
- ✔ Backend funcional
- ✔ Integração com IA
- ✔ Pipeline de dados real
- ✔ Pronto para evolução SaaS

## 💡 Roadmap

As próximas etapas de desenvolvimento incluem:

- Dashboard com gráficos avançados
- Alertas em tempo real
- Suporte Multi-tenant (SaaS)
- Deploy em produção
- Métricas avançadas

## 👨‍💻 Autor

Edson Santana