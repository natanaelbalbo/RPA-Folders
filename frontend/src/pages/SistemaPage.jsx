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
  Folder,
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

export function SistemaPage({ onMenuClick }) {
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


  if (selectedFolder && empresaData) {
    const folderCfg = FOLDER_CONFIG[selectedFolder];
    const FolderIcon = folderCfg.icon;
    const files = empresaData.arquivos?.[selectedFolder] || [];

    return (
      <div className="min-h-screen">
        <Header 
          title={folderCfg.label} 
          subtitle={selectedEmpresa.nome} 
          onMenuClick={onMenuClick} 
        />
        <div className="p-4 lg:p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedFolder(null); setUploadMsg(null); }} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          {/* Área de Upload */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Upload className="mb-4 h-12 w-12 text-primary/50" />
              <p className="mb-1 text-base font-semibold text-foreground">Upload de arquivo</p>
              <p className="mb-6 text-xs text-muted-foreground">O arquivo será armazenado na pasta /{selectedFolder}</p>
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleUpload} />
                <Button variant="default" size="md" loading={uploading} as="span" className="shadow-lg shadow-primary/20">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivo
                </Button>
              </label>
              {uploadMsg && (
                <div className={`mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm animate-fade-in ${
                  uploadMsg.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}>
                  {uploadMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span className="font-medium">{uploadMsg.text}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Arquivos na Pasta */}
          <Card>
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <Folder className={`h-5 w-5 ${folderCfg.color}`} />
                Arquivos na pasta
              </CardTitle>
              <Badge variant="secondary">{files.length} itens</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {files.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <FolderOpen className="mx-auto mb-3 h-10 w-10 opacity-20" />
                  <p className="text-sm">Esta pasta está vazia.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((f, i) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border/50 p-4 transition-all hover:bg-muted/30 animate-slide-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${folderCfg.bgColor}`}>
                          <FolderIcon className={`h-5 w-5 ${folderCfg.color}`} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-foreground truncate" title={f.nome_processado || f.nome_original}>
                            {f.nome_processado || f.nome_original}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(f.processed_at || f.created_at)}</p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px] hidden sm:inline-flex">Processado</Badge>
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


  if (selectedEmpresa) {
    return (
      <div className="min-h-screen">
        <Header 
          title={selectedEmpresa.nome} 
          subtitle="Selecione uma pasta" 
          onMenuClick={onMenuClick} 
        />
        <div className="p-4 lg:p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedEmpresa(null); setEmpresaData(null); }} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          {/* Pastas da Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {Object.entries(FOLDER_CONFIG).map(([key, cfg], i) => {
              const Icon = cfg.icon;
              const count = empresaData?.arquivos?.[key]?.length || 0;
              return (
                <Card
                  key={key}
                  hover
                  className="cursor-pointer animate-fade-in group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => setSelectedFolder(key)}
                >
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${cfg.bgColor}`}>
                      <Icon className={`h-10 w-10 ${cfg.color}`} />
                    </div>
                    <p className="text-lg font-bold text-foreground">{cfg.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{count} arquivos</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen">
      <Header 
        title="Sistema" 
        subtitle="Gerenciamento de empresas e arquivos" 
        onMenuClick={onMenuClick} 
      />
      <div className="p-4 lg:p-6">
        {/* Seleção de Empresa */}
        {empresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Building2 className="mb-6 h-16 w-16 text-muted-foreground/20" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma empresa encontrada</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">As empresas serão listadas aqui assim que forem cadastradas no sistema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {empresas.map((emp, i) => (
              <Card
                key={emp.id}
                hover
                className="cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => setSelectedEmpresa(emp)}
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-base font-bold text-foreground truncate">{emp.nome}</p>
                    <p className="text-xs text-muted-foreground mb-3">{emp.cnpj}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {emp.total_arquivos || 0} arquivos processados
                    </Badge>
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
