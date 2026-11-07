import type { Metadata } from "next";

const url = "https://ped.iatron.com.br/lancamento_mentoria";
const title = "Ped Expert Mentory: mentoria online semanal em pediatria";
const description = "Conheça a Ped Expert Mentory, mentoria online semanal com o Dr. Aristóteles Pires, análise de casos reais e conteúdo para a prática pediátrica.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "pt_BR", siteName: "Ped Expert Mentory", title, description, url, images: [{ url: "/images/dr-aristoteles-pires.png", alt: "Dr. Aristóteles Pires, mentor da Ped Expert Mentory" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/images/dr-aristoteles-pires.png"] },
  icons: { icon: "/images/mentory-favicon.png", shortcut: "/images/mentory-favicon.png", apple: "/images/mentory-favicon.png" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://ped.iatron.com.br/#mentory-organization", name: "Ped Expert Mentory", url: "https://ped.iatron.com.br/ped-expert-mentory", logo: "https://ped.iatron.com.br/images/mentory-logo-oficial.png", sameAs: ["https://www.instagram.com/dr.aristotelespires/"] },
    { "@type": "WebPage", "@id": url + "#webpage", url, name: title, description, inLanguage: "pt-BR", isPartOf: { "@id": "https://ped.iatron.com.br/#mentory-website" }, about: { "@id": "https://ped.iatron.com.br/#mentory-organization" } },
    { "@type": "EducationalOccupationalProgram", name: "Ped Expert Mentory", description: "Mentoria online semanal em pediatria com discussão educacional de casos clínicos e conteúdos de apoio.", url, educationalProgramMode: "online", provider: { "@id": "https://ped.iatron.com.br/#mentory-organization" } },
  ],
};

export default function LancamentoMentoriaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />{children}</>;
}
