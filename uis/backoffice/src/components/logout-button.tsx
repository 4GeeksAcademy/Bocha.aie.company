"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { clearAccessToken } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    clearAccessToken();
    startTransition(() => {
      router.replace("/login");
    });
  }

  return (
    <button type="button" className="ghostButton" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}