import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SistemaPage } from "@/pages/SistemaPage";
import { ArquivosPage } from "@/pages/ArquivosPage";
import { AutomacaoPage } from "@/pages/AutomacaoPage";

function AppLayout() {
  const { user } = useAuth();

  // Se não estiver logado, mostra a página de login
  if (!user) {
    return <LoginPage />;
  }

  // Logado: exibe o layout completo com sidebar
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: "240px" }}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sistema/*" element={<SistemaPage />} />
          <Route path="/arquivos" element={<ArquivosPage />} />
          <Route path="/automacao" element={<AutomacaoPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
