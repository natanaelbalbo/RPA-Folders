import { useState, useEffect } from "react";
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { formatDate, getFileUrl } from "@/lib/utils";
import { getArquivos, reprocessarArquivo } from "@/api/apiService";

const TIPO_ICONS = {
  XML: FileCode,
  NF: FileText,
  EXTRATO: FileSpreadsheet,
};

export function ArquivosPage() {
  const [arquivos, setArquivos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [busca, setBusca] = useState("");
  const [reprocessingId, setReprocessingId] = useState(null);

  const fetchArquivos = async () => {
    const params = {};
    if (filtroTipo) params.tipo = filtroTipo;
    if (filtroStatus) params.status = filtroStatus;
    if (filtroPeriodo) params.periodo = filtroPeriodo;
    const data = await getArquivos(params).catch(() => []);
    setArquivos(data);
  };

  useEffect(() => {
    fetchArquivos();
  }, [filtroTipo, filtroStatus, filtroPeriodo]);

  const handleReprocessar = async (id) => {
    setReprocessingId(id);
    try {
      await reprocessarArquivo(id);
      await fetchArquivos();
    } catch (err) {
      console.error(err);
    } finally {
      setReprocessingId(null);
    }
  };

  const filtered = arquivos.filter((a) => {
    if (!busca) return true;
    const term = busca.toLowerCase();
    return (
      a.nome_original?.toLowerCase().includes(term) ||
      a.nome_processado?.toLowerCase().includes(term) ||
      a.empresa_nome?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen">
      <Header title="Arquivos" subtitle="Todos os arquivos processados" />
      <div className="p-6 space-y-6">
        {/* Filtros */}
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou empresa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos os tipos</option>
              <option value="XML">XML (NF-e)</option>
              <option value="NF">Nota Fiscal</option>
              <option value="EXTRATO">Extrato</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos os status</option>
              <option value="SUCESSO">Sucesso</option>
              <option value="ERRO">Erro</option>
              <option value="PENDENTE">Pendente</option>
              <option value="PROCESSANDO">Processando</option>
            </select>

            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Qualquer data</option>
              <option value="hoje">Hoje</option>
              <option value="ontem">Ontem</option>
              <option value="7dias">Últimos 7 dias</option>
            </select>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Arquivo</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Processado em</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((arq, i) => {
                      const TipoIcon = TIPO_ICONS[arq.tipo] || FileText;
                      return (
                        <tr
                          key={arq.id}
                          className="border-b border-border/50 transition-colors hover:bg-muted/30 animate-fade-in"
                          style={{ animationDelay: `${i * 0.02}s` }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <TipoIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="font-medium text-foreground truncate max-w-[250px]">
                                  {arq.nome_processado || arq.nome_original}
                                </p>
                                {arq.nome_processado && arq.nome_original !== arq.nome_processado && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                    {arq.nome_original}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge>{arq.tipo || "—"}</Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            <div>
                              <p>{arq.empresa_nome || "—"}</p>
                              {arq.empresa_cnpj && (
                                <p className="text-xs text-muted-foreground">{arq.empresa_cnpj}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                arq.status === "SUCESSO" ? "success" :
                                arq.status === "ERRO" ? "error" :
                                arq.status === "PROCESSANDO" ? "warning" : "outline"
                              }
                            >
                              {arq.status}
                            </Badge>
                            {arq.error_message && (
                              <p className="mt-1 text-xs text-destructive truncate max-w-[200px]" title={arq.error_message}>
                                {arq.error_message}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(arq.processed_at)}
                          </td>
                          <td className="px-4 py-3">
                            {arq.caminho_destino ? (() => {
                              const url = getFileUrl(arq.caminho_destino);
                              const filename = arq.caminho_destino.split(/[/\\]/).pop();
                              return url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir arquivo"
                                  className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[150px]"
                                >
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                  {filename}
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground truncate max-w-[150px] block">{filename}</span>
                              );
                            })() : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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
    </div>
  );
}
