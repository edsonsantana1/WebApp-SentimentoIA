import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Filter, LogOut, Zap } from "lucide-react";
import { sentimentApi } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [brandName, setBrandName] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["google", "reddit"]);
  const [locality, setLocality] = useState("");
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const sources = [
    { id: "google", name: "Google", icon: "G" },
    { id: "reddit", name: "Reddit", icon: "R" },
    { id: "x", name: "X (Twitter)", icon: "X" },
  ];

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSources.length === 0) {
      alert("Selecione pelo menos uma fonte para iniciar a busca.");
      return;
    }

    setLoading(true);

    try {
      const result = await sentimentApi.search({
        brand_name: brandName,
        sources: selectedSources,
        period_days: periodDays,
        locality: locality || undefined,
      });
      setLastResult(result);
      if ((result.total ?? result.mentions?.length ?? 0) > 0) {
        setLocation("/dashboard");
      } else {
        alert("Busca concluida, mas nenhuma fonte retornou dados. Verifique Google Places, Reddit ou X/snscrape.");
      }
    } catch (err) {
      console.error("Erro na busca", err);
      alert(err instanceof Error ? err.message : "Erro na busca");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg">
      <nav className="border-b-2 border-cyan-400" style={{ backgroundColor: "oklch(0.1 0 0)" }}>
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold neon-pink">SENTIMENTO</div>
            <div className="text-2xl font-bold neon-cyan">IA</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLocation("/dashboard")}
              className="px-4 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors"
            >
              DASHBOARD
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-colors flex items-center gap-2"
            >
              <LogOut size={16} /> SAIR
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold neon-glow mb-2">BUSCAR MENCOES</h1>
          <p className="text-gray-400 mb-12">Pesquise sua marca em multiplas fontes e colete mencoes para analise</p>

          <form onSubmit={handleSearch} className="space-y-8">
            <div className="cyber-card p-8">
              <div className="hud-corner hud-corner-tl"></div>
              <div className="hud-corner hud-corner-tr"></div>
              <div className="hud-corner hud-corner-bl"></div>
              <div className="hud-corner hud-corner-br"></div>

              <label className="block text-sm font-bold neon-cyan mb-4">MARCA A PESQUISAR</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-cyan-400" size={20} />
                <input
                  type="text"
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  placeholder="Digite o nome da marca..."
                  className="w-full pl-10 pr-4 py-3 bg-black border-2 border-cyan-400 text-pink-500 placeholder-gray-600 focus:outline-none focus:border-pink-500 text-lg"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                A busca usa integracoes reais: Google Places, Reddit publico e X/snscrape quando habilitado. Se uma fonte nao retornar dados, nada mockado sera criado.
              </p>
            </div>

            <div className="cyber-card p-8">
              <div className="hud-corner hud-corner-tl"></div>
              <div className="hud-corner hud-corner-tr"></div>
              <div className="hud-corner hud-corner-bl"></div>
              <div className="hud-corner hud-corner-br"></div>

              <label className="block text-sm font-bold neon-cyan mb-6">SELECIONE AS FONTES</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSource(source.id)}
                    disabled={loading}
                    className={`p-4 border-2 transition-all ${
                      selectedSources.includes(source.id)
                        ? "border-pink-500 bg-pink-500/10 text-pink-500"
                        : "border-cyan-400 bg-black text-cyan-400 hover:bg-cyan-400/10"
                    }`}
                  >
                    <div className="font-bold text-sm">{source.icon}</div>
                    <div className="text-xs mt-1">{source.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="cyber-card p-8">
              <div className="hud-corner hud-corner-tl"></div>
              <div className="hud-corner hud-corner-tr"></div>
              <div className="hud-corner hud-corner-bl"></div>
              <div className="hud-corner hud-corner-br"></div>

              <label className="block text-sm font-bold neon-cyan mb-6 flex items-center gap-2">
                <Filter size={18} />
                PARAMETROS DA BUSCA
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">PERIODO</label>
                  <select
                    value={periodDays}
                    onChange={(event) => setPeriodDays(Number(event.target.value))}
                    className="w-full px-3 py-2 bg-black border-2 border-cyan-400 text-cyan-400 focus:outline-none focus:border-pink-500"
                    disabled={loading}
                  >
                    <option value={7}>Ultimos 7 dias</option>
                    <option value={30}>Ultimos 30 dias</option>
                    <option value={90}>Ultimos 90 dias</option>
                    <option value={365}>Ultimo ano</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">LOCALIDADE</label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(event) => setLocality(event.target.value)}
                    placeholder="Ex: Brasil, Sao Paulo"
                    className="w-full px-3 py-2 bg-black border-2 border-cyan-400 text-cyan-400 placeholder-gray-600 focus:outline-none focus:border-pink-500"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {lastResult && (
              <div className="cyber-card p-6">
                <h3 className="text-lg font-bold neon-cyan mb-3">RESULTADO DA ULTIMA BUSCA</h3>
                <p className="text-gray-300">Encontradas: {lastResult.total ?? lastResult.mentions?.length ?? 0}</p>
                {lastResult.llm_analysis?.error && <p className="text-yellow-400 mt-2">LLM: {lastResult.llm_analysis.error}</p>}
                {lastResult?.errors?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {lastResult.errors.map((err: any, idx: number) => (
                      <div key={idx} className="border border-red-500/60 p-3 text-sm text-red-300">
                        {typeof err === "string" ? err : <><b>{err.source}</b>: {err.error}</>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !brandName || selectedSources.length === 0}
              className="cyber-button w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap size={20} />
              {loading ? "PROCESSANDO BUSCA..." : "INICIAR BUSCA"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
