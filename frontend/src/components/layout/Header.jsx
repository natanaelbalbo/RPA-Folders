import { useState } from "react";
import { Menu } from "lucide-react";

export function Header({ title, subtitle, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 lg:px-6 backdrop-blur-xl">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <div>
        <h2 className="text-lg font-semibold text-foreground truncate">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
    </header>
  );
}
