import { LicenseOrigin, LicenseStatus, type Prisma } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { LICENSE_DURATION_PRESETS } from "@/lib/admin-licenses";
import { prisma } from "@/lib/prisma";
import { createManualLicenseAction, extendLicenseAction, updateLicenseStatusAction } from "./actions";

export const runtime = "nodejs";

const manualOrigins: LicenseOrigin[] = [LicenseOrigin.MANUAL_SUPPORT, LicenseOrigin.CONTINGENCY, LicenseOrigin.MIGRATION];

function enumValue<T extends string>(values: readonly T[], value?: string) {
  return value && values.includes(value as T) ? (value as T) : undefined;
}

function textInput(name: string, label: string, placeholder: string, required = false) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
      />
    </label>
  );
}

function selectInput(name: string, label: string, options: Array<{ value: string; label: string }>, defaultValue?: string) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition focus:border-cyan-300/50"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function reasonInput() {
  return (
    <input
      name="reason"
      required
      minLength={8}
      placeholder="Motivo obrigatório"
      className="h-9 min-w-48 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
    />
  );
}

function noteInput() {
  return (
    <input
      name="note"
      placeholder="Nota interna"
      className="h-9 min-w-40 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
    />
  );
}

function stepUpInput() {
  return (
    <input
      name="stepUpPassword"
      type="password"
      required
      placeholder="Senha atual para step-up"
      className="h-9 min-w-44 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-xs font-bold text-rose-100 outline-none transition placeholder:text-slate-700 focus:border-rose-300/50"
    />
  );
}

function presetSelect() {
  return (
    <select name="preset" defaultValue="72h" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-bold text-slate-200 outline-none transition focus:border-cyan-300/50">
      {Object.entries(LICENSE_DURATION_PRESETS).map(([value, preset]) => (
        <option key={value} value={value}>{preset.label}</option>
      ))}
    </select>
  );
}

