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