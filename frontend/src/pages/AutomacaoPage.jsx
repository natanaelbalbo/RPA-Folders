import { useState } from "react";
import {
  Bot,
  Play,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  HardDrive,
  Monitor,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { iniciarProcessamento } from "@/api/apiService";

const STEPS = [
  { id: 1, label: "Conectar ao Google Drive", icon: Globe },
  { id: 2, label: "Baixar arquivos", icon: HardDrive },
  { id: 3, label: "Identificar e renomear", icon: Bot },
  { id: 4, label: "Login no sistema destino", icon: Monitor },
  { id: 5, label: "Upload dos arquivos", icon: Zap },
];

export function AutomacaoPage() {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    setResults(null);
    setError(null);

    // Simula progressão de steps enquanto processa
    for (let i = 1; i <= STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const data = await iniciarProcessamento();
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setRunning(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Automação" subtitle="Controle do robô de processamento" />
      <div className="p-6 space-y-6">
        {/* Controles */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/25">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Robô RPA</h3>
                <p className="text-sm text-muted-foreground">
                  Processamento automático de documentos do Google Drive
                </p>
              </div>
            </div>

            <Button
              onClick={handleRun}
              loading={running}
              disabled={running}
              size="lg"
              className="min-w-[200px]"
            >
              <Play className="h-5 w-5" />
              {running ? "Executando..." : "Iniciar Processamento"}
            </Button>
          </div>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Execução</CardTitle>
            <CardDescription>Etapas do processamento automático</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                let state = "pending";
                if (running && currentStep === step.id) state = "running";
                else if (running && currentStep > step.id) state = "done";
                else if (!running && results) state = "done";

                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-4 animate-slide-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 ${
                        state === "running"
                          ? "bg-primary/20 animate-pulse-glow"
                          : state === "done"
                          ? "bg-success/20"
                          : "bg-muted"
                      }`}
                    >
                      {state === "running" ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : state === "done" ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          state === "running"
                            ? "text-primary"
                            : state === "done"
                            ? "text-success"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>

                    {state === "running" && (
                      <Badge variant="warning">Em execução</Badge>
                    )}
                    {state === "done" && <Badge variant="success">Concluído</Badge>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Erro na Execução</p>
                <p className="mt-1 text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {results && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                Processamento Concluído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.resultados?.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <span className="text-sm text-foreground">{r.arquivo}</span>
                    <Badge variant={r.status === "sucesso" ? "success" : "error"}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
