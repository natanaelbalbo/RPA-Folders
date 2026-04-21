import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Bot,
  FileText,
  LogOut,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/sistema", icon: Building2, label: "Sistema" },
  { to: "/arquivos", icon: FileText, label: "Arquivos" },
  { to: "/automacao", icon: Bot, label: "Automação" },
];

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  return (
    <>
      {/* Overlay escuro no mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out",
          // Mobile: fora da tela por padrão, entra quando open=true
          open ? "translate-x-0" : "-translate-x-full",
          // Desktop: sempre visível
          "lg:translate-x-0"
        )}
      >
        {/* Logo + fechar (mobile) */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">RPA Auto</h1>
              <p className="text-[10px] text-muted-foreground">Painel de Controle</p>
            </div>
          </div>
          {/* Botão fechar só no mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
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
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuário + Logout */}
        <div className="border-t border-border p-3 space-y-2">
          {user && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-foreground truncate">{user.nome}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
