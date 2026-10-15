"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Droplets,
  FileText,
  Pill,
  Syringe,
  UserCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ProductUserPanel } from "@/components/ProductUserPanel";
import { MobileMenu } from "@/components/MobileMenu";
import { Brand } from "@/components/Brand";

export type ProductNavKey =
  "prescription" | "doses" | "fluids" | "intubation" | "pcr" | "library" | "infusion";
const links = [
  { href: "/dashboard/pcr", label: "Folha PCR", key: "pcr", icon: Activity },
  { href: "/dashboard/biblioteca-medicamentos", label: "Biblioteca de medicamentos", key: "library", icon: Pill },
  { href: "/dashboard/infusao-continua", label: "Infusão contínua", key: "infusion", icon: Droplets },
  {
    href: "/dashboard/modelo-prescricao",
    label: "Modelo de prescrição",
    key: "prescription",
    icon: FileText,
  },
  {
    href: "/dashboard/doses-medicacoes",
    label: "Doses de medicações",
    detail: "Top 100",
    key: "doses",
    icon: Pill,
  },
  {
    href: "/dashboard/soroterapia",
    label: "Soroterapia",
    key: "fluids",
    icon: Droplets,
  },
  {
    href: "/dashboard/intubacao-rapida",
    label: "Sequência rápida de intubação",
    key: "intubation",
    icon: Syringe,
  },
];

export function CalculatorShell({
  active = "pcr",
  children,
  headerActions,
}: {
  active?: ProductNavKey;
  children: ReactNode;
  headerActions?: ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  useEffect(() => {
    setLoadingLabel(null);
  }, [pathname]);
  function navigation() {
    return links.map(({ href, label, key, icon: Icon, ...rest }) => (
      <Link
        key={href}
        href={href}
        aria-current={active === key ? "page" : undefined}
        onClick={() => {
          if (pathname !== href) setLoadingLabel(label);
        }}
        className="ped-nav-item"
      >
        <Icon aria-hidden="true" />
        <span>
          {label}
          {"detail" in rest && <small>{rest.detail}</small>}
        </span>
      </Link>
    ));
  }
  return (
    <div className="ped-theme ped-app">
      <a className="ped-skip no-print" href="#clinical-content">
        Ir para o conteúdo
      </a>
      <aside className="ped-sidebar no-print">
        <Brand href="/dashboard" />
        <p className="ped-nav-caption">ÁREA CLÍNICA</p>
        <nav aria-label="Módulos clínicos">{navigation()}</nav>
        <div className="ped-sidebar-bottom">
          <p>
            PED.iatron<span>Apoio ao atendimento pediátrico</span>
          </p>
          <ProductUserPanel />
        </div>
      </aside>
      <div className="ped-workspace">
        <header className="ped-topbar no-print">
          <div className="ped-mobile-brand">
            <Brand href="/dashboard" />
          </div>
          <span className="ped-desktop-context">
            Área clínica <span>/</span>{" "}
            {links.find((item) => item.key === active)?.label}
          </span>
          <div className="ped-topbar-actions">
            <div className="ped-desktop-print">{headerActions}</div>
            <Link
              href="/profile"
              className="ped-user"
              aria-label="Acessar perfil"
            >
              <UserCircle aria-hidden="true" />
              <span>
                {session?.user?.name || "Meu perfil"}
                <small>
                  {session?.user?.role === "ADMIN"
                    ? "Administrador"
                    : "Minha conta"}
                </small>
              </span>
            </Link>
            <MobileMenu>
              {navigation()}
              <div className="ped-mobile-print">{headerActions}</div>
              <ProductUserPanel mobile />
            </MobileMenu>
          </div>
        </header>
        {loadingLabel && (
          <div className="ped-navigation-status no-print" role="status">
            Carregando {loadingLabel}…
          </div>
        )}
        <main id="clinical-content" className="ped-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
