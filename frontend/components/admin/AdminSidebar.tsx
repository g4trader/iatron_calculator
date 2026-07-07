"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminNavigationGroups } from "@/components/admin/adminNavigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { AdminPermission } from "@/lib/admin-permissions";

export function AdminSidebar({ permissions, userEmail, userName }: { permissions: AdminPermission[]; userEmail: string | null; userName: string | null }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    executive: true,
    administration: true,
    operations: true,
    governance: false
  });

  const visibleGroups = useMemo(() => {
    return adminNavigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => permissions.includes(item.permission))
      }))
      .filter((group) => group.items.length > 0);
  }, [permissions]);
  const identity = userEmail ?? userName ?? "admin";

  useEffect(() => {
    setLoadingLabel(null);
  }, [pathname]);

  return (
    <aside className={`no-print border-b border-cyan-300/10 bg-slate-950/90 transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r ${expanded ? "lg:w-[292px]" : "lg:w-[76px]"}`}>
      {loadingLabel ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-cyan-300/20 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
              <div>
                <p className="text-sm font-black text-white">Carregando módulo</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{loadingLabel}</p>
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 animate-[pulse_0.8s_ease-in-out_infinite] rounded-full bg-cyan-300" />
            </div>
          </div>
        </div>
      ) : null}
      <div className={`flex h-16 items-center gap-3 px-4 ${expanded ? "justify-between" : "justify-center"}`}>
        <Link href="/admin" prefetch onClick={() => {
          setExpanded(true);
          if (pathname !== "/admin") setLoadingLabel("Cockpit administrativo");
        }} className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          {expanded ? (
            <span className="min-w-0">
              <span className="block truncate font-black text-white">iatron.PED</span>
              <span className="block truncate text-xs font-semibold text-slate-500">Admin SaaS</span>
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/10 bg-slate-900/70 text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
          aria-label={expanded ? "Recolher menu administrativo" : "Expandir menu administrativo"}
        >
          {expanded ? <PanelLeftClose className="h-4 w-4" aria-hidden="true" /> : <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      <nav className="grid gap-2 px-2 pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-0">
        {visibleGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          return (
            <section key={group.id} className="grid gap-1">
              {expanded ? (
                <button
                  type="button"
                  onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !isOpen }))}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:bg-slate-900/70 hover:text-slate-300"
                >
                  {group.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "" : "-rotate-90"}`} aria-hidden="true" />
                </button>
              ) : (
                <div className="mx-auto my-1 h-px w-8 bg-cyan-300/10" aria-hidden="true" />
              )}

              <div className={`${expanded && !isOpen ? "hidden" : "grid"} gap-1`}>
                {group.items.map(({ href, label, description, Icon }) => {
                  const selected = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch
                      onClick={() => {
                        setExpanded(true);
                        if (!selected) setLoadingLabel(label);
                      }}
                      title={expanded ? undefined : label}
                      className={`group flex items-center rounded-lg border px-3 py-3 transition ${
                        expanded ? "gap-3" : "justify-center"
                      } ${
                        selected
                          ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                          : "border-transparent text-slate-400 hover:border-cyan-300/15 hover:bg-cyan-300/8 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-cyan-100" : "text-cyan-200"}`} aria-hidden="true" />
                      {expanded ? (
                        <span className="min-w-0">
                          <span className="block truncate font-bold">{label}</span>
                          <span className="mt-0.5 block truncate text-xs leading-5 text-slate-500 group-hover:text-slate-400">{description}</span>
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="hidden border-t border-cyan-300/10 p-2 lg:block">
        <div className={`rounded-xl border border-cyan-300/10 bg-slate-900/55 p-3 ${expanded ? "" : "flex justify-center"}`}>
          <div className={`flex min-w-0 items-center ${expanded ? "gap-3" : "justify-center"}`}>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-300/15 bg-slate-950 text-cyan-100">
              <UserCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            {expanded ? (
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-slate-100">{identity}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Administrador</p>
              </div>
            ) : null}
          </div>
          {expanded ? (
            <div className="mt-3">
              <LogoutButton />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
