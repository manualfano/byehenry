"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/eerr", label: "EERR", icon: BarChart3 },
  { href: "/config", label: "Config", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-7xl h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center">
            <span className="font-heading text-xs font-bold text-accent-gold">BH</span>
          </div>
          <div>
            <span className="font-heading font-bold text-text-primary text-sm tracking-wide">
              Bye Henry
            </span>
            <span className="hidden sm:inline text-text-secondary text-xs ml-2">
              Craft Bar
            </span>
          </div>
          {/* Separador dorado vertical */}
          <div className="w-[1px] h-6 bg-accent-gold opacity-30 mx-1 hidden sm:block" />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1" aria-label="Navegación principal">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors",
                pathname === href || pathname.startsWith(href)
                  ? "text-accent-gold bg-accent-gold/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          <div className="w-[1px] h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Cerrar sesión"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
