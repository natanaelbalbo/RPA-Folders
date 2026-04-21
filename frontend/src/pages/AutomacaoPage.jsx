import { useState, useEffect } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Globe,
  FileSearch,
  ArrowRight,
  Database,
  ExternalLink,
  Bot,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { processarDrive } from "@/api/apiService";

const AUTOMATION_STEPS = [
  { id: 1, label: "Google Drive API", icon: Globe, description: "Conecta e lista arquivos na pasta configurada." },
  { id: 2, label: "Motor de Identificação", icon: FileSearch, description: "Analisa PDF, XML e OFX para identificar empresa e tipo." },
  { id: 3, label: "Padronização", icon: ArrowRight, description: "Renomeia os arquivos seguindo o padrão DATA_EMPRESA_TIPO." },
  { id: 4, label: "Automação Playwright", icon: ShieldCheck, description: "Faz login e upload automático no sistema web." },
  { id: 5, label: "Banco de Dados", icon: Database, description: "Registra logs e atualiza o status final de cada arquivo." },
];

export function AutomacaoPage({ onMenuClick }) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const startAutomation = async () => {
    setIsRunning(true);
    setResults(null);
    setError(null);
    setCurrentStep(1);

    try {
      // Simulando progresso visual dos steps
      for (let i = 2; i <= 5; i++) {
        await new Promise(r => setTimeout(r, 1000));
        setCurrentStep(i);
      }

      const data = await processarDrive();
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Erro inesperado ao executar a automação.");
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Automação" 
        subtitle="Execução e logs do robô RPA" 
        onMenuClick={onMenuClick} 
      />
      
      <div className="p-4 lg:p-6 space-y-6">
        {/* Controle e Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg lg:text-xl font-bold">Fluxo do Processamento</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Visão geral das etapas executadas pelo robô</p>
              </div>
              <Button
                size="lg"
                disabled={isRunning}
                onClick={startAutomation}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 cursor-pointer w-full sm:w-auto"
              >
                {isRunning ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
                {isRunning ? "Executando..." : "Iniciar Robô"}
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative space-y-8">
                {/* Linha vertical conectando os steps */}
                <div className="absolute left-6 top-0 h-full w-0.5 bg-border lg:left-8" />
                
                {AUTOMATION_STEPS.map((step, idx) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id || (results && !isRunning);
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="relative flex items-start gap-4 lg:gap-8 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className={cn(
                        "z-10 flex h-12 w-12 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-500 shadow-sm",
                        isActive ? "bg-primary border-primary scale-110 shadow-primary/40" : 
                        isCompleted ? "bg-success/10 border-success shadow-success/20" : "bg-card border-border"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 lg:h-8 lg:w-8 text-success" />
                        ) : (
                          <Icon className={cn("h-6 w-6 lg:h-8 lg:w-8", isActive ? "text-white" : "text-muted-foreground")} />
                        )}
                      </div>
                      <div className="pt-2">
                        <h4 className={cn("text-sm lg:text-base font-bold", isActive ? "text-primary" : "text-foreground")}>
                          {step.label}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Status Card */}
            <Card className="bg-gradient-to-br from-card to-muted/30">
              <CardHeader>
                <CardTitle className="text-base font-bold">Status da Operação</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                {isRunning ? (
                  <>
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground animate-pulse">Robô em Operação</p>
                    <p className="text-xs text-muted-foreground mt-2">Aguardando resposta da API...</p>
                  </>
                ) : results ? (
                  <>
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 shadow-lg shadow-success/10">
                      <CheckCircle2 className="h-10 w-10 text-success" />
                    </div>
                    <p className="text-sm font-bold text-success">Execução Concluída</p>
                    <p className="text-[10px] text-muted-foreground mt-2 px-4 italic">
                      {results.resultados?.length} arquivos processados com sucesso.
                    </p>
                    <Button variant="outline" size="sm" className="mt-6 w-full" onClick={() => setResults(null)}>
                      Limpar Logs
                    </Button>
                  </>
                ) : error ? (
                  <>
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 shadow-lg shadow-destructive/10">
                      <XCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <p className="text-sm font-bold text-destructive">Falha na Automação</p>
                    <p className="text-[10px] text-destructive/80 mt-2 px-4 line-clamp-3">{error}</p>
                    <Button variant="outline" size="sm" className="mt-6 w-full" onClick={startAutomation}>
                      <RotateCcw className="h-3 w-3" />
                      Tentar Novamente
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 border border-border/50">
                      <Bot className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Aguardando Comando</p>
                    <p className="text-[10px] text-muted-foreground mt-2 px-4">Inicie a automação para processar os arquivos do Drive.</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Info / Configs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Drive Folder:</span>
                  <Badge variant="outline" className="text-[9px] font-mono">...{String(results?.folder_id || "default").slice(-8)}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Login Destino:</span>
                  <Badge variant="outline" className="text-[9px]">Headless Playwright</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span className="font-medium text-foreground">30.000ms</span>
                </div>
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
