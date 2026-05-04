import { useLocation } from "wouter";
import { Download, FileText, LogOut } from "lucide-react";
import { downloadReport } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ReportsPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background grid-bg">
      <nav className="border-b-2 border-cyan-400" style={{ backgroundColor: "oklch(0.1 0 0)" }}>
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold neon-pink">SENTIMENTO</div>
            <div className="text-2xl font-bold neon-cyan">IA</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setLocation("/search")} className="px-4 py-2 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black">
              BUSCA
            </button>
            <button onClick={logout} className="px-4 py-2 border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-black flex items-center gap-2">
              <LogOut size={16} /> SAIR
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold neon-glow mb-2">RELATÓRIOS E EXPORTAÇÕES</h1>
        <p className="text-gray-400 mb-10">Gere relatórios reais com base nas menções armazenadas no MongoDB.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="cyber-card p-8">
            <h2 className="text-2xl font-bold neon-cyan mb-4">Exportação CSV</h2>
            <p className="text-gray-300 mb-6">Arquivo tabular com marca, fonte, sentimento, criticidade, aspectos e texto da menção.</p>
            <button onClick={() => downloadReport("csv")} className="cyber-button px-6 py-3 flex items-center gap-2">
              <Download size={18} /> BAIXAR CSV
            </button>
          </div>

          <div className="cyber-card p-8">
            <h2 className="text-2xl font-bold neon-cyan mb-4">Relatório PDF</h2>
            <p className="text-gray-300 mb-6">Resumo executivo com métricas agregadas e lista de menções críticas/recentes.</p>
            <button onClick={() => downloadReport("pdf")} className="cyber-button px-6 py-3 flex items-center gap-2">
              <FileText size={18} /> BAIXAR PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