function LicenseActionForms({ licenseId, status, origin }: { licenseId: string; status: LicenseStatus; origin: LicenseOrigin }) {
  return (
    <div className="grid min-w-[520px] gap-3">
      <form action={extendLicenseAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="licenseId" value={licenseId} />
        {presetSelect()}
        {reasonInput()}
        {stepUpInput()}
        {noteInput()}
        <button type="submit" className="h-9 rounded-md bg-cyan-300 px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-200">Estender</button>
      </form>

      <form action={updateLicenseStatusAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="licenseId" value={licenseId} />
        <input type="hidden" name="action" value={status === LicenseStatus.ACTIVE ? "suspend" : "reactivate"} />
        {status === LicenseStatus.ACTIVE ? (
          <input name="confirmation" required placeholder="Digite SUSPENDER" className="h-9 min-w-36 rounded-md border border-amber-300/20 bg-slate-950 px-3 text-xs font-bold text-amber-100 outline-none placeholder:text-slate-700 focus:border-amber-300/50" />
        ) : null}
        {reasonInput()}
        {stepUpInput()}
        <button type="submit" className="h-9 rounded-md border border-amber-300/20 px-3 text-xs font-black text-amber-100 transition hover:bg-amber-300/10">
          {status === LicenseStatus.ACTIVE ? "Suspender" : "Reativar"}
        </button>
      </form>

      <form action={updateLicenseStatusAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="licenseId" value={licenseId} />
        <input type="hidden" name="action" value="revoke" />
        <input name="confirmation" required placeholder="Digite REVOGAR" className="h-9 min-w-36 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-xs font-bold text-rose-100 outline-none placeholder:text-slate-700 focus:border-rose-300/50" />
        {reasonInput()}
        {stepUpInput()}
        <button type="submit" className="h-9 rounded-md border border-rose-300/20 px-3 text-xs font-black text-rose-100 transition hover:bg-rose-300/10">Revogar</button>
      </form>

      {origin !== LicenseOrigin.BILLING ? (
        <form action={updateLicenseStatusAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="licenseId" value={licenseId} />
          <input type="hidden" name="action" value="convert_regular" />
          {reasonInput()}
          {stepUpInput()}
          <button type="submit" className="h-9 rounded-md border border-cyan-300/20 px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10">Converter em regular</button>
        </form>
      ) : null}
    </div>
  );
}

export default async function AdminLicensesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; origin?: string; organizationId?: string; message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.licenses.manage");
  const params = await searchParams;
  const q = params?.q?.trim();
  const status = enumValue(Object.values(LicenseStatus), params?.status);
  const origin = enumValue(Object.values(LicenseOrigin), params?.origin);
  const organizationId = params?.organizationId?.trim();
  const now = new Date();

  const where: Prisma.LicenseWhereInput = {
    ...(status ? { status } : {}),
    ...(origin ? { origin } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(q
      ? {
          OR: [
            { id: q },
            { licenseKey: { contains: q, mode: "insensitive" } },
            { userId: q },
            { organizationId: q },
            { user: { is: { email: { contains: q, mode: "insensitive" } } } },
            { user: { is: { name: { contains: q, mode: "insensitive" } } } },
            { organization: { is: { name: { contains: q, mode: "insensitive" } } } }
          ]
        }
      : {})
  };

  const licenses = await prisma.license.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { user: true, organization: true, subscription: true }
  });

  const auditEvents = licenses.length
    ? await prisma.adminAuditEvent.findMany({
        where: { resourceType: "license", resourceId: { in: licenses.map((license) => license.id) } },
        orderBy: { createdAt: "desc" },
        take: 150,
        include: { actor: { select: { email: true, name: true } } }
      })
    : [];

  const auditByLicense = new Map<string, typeof auditEvents>();
  for (const event of auditEvents) {
    const key = event.resourceId ?? "";
    auditByLicense.set(key, [...(auditByLicense.get(key) ?? []), event]);
  }

  const active = licenses.filter((license) => license.status === LicenseStatus.ACTIVE && (!license.endsAt || license.endsAt >= now)).length;
  const expired = licenses.filter((license) => license.status === LicenseStatus.EXPIRED || Boolean(license.endsAt && license.endsAt < now)).length;
  const manual = licenses.filter((license) => manualOrigins.includes(license.origin)).length;
  const institutional = licenses.filter((license) => license.organizationId || license.origin === LicenseOrigin.INSTITUTIONAL_GRANT).length;
  const inconsistent = licenses.filter((license) => license.status === LicenseStatus.ACTIVE && Boolean(license.endsAt && license.endsAt < now)).length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Licenças"
        title="Licenças e Contingência"
        description="Gestão manual auditada para contingência operacional. Toda mutation exige permissão administrativa, motivo interno e grava AdminAuditEvent."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Ativas" value={active} hint="Status ativo e validade não expirada no filtro atual." />
        <KpiCard label="Expiradas" value={expired} hint="Status expirado ou data final no passado." />
        <KpiCard label="Manuais" value={manual} hint="manual_support, contingency ou migration." />
        <KpiCard label="Institucionais" value={institutional} hint="Vinculadas à organização ou grant institucional." />
        <KpiCard label="Inconsistências" value={inconsistent} hint="Licença ativa com expiração vencida." />
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Criar licença manual</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use somente para suporte ou contingência. A licença recebe expiração por padrão e não pode ser criada sem motivo.</p>
        </div>
        <form action={createManualLicenseAction} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {textInput("userEmail", "E-mail do usuário", "medico@hospital.com")}
          {textInput("userId", "User ID opcional", "cuid...")}
          {textInput("organizationId", "Organization ID opcional", "cuid...")}
          {selectInput("origin", "Origem", [
            { value: LicenseOrigin.MANUAL_SUPPORT, label: "manual_support" },
            { value: LicenseOrigin.CONTINGENCY, label: "contingency" },
            { value: LicenseOrigin.MIGRATION, label: "migration" },
            { value: LicenseOrigin.INSTITUTIONAL_GRANT, label: "institutional_grant" }
          ], LicenseOrigin.MANUAL_SUPPORT)}
          <label className="grid gap-1 text-xs font-bold text-slate-500">
            Expiração
            {presetSelect()}
          </label>
          {textInput("reason", "Motivo obrigatório", "Descreva a contingência", true)}
          <label className="grid gap-1 text-xs font-bold text-slate-500 md:col-span-2 xl:col-span-5">
            Nota interna
            <input name="note" placeholder="Contexto operacional para auditoria" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500 md:col-span-2 xl:col-span-5">
            Step-up
            <input name="stepUpPassword" type="password" required placeholder="Senha atual para step-up" className="h-10 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-sm font-bold text-rose-100 outline-none transition placeholder:text-slate-700 focus:border-rose-300/50" />
          </label>
          <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Criar com auditoria</button>
        </form>
      </section>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-5 md:items-end">
        {textInput("q", "Busca", "usuário, e-mail, org, chave", false)}
        {selectInput("status", "Status", Object.values(LicenseStatus).map((value) => ({ value, label: value })), status)}
        {selectInput("origin", "Origem", Object.values(LicenseOrigin).map((value) => ({ value, label: value.toLowerCase() })), origin)}
        {textInput("organizationId", "Organization ID", "cuid...", false)}
        <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Filtrar</button>
      </form>

      <DataTable
        rows={licenses}
        empty={<EmptyState title="Nenhuma licença encontrada" description="Ajuste os filtros ou crie uma licença manual auditada para contingência." />}
        columns={[
          {
            key: "identity",
            header: "Licença",
            render: (license) => (
              <div className="min-w-56">
                <p className="font-black text-white">{license.user?.email ?? license.user?.name ?? "Sem usuário"}</p>
                <p className="mt-1 text-xs text-slate-500">{license.licenseKey ?? license.id}</p>
                <p className="mt-1 text-xs text-slate-500">{license.organization?.name ?? license.organizationId ?? "Individual"}</p>
              </div>
            )
          },
          { key: "status", header: "Status", render: (license) => <StatusBadge status={license.status} /> },
          { key: "origin", header: "Origem", render: (license) => <StatusBadge status={license.origin.toLowerCase()} /> },
          {
            key: "period",
            header: "Validade",
            render: (license) => (
              <div className="min-w-40 text-sm text-slate-300">
                <p>{license.startsAt ? license.startsAt.toLocaleDateString("pt-BR") : "Sem início"}</p>
                <p className={license.endsAt && license.endsAt < now ? "font-black text-rose-200" : "text-slate-500"}>
                  {license.endsAt ? license.endsAt.toLocaleDateString("pt-BR") : "Sem expiração"}
                </p>
              </div>
            )
          },
          {
            key: "history",
            header: "Histórico",
            render: (license) => {
              const events = auditByLicense.get(license.id) ?? [];
              return (
                <div className="min-w-60">
                  {events.length === 0 ? <p className="text-xs text-slate-600">Sem eventos administrativos.</p> : null}
                  {events.slice(0, 4).map((event) => (
                    <div key={event.id} className="mb-2 border-l border-cyan-300/20 pl-3 last:mb-0">
                      <p className="text-xs font-black text-slate-200">{event.action}</p>
                      <p className="text-xs text-slate-500">{event.actor?.email ?? event.actor?.name ?? "sistema"} · {event.createdAt.toLocaleString("pt-BR")}</p>
                    </div>
                  ))}
                </div>
              );
            }
          },
          {
            key: "actions",
            header: "Ações auditadas",
            render: (license) => <LicenseActionForms licenseId={license.id} status={license.status} origin={license.origin} />
          }
        ]}
      />
    </div>
  );
}
