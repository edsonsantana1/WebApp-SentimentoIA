import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  FileText,
  LogOut,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardResponse, sentimentApi } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";

const COLORS = ["#00ffff", "#ff2bd6", "#facc15", "#22c55e", "#f97316", "#a855f7"];

function mapRecord(record?: Record<string, number>) {
  return Object.entries(record ?? {}).map(([name, value]) => ({ name, value }));
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      setData(await sentimentApi.dashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const metrics = data?.metrics ?? {};
  const mentions = data?.mentions ?? [];

  const sentimentData = useMemo(
    () => mapRecord(metrics.sentiment_distribution),
    [metrics.sentiment_distribution]
  );
  const sourceDistribution = metrics.source_distribution ?? (metrics as { sources_distribution?: Record<string, number> }).sources_distribution;
  const sourceData = useMemo(
    () => mapRecord(sourceDistribution),
    [sourceDistribution]
  );
  const aspectData = useMemo(
    () => mapRecord(metrics.top_aspects).slice(0, 8),
    [metrics.top_aspects]
  );

  const totalMentions = metrics.total_mentions ?? mentions.length;
  const reputationScore = Math.round(metrics.reputation_score ?? 0);
  const criticalMentions = metrics.critical_mentions ?? 0;
  const averageUrgency = Math.round((metrics.average_urgency ?? 0) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
          <p className="mt-4 neon-cyan">Carregando dashboard...</p>
        </div>
      </div>
    );
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
            <button onClick={() => setLocation("/analysis")} className="px-4 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black">
              ANALISE
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
            <h1 className="text-4xl font-bold neon-glow mb-2">DASHBOARD</h1>
            <p className="text-gray-400">
              {data?.query ? `Busca atual: ${data.query}` : "Execute uma busca para preencher os indicadores."}
            </p>
          </div>
          <button onClick={loadDashboard} className="cyber-button px-5 py-3 flex items-center justify-center gap-2">
            <RefreshCw size={18} /> ATUALIZAR
          </button>
        </div>

        {error && (
          <div className="border-2 border-red-500 bg-red-500/10 p-4 mb-8 text-red-300">
            {error}
          </div>
        )}

        {totalMentions === 0 ? (
          <div className="cyber-card p-8 text-center max-w-2xl mx-auto">
            <Search className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold neon-cyan mb-3">Nenhum dado no dashboard</h2>
            <p className="text-gray-400 mb-6">Inicie uma busca para gerar metricas, graficos e insights.</p>
            <button onClick={() => setLocation("/search")} className="cyber-button px-6 py-3">
              INICIAR BUSCA
            </button>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              <MetricCard icon={BarChart3} label="Mencoes" value={totalMentions} />
              <MetricCard icon={TrendingUp} label="Reputacao" value={`${reputationScore}/100`} />
              <MetricCard icon={AlertTriangle} label="Criticas" value={criticalMentions} />
              <MetricCard icon={Brain} label="Urgencia media" value={`${averageUrgency}%`} />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              <div className="cyber-card p-6">
                <h2 className="text-xl font-bold neon-cyan mb-5">Sentimentos</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={92} label>
                        {sentimentData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="cyber-card p-6">
                <h2 className="text-xl font-bold neon-cyan mb-5">Fontes</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#164e63" />
                      <XAxis dataKey="name" stroke="#67e8f9" />
                      <YAxis allowDecimals={false} stroke="#67e8f9" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00ffff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="cyber-card p-6 xl:col-span-2">
                <h2 className="text-xl font-bold neon-cyan mb-5">Aspectos mais citados</h2>
                {aspectData.length === 0 ? (
                  <p className="text-gray-400">Nenhum aspecto detectado.</p>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aspectData} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#164e63" />
                        <XAxis type="number" allowDecimals={false} stroke="#67e8f9" />
                        <YAxis type="category" dataKey="name" stroke="#67e8f9" width={90} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ff2bd6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="cyber-card p-6">
                <h2 className="text-xl font-bold neon-cyan mb-5 flex items-center gap-2">
                  <FileText size={20} /> Mencoes recentes
                </h2>
                <div className="space-y-4 max-h-72 overflow-auto pr-2">
                  {mentions.slice(0, 6).map((mention) => (
                    <div key={mention.id} className="border border-cyan-400/50 p-3 bg-black/40">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs text-cyan-300 uppercase">{mention.source}</span>
                        <span className="text-xs text-pink-400">{mention.sentiment}</span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-3">{mention.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="cyber-card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400 uppercase">{label}</span>
        <Icon size={22} className="text-cyan-400" />
      </div>
      <div className="text-3xl font-bold neon-pink">{value}</div>
    </div>
  );
}
