import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Lightbulb,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { DashboardResponse, downloadReport, Mention, sentimentApi } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";

type LLMInsights = {
  executive_summary?: string;
  sentiment_overview?: string;
  risks?: string[];
  opportunities?: string[];
  recommended_actions?: string[];
  decision_guidance?: string;
  trend?: string;
};

const fallbackInsights: LLMInsights = {
  executive_summary: "Execute uma busca para gerar uma analise executiva com a LLM.",
  sentiment_overview: "indefinido",
  risks: [],
  opportunities: [],
  recommended_actions: [],
  decision_guidance: "Sem dados suficientes para orientar uma decisao.",
  trend: "indefinido",
};

export default function AnalysisPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [selectedMention, setSelectedMention] = useState<Mention | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [error, setError] = useState("");

  function hasStaleInsights(llmAnalysis: unknown) {
    const text = JSON.stringify(llmAnalysis ?? {});
    return !llmAnalysis || text.includes("GROK_API_KEY") || text.includes("GROK_MODEL") || text.includes("LLM indispon");
  }

  async function loadAnalysis(forceRefresh = false) {
    setLoading(true);
    setError("");
    try {
      const data = await sentimentApi.dashboard();
      if (forceRefresh || hasStaleInsights(data.llm_analysis)) {
        const refreshedInsights = await sentimentApi.insights(true);
        data.llm_analysis = refreshedInsights;
      }
      setDashboard(data);
      setSelectedMention(data.mentions[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar analise");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
      void loadAnalysis();
  }, []);

  const mentions = dashboard?.mentions ?? [];
  const metrics = dashboard?.metrics ?? {};
  const insights = (dashboard?.llm_analysis ?? fallbackInsights) as LLMInsights;
  const risks = insights.risks ?? [];
  const opportunities = insights.opportunities ?? [];
  const actions = insights.recommended_actions ?? [];

  const totals = useMemo(
    () =>
      mentions.reduce(
        (acc, item) => {
          acc[item.sentiment as keyof typeof acc] = (acc[item.sentiment as keyof typeof acc] || 0) + 1;
          return acc;
        },
        { positivo: 0, neutro: 0, negativo: 0 }
      ),
    [mentions]
  );

  const total = mentions.length || 1;
  const negativeRate = Math.round((totals.negativo / total) * 100);
  const positiveRate = Math.round((totals.positivo / total) * 100);
  const reputationScore = Math.round(metrics.reputation_score ?? 0);

  async function handleExport(format: "csv" | "pdf") {
    setExporting(format);
    try {
      await downloadReport(format);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <nav className="border-b-2 border-cyan-400" style={{ backgroundColor: "oklch(0.1 0 0)" }}>
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold neon-pink">SENTIMENTO</div>
            <div className="text-2xl font-bold neon-cyan">IA</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setLocation("/search")} className="px-4 py-2 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black">
              NOVA BUSCA
            </button>
            <button onClick={() => setLocation("/dashboard")} className="px-4 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black">
              DASHBOARD
            </button>
            <button onClick={logout} className="px-4 py-2 border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-black flex items-center gap-2">
              <LogOut size={16} /> SAIR
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-glow mb-2">ANALISE E DECISAO IA</h1>
            <p className="text-gray-400">
              {dashboard?.query ? `Pesquisa atual: ${dashboard.query}` : "Decisoes geradas pela LLM a partir da ultima pesquisa."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => loadAnalysis(true)} className="cyber-button px-5 py-3 flex items-center gap-2">
              <RefreshCw size={18} /> REGERAR IA
            </button>
            <button onClick={() => handleExport("pdf")} disabled={!!exporting} className="cyber-button px-5 py-3 flex items-center gap-2">
              <FileText size={18} /> {exporting === "pdf" ? "GERANDO..." : "PDF"}
            </button>
            <button onClick={() => handleExport("csv")} disabled={!!exporting} className="cyber-button px-5 py-3 flex items-center gap-2">
              <Download size={18} /> {exporting === "csv" ? "GERANDO..." : "CSV"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="neon-cyan">Carregando analise da LLM...</div>
        ) : error ? (
          <div className="border-2 border-red-500 bg-red-500/10 p-4 text-red-300">{error}</div>
        ) : mentions.length === 0 ? (
          <div className="cyber-card p-8 text-center max-w-2xl mx-auto">
            <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold neon-cyan mb-3">Sem pesquisa atual para analisar</h2>
            <p className="text-gray-400 mb-6">Execute uma busca para a LLM gerar decisoes com base nos dados coletados.</p>
            <button onClick={() => setLocation("/search")} className="cyber-button px-6 py-3">
              INICIAR BUSCA
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="cyber-card p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="text-pink-500" size={26} />
                    <h2 className="text-2xl font-bold neon-pink">Tomada de decisao recomendada</h2>
                  </div>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    {insights.decision_guidance || fallbackInsights.decision_guidance}
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                  <DecisionMetric label="Reputacao" value={`${reputationScore}/100`} />
                  <DecisionMetric label="Tendencia" value={insights.trend ?? "indefinido"} />
                  <DecisionMetric label="Negativas" value={`${negativeRate}%`} />
                  <DecisionMetric label="Positivas" value={`${positiveRate}%`} />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <InsightPanel
                icon={Zap}
                title="Resumo executivo"
                accent="cyan"
                items={[insights.executive_summary || fallbackInsights.executive_summary || "Resumo indisponivel."]}
              />
              <InsightPanel
                icon={ShieldAlert}
                title="Riscos"
                accent="pink"
                items={risks.length ? risks : ["Nenhum risco estrategico identificado pela LLM."]}
              />
              <InsightPanel
                icon={Lightbulb}
                title="Oportunidades"
                accent="cyan"
                items={opportunities.length ? opportunities : ["Nenhuma oportunidade estruturada identificada."]}
              />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="cyber-card p-6 xl:col-span-2">
                <h2 className="text-xl font-bold neon-cyan mb-5 flex items-center gap-2">
                  <CheckCircle2 size={20} /> Plano de acao sugerido pela LLM
                </h2>
                <div className="space-y-3">
                  {(actions.length ? actions : ["Aguarde uma nova busca com mais mencoes para gerar acoes recomendadas."]).map((action, index) => (
                    <div key={`${action}-${index}`} className="flex gap-3 border border-cyan-400/40 bg-black/40 p-4">
                      <div className="w-7 h-7 shrink-0 border border-pink-500 text-pink-400 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-200">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cyber-card p-6">
                <h2 className="text-xl font-bold neon-cyan mb-5 flex items-center gap-2">
                  <TrendingUp size={20} /> Visao do sentimento
                </h2>
                <p className="text-gray-300 mb-5">{insights.sentiment_overview ?? "Sem visao consolidada."}</p>
                <div className="space-y-3 text-sm">
                  <MetricLine label="Positivas" value={`${positiveRate}%`} tone="text-green-400" />
                  <MetricLine label="Neutras" value={`${Math.round((totals.neutro / total) * 100)}%`} tone="text-yellow-400" />
                  <MetricLine label="Negativas" value={`${negativeRate}%`} tone="text-red-400" />
                  <MetricLine label="Total analisado" value={mentions.length} tone="text-cyan-400" />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold neon-cyan">Evidencias da pesquisa atual</h2>
                {mentions.map((mention) => (
                  <button
                    key={mention.id}
                    onClick={() => setSelectedMention(mention)}
                    className={`cyber-card p-5 text-left w-full transition-all ${selectedMention?.id === mention.id ? "border-pink-500" : "border-cyan-400"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="px-2 py-1 border border-gray-600 uppercase">{mention.source}</span>
                        {mention.author && <span>Autor: {mention.author}</span>}
                        {mention.published_at && <span>{new Date(mention.published_at).toLocaleDateString()}</span>}
                      </div>
                      <span className={`px-3 py-1 border text-xs font-bold ${getSentimentColor(mention.sentiment)}`}>
                        {mention.sentiment.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-300">{mention.text}</p>
                  </button>
                ))}
              </div>

              <div className="cyber-card p-6 h-fit">
                <h2 className="text-xl font-bold neon-cyan mb-5 flex items-center gap-2">
                  <AlertTriangle size={20} /> Mencao selecionada
                </h2>
                <p className="text-gray-300 mb-4">{selectedMention?.text ?? "Selecione uma mencao."}</p>
                <div className="space-y-3 text-sm">
                  <MetricLine label="Sentimento" value={selectedMention?.sentiment ?? "-"} tone="text-cyan-400" />
                  <MetricLine label="Criticidade" value={selectedMention?.criticality ?? "-"} tone="text-pink-400" />
                  <MetricLine label="Urgencia" value={selectedMention?.urgency_score ?? 0} tone="text-yellow-400" />
                  <MetricLine label="Termos criticos" value={selectedMention?.critical_terms?.join(", ") || "Nenhum"} tone="text-red-400" />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case "positivo":
      return "text-green-400 border-green-400";
    case "negativo":
      return "text-red-400 border-red-400";
    default:
      return "text-yellow-400 border-yellow-400";
  }
}

function DecisionMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-cyan-400/50 bg-black/40 p-4">
      <p className="text-xs text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-xl font-bold neon-cyan">{value}</p>
    </div>
  );
}

function InsightPanel({
  icon: Icon,
  title,
  items,
  accent,
}: {
  icon: typeof Zap;
  title: string;
  items: string[];
  accent: "cyan" | "pink";
}) {
  const titleClass = accent === "pink" ? "neon-pink" : "neon-cyan";
  return (
    <div className="cyber-card p-6">
      <h2 className={`text-xl font-bold mb-5 flex items-center gap-2 ${titleClass}`}>
        <Icon size={20} /> {title}
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <p key={`${item}-${index}`} className="text-gray-300 leading-relaxed">
            {items.length > 1 ? `${index + 1}. ` : ""}
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function MetricLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-cyan-400/20 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className={`font-bold text-right ${tone}`}>{value}</span>
    </div>
  );
}
