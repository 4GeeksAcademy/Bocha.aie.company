"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import {
  buildLoginHref,
  DEFAULT_AUTHENTICATED_ROUTE,
  getAccessToken,
  isPublicRoute,
} from "@/lib/auth";

type AuthGuardProps = {
  children: ReactNode;
};

function LoadingShell({ text }: { text: string }) {
  return (
    <div className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="tracker-shell mx-auto flex w-full max-w-5xl rounded-[32px] border border-white/60 p-6">
        <div className="tracker-card flex w-full items-center justify-center rounded-[28px] px-6 py-24 text-center text-stone-600">
          {text}
        </div>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const publicRoute = isPublicRoute(pathname);
  const currentSearch = searchParams.toString();
  const token = useSyncExternalStore(
    () => () => undefined,
    getAccessToken,
    () => null
  );
  const authenticated = Boolean(token);

  useEffect(() => {
    if (!authenticated && !publicRoute) {
      router.replace(buildLoginHref(pathname, currentSearch ? `?${currentSearch}` : ""));
      return;
    }

    if (authenticated && publicRoute) {
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
    }

  }, [authenticated, currentSearch, pathname, publicRoute, router]);

  if (token === null && !publicRoute) {
    return <LoadingShell text="Verificando sesión..." />;
  }

  if (publicRoute) {
    return <>{children}</>;
  }

  if (!authenticated) {
    return <LoadingShell text="Redirigiendo a login..." />;
  }

  return (
    <>
      <header className="px-4 pt-4 md:px-8 md:pt-6">
        <div className="tracker-shell mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[32px] border border-white/60 px-5 py-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
              Brasaland Operations
            </p>
            <Link href="/" className="mt-2 block text-lg font-semibold text-stone-950">
              Centro de incidencias
            </Link>
          </div>

          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-stone-700">
            <Link href="/">Incidencias</Link>
            <Link href="/account/profile">Mi perfil</Link>
            <Link href="/account/change-password">Cambiar contraseña</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      {children}
    </>
  );
}