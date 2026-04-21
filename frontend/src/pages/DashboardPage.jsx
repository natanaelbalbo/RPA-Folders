import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  FileCheck2,
  FileX2,
  Clock,
  RefreshCw,
  Play,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Filter,
  CalendarDays,
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
  iniciarProcessamento,
  reprocessarArquivo,
} from "@/api/apiService";

const STATUS_CONFIG = {
  SUCESSO: { variant: "success", icon: CheckCircle2, label: "Sucesso" },
  ERRO: { variant: "error", icon: XCircle, label: "Erro" },
  PROCESSANDO: { variant: "warning", icon: Loader2, label: "Processando" },
  PENDENTE: { variant: "outline", icon: Clock, label: "Pendente" },
};

export function DashboardPage() {
  const [status, setStatus] = useState(null);
  const [arquivos, setArquivos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reprocessingId, setReprocessingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusData, arquivosData, empresasData, historicoData] =
        await Promise.all([
          getStatus().catch(() => null),
          getArquivos(filtro !== "todos" ? { periodo: filtro } : {}).catch(() => []),
          getEmpresas().catch(() => []),
          getHistorico(30).catch(() => []),
        ]);
      if (statusData) setStatus(statusData);
      setArquivos(arquivosData);
      setEmpresas(empresasData);
      setHistorico(historicoData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleProcessar = async () => {
    setProcessing(true);
    try {
      await iniciarProcessamento();
      await fetchData();
    } catch (err) {
      console.error("Erro no processamento:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReprocessar = async (id) => {
    setReprocessingId(id);
    try {
      await reprocessarArquivo(id);
      await fetchData();
    } catch (err) {
      console.error("Erro ao reprocessar:", err);
    } finally {
      setReprocessingId(null);
    }
  };

  const stats = status?.stats || { total: 0, sucesso: 0, erro: 0, pendente: 0, processando: 0 };
  const isOnline = status?.system?.status === "online";

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Monitoramento em tempo real" />

      <div className="space-y-6 p-6">
        {/* Barra de ações */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Status do sistema */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOnline ? "bg-success animate-pulse" : "bg-destructive"
                }`}
              />
              <span className="text-sm font-medium text-foreground">
                {isOnline ? "Sistema Online" : "Sistema Offline"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>

          <Button onClick={handleProcessar} loading={processing} disabled={processing}>
            <Play className="h-4 w-4" />
            {processing ? "Processando..." : "Processar Google Drive"}
          </Button>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card hover className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Processados</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card hover className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sucesso</p>
                <p className="mt-1 text-3xl font-bold text-success">{stats.sucesso}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <FileCheck2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          <Card hover className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Erros</p>
                <p className="mt-1 text-3xl font-bold text-destructive">{stats.erro}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <FileX2 className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>

          <Card hover className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="mt-1 text-3xl font-bold text-warning">{stats.pendente + stats.processando}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros + Tabela de Arquivos + Empresas */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Arquivos Processados */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-primary" />
                  Arquivos Processados
                </CardTitle>
                {/* Filtros de período */}
                <div className="flex gap-1">
                  {[
                    { key: "todos", label: "Todos" },
                    { key: "hoje", label: "Hoje" },
                    { key: "ontem", label: "Ontem" },
                    { key: "7dias", label: "7 Dias" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFiltro(f.key)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        filtro === f.key
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {arquivos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileCheck2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Nenhum arquivo processado</p>
                    <p className="text-xs text-muted-foreground/60">
                      Clique em "Processar Google Drive" para iniciar
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-3 py-3 font-medium text-muted-foreground">Arquivo</th>
                          <th className="px-3 py-3 font-medium text-muted-foreground">Tipo</th>
                          <th className="px-3 py-3 font-medium text-muted-foreground">Empresa</th>
                          <th className="px-3 py-3 font-medium text-muted-foreground">Status</th>
                          <th className="px-3 py-3 font-medium text-muted-foreground">Data</th>
                          <th className="px-3 py-3 font-medium text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {arquivos.map((arq, i) => {
                          const cfg = STATUS_CONFIG[arq.status] || STATUS_CONFIG.PENDENTE;
                          const StatusIcon = cfg.icon;
                          return (
                            <tr
                              key={arq.id}
                              className="border-b border-border/50 transition-colors hover:bg-muted/30 animate-fade-in"
                              style={{ animationDelay: `${i * 0.03}s` }}
                            >
                              <td className="px-3 py-3">
                                <div>
                                  <p className="font-medium text-foreground truncate max-w-[200px]">
                                    {arq.nome_processado || arq.nome_original}
                                  </p>
                                  {arq.nome_processado && arq.nome_original !== arq.nome_processado && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      Original: {arq.nome_original}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <Badge variant={arq.tipo === "XML" ? "default" : arq.tipo === "NF" ? "warning" : "success"}>
                                  {arq.tipo || "—"}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 text-foreground">
                                {arq.empresa_nome || "—"}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5">
                                  <StatusIcon className={`h-3.5 w-3.5 ${arq.status === "PROCESSANDO" ? "animate-spin" : ""}`} />
                                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-muted-foreground">
                                {formatDate(arq.processed_at || arq.created_at)}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  {arq.caminho_destino && (() => {
                                    const url = getFileUrl(arq.caminho_destino);
                                    return url ? (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Abrir arquivo"
                                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    ) : null;
                                  })()}
                                  {arq.status === "ERRO" && (
                                    <button
                                      title="Reprocessar"
                                      onClick={() => handleReprocessar(arq.id)}
                                      disabled={reprocessingId === arq.id}
                                      className="rounded-md p-1.5 text-warning transition-colors hover:bg-warning/10"
                                    >
                                      <RotateCcw
                                        className={`h-3.5 w-3.5 ${reprocessingId === arq.id ? "animate-spin" : ""}`}
                                      />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Empresas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent" />
                  Empresas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {empresas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada</p>
                ) : (
                  <div className="space-y-3">
                    {empresas.map((emp, i) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-all hover:border-primary/30 hover:bg-muted/30 animate-slide-in"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <div>
                          <p className="font-medium text-foreground">{emp.nome}</p>
                          <p className="text-xs text-muted-foreground">{emp.cnpj}</p>
                        </div>
                        <Badge variant="outline">{emp.total_arquivos || 0} arquivos</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico Recente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Histórico Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem atividade recente</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {historico.slice(0, 10).map((log, i) => (
                      <div
                        key={log.id}
                        className="flex gap-3 animate-slide-in"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="mt-1">
                          {log.status === "SUCESSO" ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : log.status === "ERRO" ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Activity className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{log.acao}</p>
                          {log.detalhes && (
                            <p className="text-xs text-muted-foreground truncate">
                              {log.detalhes}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {formatDate(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
