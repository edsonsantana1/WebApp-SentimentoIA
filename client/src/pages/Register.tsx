import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { authApi, setAuthSession } from "@/lib/api";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!formData.email.includes("@")) newErrors.email = "Email inválido";
    if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
    if (formData.password.length < 8) newErrors.password = "Mínimo 8 caracteres";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      setAuthSession(response.access_token, response.user);
      setSuccess(true);
      setTimeout(() => setLocation("/search"), 800);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : "Erro ao registrar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, 0.05) 25%, rgba(0, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.05) 75%, rgba(0, 255, 255, 0.05) 76%, transparent 77%, transparent)",
          backgroundSize: "50px 50px"
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="border-2 border-cyan-500 bg-black/50 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pink-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pink-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-500" />

          <h1 className="text-3xl font-bold text-pink-500 mb-2 text-center font-mono tracking-widest" style={{ textShadow: "0 0 10px rgba(255, 0, 255, 0.8)" }}>
            CADASTRO
          </h1>
          <p className="text-cyan-400 text-center mb-6 text-sm font-mono">Crie sua conta SentimentoIA</p>

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-400 text-sm">Cadastro realizado com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-cyan-400 font-mono text-xs mb-1 block">NOME COMPLETO</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="João Silva"
                className="bg-black/50 border border-cyan-500 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none font-mono"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-xs mb-1 block">EMAIL</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="bg-black/50 border border-cyan-500 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none font-mono"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-xs mb-1 block">TELEFONE</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
                className="bg-black/50 border border-cyan-500 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none font-mono"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-xs mb-1 block">SENHA</Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-black/50 border border-cyan-500 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none font-mono"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label className="text-cyan-400 font-mono text-xs mb-1 block">CONFIRMAR SENHA</Label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="bg-black/50 border border-cyan-500 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none font-mono"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-900/20 border border-red-500 rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-400 text-sm">{errors.submit}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 font-mono tracking-wider disabled:opacity-50"
            >
              {loading ? "PROCESSANDO..." : "CRIAR CONTA"}
            </Button>
          </form>

          <p className="text-center text-cyan-400 text-sm mt-4 font-mono">
            Já tem conta?{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-pink-500 hover:text-pink-400 font-bold"
            >
              FAÇA LOGIN
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
