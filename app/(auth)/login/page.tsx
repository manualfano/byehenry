"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/eerr");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Patrón de fondo industrial */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 40px, #C8A96E 40px, #C8A96E 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #C8A96E 40px, #C8A96E 41px)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface border border-border mb-6">
            {/* Logo tipográfico */}
            <span className="font-heading text-2xl font-bold text-accent-gold">BH</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-primary tracking-tight">
            Bye Henry
          </h1>
          <p className="text-text-secondary text-sm mt-1">Craft Bar — La Plata</p>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-accent-gold to-transparent mt-4 opacity-60" />
        </div>

        {/* Formulario */}
        <div className="bg-surface border border-border rounded-lg p-8 shadow-gold">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-6 text-center">
            Acceso al Dashboard
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2"
              >
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
                  placeholder="Ingresá tu usuario"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="text-sm text-negative bg-negative/10 border border-negative/30 rounded px-3 py-2"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
              aria-label="Iniciar sesión"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-text-secondary text-xs mt-6">
          Dashboard financiero — solo acceso autorizado
        </p>
      </div>
    </div>
  );
}
