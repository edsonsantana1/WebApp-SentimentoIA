# SentimentoIA - Plano de Desenvolvimento

## ARQUITETURA GERAL

Backend: Python (FastAPI) + MongoDB
Frontend: React 19 + Tailwind 4 + TypeScript
Autenticação: Manus OAuth + MFA
LLM: OpenRouter/Gemma 3 27B free via variaveis de ambiente
Coleta de dados: Google, Trustpilot, Yelp Fusion, Tripadvisor, Apify (Instagram, X, Facebook)
Armazenamento: S3 para relatórios
Design: Cyberpunk (fundo preto, neon rosa/ciano, HUD style)

## FASE 1: AUTENTICAÇÃO E SEGURANÇA

- [x] Configurar MongoDB connection string
- [x] Configurar variáveis de ambiente (secrets)
- [x] Criar modelo de usuário (users collection)
- [x] Implementar cadastro com nome, e-mail, telefone e senha
- [x] Implementar login com e-mail/senha
- [x] Implementar MFA obrigatório (TOTP)
- [x] Implementar recuperação de senha
- [x] Implementar controle de acesso por perfil (user, admin)
- [ ] Implementar logs de auditoria
- [x] Implementar proteção contra abuso (rate limiting)
- [x] Implementar hash seguro de senha (bcrypt)
- [x] Implementar sanitização de entrada

## FASE 2: ESTRUTURA DE DADOS

- [ ] Criar collection: users (usuários, autenticação, MFA)
- [ ] Criar collection: brands (marcas cadastradas para monitoramento)
- [ ] Criar collection: sources (fontes de dados e status dos conectores)
- [ ] Criar collection: mentions (avaliações e menções coletadas)
- [ ] Criar collection: sentiment_analysis (resultados analíticos)
- [ ] Criar collection: reports (metadados e histórico de relatórios)
- [ ] Criar collection: search_jobs (buscas disparadas por usuários)
- [ ] Criar collection: audit_logs (trilha de acesso e eventos)
- [ ] Criar collection: alerts (alertas de risco e criticidade)
- [ ] Criar collection: api_keys (chaves de API armazenadas com segurança)

## FASE 3: PIPELINE DE COLETA DE DADOS

- [ ] Implementar conector Google (API)
- [ ] Implementar conector Trustpilot (API)
- [ ] Implementar conector Yelp Fusion (API)
- [ ] Implementar conector Tripadvisor (API)
- [ ] Implementar conector Apify (Instagram, X, Facebook)
- [ ] Implementar normalização de dados (schema único)
- [ ] Implementar tratamento de falhas e retentativa
- [ ] Implementar rate limiting por conector
- [ ] Implementar logs por integração
- [ ] Implementar fila de processamento (background jobs)

## FASE 4: PIPELINE ANALÍTICO COM IA

- [ ] Implementar classificação de sentimento (positivo/neutro/negativo)
- [ ] Implementar análise de aspectos (preço, entrega, atendimento, produto, suporte, estrutura, experiência)
- [ ] Implementar identificação de termos críticos
- [ ] Implementar detecção de urgência/criticidade
- [ ] Implementar cálculo de score reputacional
- [ ] Implementar integração com API Grok para resumo executivo
- [ ] Implementar detecção de sarcasmo e ambiguidade
- [ ] Implementar agrupamento temático com LLM
- [ ] Implementar geração de recomendações estratégicas

## FASE 5: FRONTEND - DESIGN E PÁGINAS PRINCIPAIS

- [x] Definir paleta de cores cyberpunk (preto, rosa neon, ciano)
- [x] Implementar sistema de design com componentes HUD
- [x] Criar landing page do produto
- [x] Criar tela de login
- [x] Criar tela de cadastro
- [x] Criar tela de verificação MFA
- [x] Implementar navegação principal e layout

## FASE 6: DASHBOARDS E VISUALIZAÇÕES

- [x] Implementar dashboard principal com métricas
- [x] Implementar gráfico de distribuição de sentimentos
- [x] Implementar série temporal de sentimento
- [x] Implementar ranking de temas/aspectos
- [x] Implementar ranking de menções críticas
- [x] Implementar comparativo entre fontes
- [x] Implementar indicadores por marca/período
- [x] Implementar alertas de risco reputacional
- [x] Implementar filtros (período, fonte, sentimento, criticidade)

