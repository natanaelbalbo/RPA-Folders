import { useState, useEffect } from "react";
import {
  FolderOpen,
  Upload,
  FileText,
  FileCode,
  FileSpreadsheet,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { formatDate } from "@/lib/utils";
import { getEmpresa, uploadArquivo, getEmpresas } from "@/api/apiService";

const FOLDER_CONFIG = {
  xml: { label: "XML (NF-e)", icon: FileCode, color: "text-primary", bgColor: "bg-primary/10", tipo: "XML" },
  nf: { label: "Notas Fiscais", icon: FileText, color: "text-warning", bgColor: "bg-warning/10", tipo: "NF" },
  extratos: { label: "Extratos", icon: FileSpreadsheet, color: "text-success", bgColor: "bg-success/10", tipo: "EXTRATO" },
};

export function SistemaPage() {
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [empresaData, setEmpresaData] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  useEffect(() => {
    getEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  }, []);

  useEffect(() => {
    if (selectedEmpresa) {
      getEmpresa(selectedEmpresa.id).then(setEmpresaData).catch(() => setEmpresaData(null));
    }
  }, [selectedEmpresa]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmpresa || !selectedFolder) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const cfg = FOLDER_CONFIG[selectedFolder];
      await uploadArquivo(selectedEmpresa.id, cfg.tipo, file);
      setUploadMsg({ type: "success", text: `"${file.name}" enviado com sucesso!` });
      const updated = await getEmpresa(selectedEmpresa.id);
      setEmpresaData(updated);
    } catch (err) {
      setUploadMsg({ type: "error", text: `Erro ao enviar: ${err.message}` });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ─── VISUALIZAÇÃO DE PASTA ───
  if (selectedFolder && empresaData) {
    const folderCfg = FOLDER_CONFIG[selectedFolder];
    const FolderIcon = folderCfg.icon;
    const files = empresaData.arquivos?.[selectedFolder] || [];

    return (
      <div className="min-h-screen">
        <Header title={`${selectedEmpresa.nome} / ${folderCfg.label}`} subtitle="Arquivos da pasta" />
        <div className="p-6 space-y-6">
          <Button variant="ghost" onClick={() => { setSelectedFolder(null); setUploadMsg(null); }}>
            <ArrowLeft className="h-4 w-4" />
            Voltar às Pastas
          </Button>

          {/* Área de Upload */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Upload className="mb-3 h-10 w-10 text-primary/50" />
              <p className="mb-1 text-sm font-medium text-foreground">Arraste ou selecione um arquivo</p>
              <p className="mb-4 text-xs text-muted-foreground">Será salvo em /{selectedFolder}</p>
              <label>
                <input type="file" className="hidden" onChange={handleUpload} data-action="upload" />
                <Button variant="default" size="sm" loading={uploading} as="span">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivo
                </Button>
              </label>
              {uploadMsg && (
                <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                  uploadMsg.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {uploadMsg.type === "success"
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <AlertCircle className="h-4 w-4" />}
                  {uploadMsg.text}
                </div>
              )}
            </div>
          </Card>

          {/* Lista de arquivos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderIcon className={`h-5 w-5 ${folderCfg.color}`} />
                Arquivos em /{selectedFolder}
              </CardTitle>
              <Badge variant="outline">{files.length} arquivos</Badge>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum arquivo nesta pasta</p>
              ) : (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30 animate-slide-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <FolderIcon className={`h-4 w-4 ${folderCfg.color} shrink-0`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{f.nome_processado || f.nome_original}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(f.processed_at || f.created_at)}</p>
                        </div>
                      </div>
                      <Badge variant={f.status === "SUCESSO" ? "success" : "error"}>{f.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── PASTAS DA EMPRESA ───
  if (selectedEmpresa) {
    return (
      <div className="min-h-screen">
        <Header title={selectedEmpresa.nome} subtitle={selectedEmpresa.cnpj} />
        <div className="p-6 space-y-6">
          <Button variant="ghost" onClick={() => { setSelectedEmpresa(null); setEmpresaData(null); }}>
            <ArrowLeft className="h-4 w-4" />
            Voltar às Empresas
          </Button>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.entries(FOLDER_CONFIG).map(([key, cfg], i) => {
              const Icon = cfg.icon;
              const count = empresaData?.arquivos?.[key]?.length || 0;
              return (
                <Card
                  key={key}
                  hover
                  className="cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => setSelectedFolder(key)}
                >
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${cfg.bgColor}`}>
                      <Icon className={`h-8 w-8 ${cfg.color}`} />
                    </div>
                    <p className="font-semibold text-foreground">{cfg.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{count} arquivos</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── SELEÇÃO DE EMPRESA ───
  return (
    <div className="min-h-screen">
      <Header title="Sistema" subtitle="Selecione uma empresa para gerenciar" />
      <div className="p-6">
        {empresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((emp, i) => (
              <Card
                key={emp.id}
                hover
                className="cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => setSelectedEmpresa(emp)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{emp.nome}</p>
                    <p className="text-sm text-muted-foreground">{emp.cnpj}</p>
                    <Badge variant="outline" className="mt-1">{emp.total_arquivos || 0} arquivos</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
