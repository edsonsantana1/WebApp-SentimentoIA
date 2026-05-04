import { useState } from "react";
import { useLocation } from "wouter";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { authApi, setAuthSession } from "@/lib/api";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Email e senha são obrigatórios");
        return;
      }

      const response = await authApi.login({ email, password });
      setAuthSession(response.access_token, response.user);
      setLocation("/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-4xl font-bold neon-pink">[SENTIMENTO</div>
            <div className="text-4xl font-bold neon-cyan">IA]</div>
          </div>
          <p className="text-sm text-gray-400">Analise de Reputacao Digital</p>
        </div>

        <div className="cyber-card p-8">
          <div className="hud-corner hud-corner-tl"></div>
          <div className="hud-corner hud-corner-tr"></div>
          <div className="hud-corner hud-corner-bl"></div>
          <div className="hud-corner hud-corner-br"></div>

          <h1 className="text-2xl font-bold neon-glow mb-8 text-center">ACESSO AO SISTEMA</h1>

          {error && (
            <div className="mb-6 p-4 border-2 border-red-500 bg-red-500/10 rounded">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold neon-cyan mb-2">EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-cyan-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2 bg-black border-2 border-cyan-400 text-pink-500 placeholder-gray-600 focus:outline-none focus:border-pink-500"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold neon-cyan mb-2">SENHA</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-cyan-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-black border-2 border-cyan-400 text-pink-500 placeholder-gray-600 focus:outline-none focus:border-pink-500"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cyber-button w-full mt-8 disabled:opacity-50"
            >
              {loading ? "AUTENTICANDO..." : "ACESSAR SISTEMA"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-cyan-400/30"></div>
            <span className="text-xs text-gray-500">OU</span>
            <div className="flex-1 h-px bg-cyan-400/30"></div>
          </div>

          <p className="text-center text-sm text-gray-400">
            Não tem conta?{" "}
            <button onClick={() => setLocation("/register")} className="text-cyan-400 hover:text-pink-500 font-bold">
              CRIAR CONTA
            </button>
          </p>
        </div>

        <div className="text-center mt-8 text-xs text-gray-500">
          <p>© 2026 SentimentoIA. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