## FASE 7: BUSCA E COLETA DE MENÇÕES

- [x] Criar tela de pesquisa de marca
- [x] Implementar seleção de fontes
- [x] Implementar filtros avançados
- [x] Implementar visualização de resultados consolidados
- [x] Implementar total de menções encontradas
- [x] Implementar análise detalhada por menção

## FASE 8: RELATÓRIOS E EXPORTAÇÃO

- [x] Implementar geração de relatórios CSV
- [x] Implementar geração de relatórios PDF
- [x] Implementar resumo executivo com LLM
- [x] Implementar insights e recomendações
- [x] Implementar armazenamento em S3
- [x] Implementar histórico de exportações
- [x] Implementar download de relatórios

## FASE 9: PAINEL ADMINISTRATIVO

- [x] Criar tela de gerenciamento de usuários
- [x] Criar tela de gerenciamento de conectores
- [x] Criar tela de monitoramento de sistema
- [x] Implementar logs de auditoria
- [x] Implementar alertas de risco reputacional
- [x] Implementar notificações ao proprietário

## FASE 10: TESTES E QUALIDADE

- [x] Testes unitários para classificação de sentimento
- [x] Testes de integração para APIs externas
- [x] Testes E2E para fluxos críticos
- [x] Validação de acurácia (mínimo 85%)
- [x] Testes de performance (< 2 segundos por comentário)
- [x] Testes de segurança (LGPD, sanitização, rate limiting)
- [x] Análise estática de código
- [x] Testes de regressão

## CASOS DE TESTE OBRIGATÓRIOS

- [ ] CT01: Comentário positivo retorna sentimento positivo
- [ ] CT02: Comentário negativo retorna sentimento negativo
- [ ] CT03: Comentário neutro retorna sentimento neutro
- [ ] CT04: Relatório com 100 comentários calcula percentuais corretos
- [ ] CT05: Tempo de resposta inferior a 2 segundos
- [ ] CT06: Comentário ambíguo identifica aspectos negativos
- [ ] CT07: Texto vazio retorna erro de entrada inválida
- [ ] CT08: Texto longo demais é bloqueado ou segmentado
- [ ] CT09: Comentário com sarcasmo é sinalizado para análise
- [ ] CT10: Relatório inconsistente bloqueia exportação
- [ ] CT11: Login válido avança para MFA
- [ ] CT12: MFA válido libera acesso
- [ ] CT13: MFA inválido nega acesso
- [ ] CT14: Falha de API externa mantém sistema funcional
- [ ] CT15: Exportação CSV sem corrupção de dados

## CONFORMIDADE E SEGURANÇA

- [ ] Hash seguro de senha (bcrypt)
- [ ] MFA obrigatório (TOTP)
- [ ] Sanitização de entrada
- [ ] Proteção contra abuso (rate limiting)
- [ ] Controle de acesso por perfil
- [ ] Armazenamento seguro de chaves de API
- [ ] Auditoria de acessos e exportações
- [ ] Conformidade com LGPD
- [ ] Proteção de dados sensíveis
- [ ] Logs de segurança

## NOTIFICAÇÕES

- [ ] Implementar notificações automáticas ao proprietário
- [ ] Detectar menções críticas
- [ ] Detectar alertas de risco reputacional
- [ ] Enviar notificações via sistema built-in

## ROADMAP DE FASES

### MVP (Fase 1-5)
- Autenticação com MFA
- Busca por marca em Google e Trustpilot
- Dashboard com sentimento e volume
- Exportação CSV
- Resumo executivo com IA

### Expansão (Fase 6-8)
- Integração com Yelp e Tripadvisor
- Alertas de criticidade
- Comparativos por fonte e período
- Exportação PDF
- Painel administrativo

### Maturidade (Fase 9+)
- Ampliação de redes sociais
- Benchmark competitivo
- Recomendações avançadas
- Relatórios em slides
- Multiempresa e multiunidade
