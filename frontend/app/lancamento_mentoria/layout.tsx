import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ped Expert Mentory | Lançamento",
  description: "Conheça a mentoria em urgência pediátrica e participe do lançamento.",
  icons: { icon: "/images/mentory-favicon.png", shortcut: "/images/mentory-favicon.png", apple: "/images/mentory-favicon.png" },
};

export default function LancamentoMentoriaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
