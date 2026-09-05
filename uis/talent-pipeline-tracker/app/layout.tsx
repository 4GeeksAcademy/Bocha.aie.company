import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";

import { AuthGuard } from "@/components/auth-guard";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brasaland Centro de incidencias",
  description: "Gestor centralizado de incidencias operativas de Brasaland.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <div className="tracker-grid min-h-screen px-4 py-6 md:px-8 md:py-8">
              <div className="tracker-shell mx-auto flex w-full max-w-5xl rounded-[32px] border border-white/60 p-6">
                <div className="tracker-card flex w-full items-center justify-center rounded-[28px] px-6 py-24 text-center text-stone-600">
                  Cargando aplicación...
                </div>
              </div>
            </div>
          }
        >
          <AuthGuard>{children}</AuthGuard>
        </Suspense>
      </body>
    </html>
  );
}
