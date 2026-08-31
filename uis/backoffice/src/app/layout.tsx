import type {
  Metadata
} from "next";

import { Suspense } from "react";

import { AuthGuard } from "@/components/auth-guard";

import "./globals.css";


export const metadata: Metadata = {

  title:
    "Brasaland Backoffice",

  description:
    (
      "Panel interno "
      + "de Brasaland"
    ),

};


export default function RootLayout({

  children,

}: Readonly<{

  children:
    React.ReactNode;

}>) {

  return (

    <html lang="es">

      <body>
        <Suspense fallback={<div className="authSplash">Cargando aplicación...</div>}>
          <AuthGuard>{children}</AuthGuard>
        </Suspense>

      </body>

    </html>

  );

}
