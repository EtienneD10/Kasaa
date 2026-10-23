import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { PropertyMediaProvider } from "@/lib/property-media";

// Nota: Inter y Fraunces (spec §1.4) se cargan vía next/font/google en un
// entorno con acceso a internet — aquí se usa system-ui como fallback
// porque el sandbox de desarrollo no tiene salida a fonts.googleapis.com.
// Reemplazar por next/font/google al conectar con un entorno real.

export const metadata: Metadata = {
  title: "Kasaa",
  description: "Encontrá el lugar donde vas a vivir.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <PropertyMediaProvider>{children}</PropertyMediaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
