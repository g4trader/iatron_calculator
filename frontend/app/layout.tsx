import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./redesign.css";
import { AuthProvider } from "@/components/AuthProvider";
import { getServerSkin } from "@/lib/skin";

export const metadata: Metadata = {
  metadataBase: new URL("https://ped.iatron.com.br"),
  title: "PED.iatron",
  description: "PED.iatron para Folha PCR pediátrica, entubação, parada cardíaca e desfibrilação"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const skin = await getServerSkin();

  return (
    <html lang="pt-BR" data-skin={skin}>
      <body data-skin={skin}>
        <Script id="gtm-init" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });`}</Script>
        <Script id="gtm-loader" src="https://www.googletagmanager.com/gtm.js?id=GTM-WDNQSW2S" strategy="afterInteractive" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
