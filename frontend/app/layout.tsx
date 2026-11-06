import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { getServerSkin } from "@/lib/skin";

export const metadata: Metadata = {
  title: "Ped Expert Mentory",
  description: "Plataforma Ped Expert Mentory de formação e recursos educacionais em urgência pediátrica."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const skin = await getServerSkin();

  return (
    <html lang="pt-BR" data-skin={skin}>
      <body data-skin={skin}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
