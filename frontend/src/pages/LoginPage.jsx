import { useState } from "react";
import { Bot, LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    await login(usuario, senha);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Fundo com gradiente animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30 mb-4">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">RPA Automation</h1>
          <p className="text-sm text-muted-foreground mt-1">Painel de Controle Inteligente</p>
        </div>

        {/* Card de login */}
        <div
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Acessar sistema</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Usuário */}
            <div className="space-y-1.5">
              <label htmlFor="usuario" className="text-sm font-medium text-foreground">
                Usuário
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                autoComplete="username"
                placeholder="Digite seu usuário"
                value={usuario}
                onChange={(e) => { setUsuario(e.target.value); setError(""); }}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label htmlFor="senha" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  name="senha"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError(""); }}
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive animate-fade-in">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 mt-2" loading={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          RPA Automation © 2026 - Sistema de Processamento Inteligente
        </p>
      </div>
    </div>
  );
}
