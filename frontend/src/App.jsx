import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SistemaPage } from "@/pages/SistemaPage";
import { ArquivosPage } from "@/pages/ArquivosPage";
import { AutomacaoPage } from "@/pages/AutomacaoPage";

function AppLayout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Fecha a sidebar mobile ao mudar de rota
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-background relative">
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main
        className="flex-1 transition-all duration-300 w-full lg:ml-[240px]"
      >
        <Routes>
          <Route path="/" element={<DashboardPage onMenuClick={() => setIsSidebarOpen(true)} />} />
          <Route path="/sistema/*" element={<SistemaPage onMenuClick={() => setIsSidebarOpen(true)} />} />
          <Route path="/arquivos" element={<ArquivosPage onMenuClick={() => setIsSidebarOpen(true)} />} />
          <Route path="/automacao" element={<AutomacaoPage onMenuClick={() => setIsSidebarOpen(true)} />} />
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
