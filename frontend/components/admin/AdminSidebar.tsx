"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { adminNavigationGroups } from "@/components/admin/adminNavigation";
import type { AdminPermission } from "@/lib/admin-permissions";

export function AdminSidebar({ permissions }: { permissions: AdminPermission[] }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
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

  return (
    <aside className={`no-print border-b border-cyan-300/10 bg-slate-950/90 transition-[width] duration-200 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r ${expanded ? "lg:w-[292px]" : "lg:w-[76px]"}`}>
      <div className={`flex h-16 items-center gap-3 px-4 ${expanded ? "justify-between" : "justify-center"}`}>
        <Link href="/admin" onClick={() => setExpanded(true)} className="flex min-w-0 items-center gap-3">
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

      <nav className="grid gap-2 px-2 pb-4 lg:pb-0">
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
                      onClick={() => setExpanded(true)}
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
    </aside>
  );
}
