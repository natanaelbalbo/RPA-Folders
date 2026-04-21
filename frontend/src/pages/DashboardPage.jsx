import { useState, useEffect } from "react";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCcw,
  FileText,
  Building2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { formatDate, getFileUrl } from "@/lib/utils";
import {
  getStatus,
  getArquivos,
  getEmpresas,
  getHistorico,
} from "@/api/apiService";

export function DashboardPage({ onMenuClick }) {
  const [stats, setStats] = useState({
    total: 0,
    sucesso: 0,
    erro: 0,
    pendente: 0,
  });
  const [arquivos, setArquivos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState("hoje");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, arquivosRes, empresasRes, historicoRes] =
        await Promise.all([
          getStatus(),
          getArquivos({ periodo: filtroPeriodo }),
          getEmpresas(),
          getHistorico({ limit: 10 }),
        ]);

      setStats(statusRes.stats);
      setArquivos(arquivosRes);
      setEmpresas(empresasRes);
      setHistorico(historicoRes);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh a cada 30s
    return () => clearInterval(interval);
  }, [filtroPeriodo]);

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Monitoramento em tempo real"
        onMenuClick={onMenuClick}
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Top Actions/Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-sm font-medium text-foreground">Sistema Online</span>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" onClick={fetchData} className="cursor-pointer">
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              Atualizar
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-lg shadow-primary/20">
              <TrendingUp className="h-4 w-4" />
              Processar Google Drive
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Processados</p>
                <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sucesso</p>
                <h3 className="text-2xl font-bold text-success">{stats.sucesso}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Erros</p>
                <h3 className="text-2xl font-bold text-destructive">{stats.erro}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <h3 className="text-2xl font-bold text-warning">{stats.pendente}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Files Table */}
          <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Arquivos Processados
              </CardTitle>
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                {["todos", "hoje", "ontem", "7dias"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFiltroPeriodo(p)}
                    className={cn(
                      "px-3 py-1 text-[10px] lg:text-xs font-medium rounded-md transition-all cursor-pointer",
                      filtroPeriodo === p ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 py-3 font-medium text-muted-foreground">Arquivo</th>
                    <th className="px-3 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="px-3 py-3 font-medium text-muted-foreground">Empresa</th>
                    <th className="px-3 py-3 font-medium text-muted-foreground text-center">Status</th>
                    <th className="px-3 py-3 font-medium text-muted-foreground">Data</th>
                    <th className="px-3 py-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {arquivos.slice(0, 10).map((arq, i) => (
                    <tr key={arq.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground max-w-[150px] lg:max-w-[200px] truncate" title={arq.nome_processado || arq.nome_original}>
                          {arq.nome_processado || arq.nome_original}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px] lg:max-w-[200px]">Original: {arq.nome_original}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="text-[10px]">{arq.tipo}</Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {arq.empresa_nome || "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant={arq.status === "SUCESSO" ? "success" : arq.status === "ERRO" ? "error" : "warning"} className="text-[10px]">
                           {arq.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {formatDate(arq.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        {arq.caminho_destino && (() => {
                          const url = getFileUrl(arq.caminho_destino);
                          return url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null;
                        })()}
                      </td>
                    </tr>
                  ))}
                  {arquivos.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-muted-foreground">Nenhum arquivo processado no período selecionado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Companies Quick View */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Empresas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {empresas.slice(0, 5).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-foreground truncate">{emp.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.cnpj}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{emp.total_arquivos} arquivos</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent History / Logs */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Histórico Recente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {historico.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex gap-3 animate-slide-in">
                    <div className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      log.status === "SUCESSO" ? "bg-success" : log.status === "ERRO" ? "bg-destructive" : "bg-primary"
                    )} />
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-foreground truncate">{log.acao}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{log.detalhes}</p>
                      <p className="text-[9px] text-muted-foreground/60">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper local para usar cn dentro do componente
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
