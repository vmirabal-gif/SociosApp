import type { ReactNode } from "react";

interface PublicPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PublicPageLayout({
  title,
  subtitle,
  children,
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-lg items-center gap-3 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">9J</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Club 9 de Julio Olímpico
            </p>
            <p className="text-xs text-muted-foreground">Freyre</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
