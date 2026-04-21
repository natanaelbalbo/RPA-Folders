import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardPage } from "@/pages/DashboardPage";
import { SistemaPage } from "@/pages/SistemaPage";
import { ArquivosPage } from "@/pages/ArquivosPage";
import { AutomacaoPage } from "@/pages/AutomacaoPage";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-[240px] transition-all duration-300">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sistema/*" element={<SistemaPage />} />
            <Route path="/arquivos" element={<ArquivosPage />} />
            <Route path="/automacao" element={<AutomacaoPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
