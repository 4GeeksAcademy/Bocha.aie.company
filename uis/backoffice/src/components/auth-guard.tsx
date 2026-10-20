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

const subscribeToToken = () => () => undefined;

// `undefined` = sesión aún no leída (SSR e hidratación); `null` = sin sesión.
const getServerToken = (): string | null | undefined => undefined;

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const publicRoute = isPublicRoute(pathname);
  const currentSearch = searchParams.toString();
  const token = useSyncExternalStore(subscribeToToken, getAccessToken, getServerToken);
  const sessionResolved = token !== undefined;
  const authenticated = Boolean(token);

  useEffect(() => {
    // El commit de hidratación usa el snapshot del servidor: redirigir aquí
    // mandaría a /login a usuarios con sesión válida.
    if (!sessionResolved) {
      return;
    }

    if (!authenticated && !publicRoute) {
      router.replace(buildLoginHref(pathname, currentSearch ? `?${currentSearch}` : ""));
      return;
    }

    if (authenticated && publicRoute) {
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
    }

  }, [authenticated, currentSearch, pathname, publicRoute, router, sessionResolved]);

  if (!sessionResolved && !publicRoute) {
    return <div className="authSplash">Verificando sesión...</div>;
  }

  if (publicRoute) {
    return <>{children}</>;
  }

  if (!authenticated) {
    return <div className="authSplash">Redirigiendo a login...</div>;
  }

  return (
    <>
      <nav className="navbar">
        <div className="navContent">
          <Link href="/" className="logo">
            BRASALAND
          </Link>

          <div className="navLinks navCluster">
            <Link href="/">Inicio</Link>
            <Link href="/incidents">Incidencias</Link>
            <Link href="/suppliers">Proveedores</Link>
            <Link href="/inventory/products">Inventario</Link>
            <Link href="/inventory/orders">Movimientos</Link>
            <Link href="/account/profile">Mi perfil</Link>
            <Link href="/account/change-password">Cambiar contraseña</Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {children}
    </>
  );
}