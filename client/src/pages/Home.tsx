import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      setLocation("/search");
    }
  }, [isAuthenticated, loading, setLocation, user]);

  if (loading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center grid-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="mt-4 neon-cyan">Inicializando SentimentoIA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <nav
        className="border-b-2 border-cyan-400 sticky top-0 z-50"
        style={{ backgroundColor: "rgba(26, 26, 26, 0.8)", backdropFilter: "blur(4px)" }}
      >
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold neon-pink">[SENTIMENTO</div>
            <div className="text-2xl font-bold neon-cyan">IA]</div>
          </div>
          <div className="flex gap-3">
            <a href="/login" className="px-4 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold transition-all">
              LOGIN
            </a>
            <a href="/register" className="cyber-button">
              CADASTRO
            </a>
          </div>
        </div>
      </nav>

      <section className="container py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 neon-glow">
              ANALISE DE REPUTACAO DIGITAL
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Monitore sua marca, encontre mencoes criticas, gere insights com IA e tome decisoes estrategicas com dados reais.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/login" className="cyber-button">
                ENTRAR
              </a>
              <a href="/register" className="px-6 py-2 border-2 border-cyan-400 text-cyan-400 font-bold hover:bg-cyan-400 hover:text-dark-bg transition-all">
                CRIAR CONTA
              </a>
            </div>
          </div>
          <div className="cyber-card p-8 h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">IA</div>
              <p className="neon-cyan text-xl font-bold">DECISAO EM TEMPO REAL</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <h2 className="text-4xl font-bold text-center mb-16 neon-glow">
          FLUXO DO SISTEMA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            ["1", "LOGIN OU CADASTRO", "Acesse sua conta ou crie um novo usuario."],
            ["2", "BUSCA POS-LOGIN", "Pesquise uma marca e colete dados reais."],
            ["3", "DASHBOARD E ANALISE", "Veja graficos e decisoes geradas pela LLM."],
          ].map(([step, title, desc]) => (
            <div key={step} className="cyber-card p-6 hover:pulse-glow transition-all">
              <div className="text-4xl font-bold neon-pink mb-4">{step}</div>
              <h3 className="text-lg font-bold neon-cyan mb-2">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-20 text-center">
        <div className="cyber-card p-12">
          <h2 className="text-3xl font-bold mb-6 neon-glow">
            PRONTO PARA ANALISAR SUA REPUTACAO?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Comece pelo cadastro ou entre para ir direto para a tela de busca.
          </p>
          <a href="/register" className="cyber-button inline-block">
            CRIAR CONTA AGORA
          </a>
        </div>
      </section>
    </div>
  );
}
