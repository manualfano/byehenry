"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ArrowLeftRight, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/eerr",   label: "EERR",           icon: BarChart3,       desc: "Estado de Resultados" },
  { href: "/cc",     label: "Cta. Corriente", icon: ArrowLeftRight,  desc: "Intergrupo" },
  { href: "/config", label: "Config",          icon: Settings,        desc: "Configuración" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="h-9 w-9 rounded-lg bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center flex-shrink-0">
          <span className="font-heading text-sm font-bold text-accent-gold">BH</span>
        </div>
        <div className="min-w-0">
          <p className="font-heading font-bold text-text-primary text-sm leading-tight">Bye Henry</p>
          <p className="text-text-tertiary text-xs leading-tight">Craft Bar</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Navegación principal">
        {navLinks.map(({ href, label, icon: Icon, desc }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                active
                  ? "bg-accent-gold/10 text-accent-gold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", active ? "text-accent-gold" : "text-text-tertiary group-hover:text-text-secondary")} />
              <div className="min-w-0">
                <p className="font-medium leading-none">{label}</p>
                <p className={cn("text-xs mt-0.5 leading-none truncate", active ? "text-accent-gold/70" : "text-text-tertiary")}>{desc}</p>
              </div>
              {active && <div className="ml-auto w-1 h-4 rounded-full bg-accent-gold" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all group"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 flex-shrink-0 text-text-tertiary group-hover:text-text-secondary transition-colors" />
          <span className="font-medium">Salir</span>
        </button>
      </div>
    </aside>
  );
}
