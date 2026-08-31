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
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}