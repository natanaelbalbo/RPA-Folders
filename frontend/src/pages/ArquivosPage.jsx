import { useState, useEffect } from "react";
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  Search,
  Filter,
  ExternalLink,
  RotateCcw,
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

export function ArquivosPage({ onMenuClick }) {
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
      <Header 
        title="Arquivos" 
        subtitle="Todos os arquivos processados" 
        onMenuClick={onMenuClick} 
      />
      
      <div className="p-4 lg:p-6 space-y-6">
        {/* Filtros e Busca */}
        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou empresa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="">Tipos</option>
                <option value="XML">XML</option>
                <option value="NF">NF</option>
                <option value="EXTRATO">Extrato</option>
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="">Status</option>
                <option value="SUCESSO">Sucesso</option>
                <option value="ERRO">Erro</option>
                <option value="PENDENTE">Pendente</option>
              </select>

              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer sm:col-span-1 col-span-2"
              >
                <option value="">Qualquer data</option>
                <option value="Hoje">Hoje</option>
                <option value="Ontem">Ontem</option>
                <option value="7 Dias">7 dias</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tabela de Arquivos */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 sm:p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-4 font-medium text-muted-foreground">Arquivo</th>
                    <th className="px-4 py-4 font-medium text-muted-foreground text-center">Tipo</th>
                    <th className="px-4 py-4 font-medium text-muted-foreground">Empresa</th>
                    <th className="px-4 py-4 font-medium text-muted-foreground text-center">Status</th>
                    <th className="px-4 py-4 font-medium text-muted-foreground">Data</th>
                    <th className="px-4 py-4 font-medium text-muted-foreground">Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((arq, i) => {
                      const TipoIcon = TIPO_ICONS[arq.tipo] || FileText;
                      return (
                        <tr
                          key={arq.id}
                          className="border-b border-border/50 transition-colors hover:bg-muted/30 animate-fade-in"
                          style={{ animationDelay: `${i * 0.02}s` }}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                                <TipoIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-medium text-foreground truncate max-w-[200px]" title={arq.nome_processado || arq.nome_original}>
                                  {arq.nome_processado || arq.nome_original}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                  {arq.nome_original}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge variant="outline" className="text-[10px]">{arq.tipo}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs font-medium text-foreground">{arq.empresa_nome || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{arq.empresa_cnpj}</p>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge
                              variant={
                                arq.status === "SUCESSO" ? "success" :
                                arq.status === "ERRO" ? "error" : "warning"
                              }
                              className="text-[10px]"
                            >
                              {arq.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(arq.created_at)}
                          </td>
                          <td className="px-4 py-4">
                             {arq.caminho_destino ? (() => {
                              const url = getFileUrl(arq.caminho_destino);
                              const filename = arq.caminho_destino.split(/[/\\]/).pop();
                              return url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[10px] text-primary hover:underline transition-all cursor-pointer truncate max-w-[120px]"
                                >
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                  {filename}
                                </a>
                              ) : (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px] block">{filename}</span>
                              );
                            })() : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
