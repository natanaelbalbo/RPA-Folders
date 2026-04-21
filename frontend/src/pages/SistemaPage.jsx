import { useState, useEffect } from "react";
import {
  LogIn,
  FolderOpen,
  Upload,
  FileText,
  FileCode,
  FileSpreadsheet,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { formatDate } from "@/lib/utils";
import { login as apiLogin, getEmpresa, uploadArquivo, getEmpresas } from "@/api/apiService";

const FOLDER_CONFIG = {
  xml: { label: "XML (NF-e)", icon: FileCode, color: "text-primary", bgColor: "bg-primary/10" },
  nf: { label: "Notas Fiscais", icon: FileText, color: "text-warning", bgColor: "bg-warning/10" },
  extratos: { label: "Extratos", icon: FileSpreadsheet, color: "text-success", bgColor: "bg-success/10" },
};

export function SistemaPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [empresaData, setEmpresaData] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      getEmpresas()
        .then(setEmpresas)
        .catch(() => setEmpresas([]));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedEmpresa) {
      getEmpresa(selectedEmpresa.id)
        .then(setEmpresaData)
        .catch(() => setEmpresaData(null));
    }
  }, [selectedEmpresa]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      await apiLogin(usuario, senha);
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError(
        err.response?.data?.detail || "Falha no login. Verifique suas credenciais."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmpresa || !selectedFolder) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const tipoMap = { xml: "XML", nf: "NF", extratos: "EXTRATO" };
      await uploadArquivo(selectedEmpresa.id, tipoMap[selectedFolder], file);
      setUploadMsg({ type: "success", text: `"${file.name}" enviado com sucesso!` });
      // Recarrega dados da empresa
      const updated = await getEmpresa(selectedEmpresa.id);
      setEmpresaData(updated);
    } catch (err) {
      setUploadMsg({ type: "error", text: `Erro ao enviar: ${err.message}` });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ─── TELA DE LOGIN ─── 
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Header title="Sistema" subtitle="Acesso ao sistema destino" />
        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
          <Card className="w-full max-w-md animate-fade-in">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/25">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Acessar Sistema</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Entre com suas credenciais para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                id="usuario"
                name="usuario"
                label="Usuário"
                placeholder="admin"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                error={loginError ? " " : undefined}
              />
              <Input
                id="senha"
                name="senha"
                label="Senha"
                type="password"
                placeholder="••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />

              {loginError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {loginError}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loginLoading}>
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Credenciais padrão: admin / admin123
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ─── SELEÇÃO DE EMPRESA ───
  if (!selectedEmpresa) {
    return (
      <div className="min-h-screen">
        <Header title="Sistema" subtitle="Selecione uma empresa" />
        <div className="p-6">
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{emp.nome}</p>
                    <p className="text-sm text-muted-foreground">{emp.cnpj}</p>
                    <Badge variant="outline" className="mt-1">
                      {emp.total_arquivos || 0} arquivos
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── VISUALIZAÇÃO DE PASTA ───
  if (selectedFolder && empresaData) {
    const folderCfg = FOLDER_CONFIG[selectedFolder];
    const FolderIcon = folderCfg.icon;
    const tipoKey = selectedFolder === "extratos" ? "extratos" : selectedFolder;
    const files = empresaData.arquivos?.[tipoKey] || [];

    return (
      <div className="min-h-screen">
        <Header
          title={`${selectedEmpresa.nome} / ${folderCfg.label}`}
          subtitle="Arquivos da pasta"
        />
        <div className="p-6 space-y-6">
          <Button variant="ghost" onClick={() => setSelectedFolder(null)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar às Pastas
          </Button>

          {/* Upload */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Upload className="mb-3 h-10 w-10 text-primary/50" />
              <p className="mb-2 text-sm font-medium text-foreground">
                Arraste ou selecione um arquivo
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  data-action="upload"
                />
                <Button variant="default" size="sm" loading={uploading} as="span">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivo
                </Button>
              </label>

              {uploadMsg && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                    uploadMsg.type === "success"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {uploadMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
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
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum arquivo nesta pasta
                </p>
              ) : (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30 animate-slide-in"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <FolderIcon className={`h-5 w-5 ${folderCfg.color}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {f.nome_processado || f.nome_original}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(f.processed_at || f.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={f.status === "SUCESSO" ? "success" : "error"}
                      >
                        {f.status}
                      </Badge>
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
                <div className="flex flex-col items-center py-4 text-center">
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
