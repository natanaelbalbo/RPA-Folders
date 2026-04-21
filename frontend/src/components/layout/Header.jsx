export function Header({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}
