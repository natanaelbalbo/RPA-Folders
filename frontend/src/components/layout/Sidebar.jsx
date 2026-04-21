import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Bot,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/sistema", icon: Building2, label: "Sistema" },
  { to: "/arquivos", icon: FileText, label: "Arquivos" },
  { to: "/automacao", icon: Bot, label: "Automação" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
          <Bot className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-sm font-bold text-foreground truncate">RPA Auto</h1>
            <p className="text-[10px] text-muted-foreground truncate">Painel de Controle</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Usuário logado + logout */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Info do usuário */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 animate-fade-in">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-foreground truncate">{user.nome}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Botão logout */}
        <button
          onClick={logout}
          title="Sair"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
