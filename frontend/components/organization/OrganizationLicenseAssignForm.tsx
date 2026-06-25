"use client";

import { useState, useTransition } from "react";

type MemberOption = {
  userId: string;
  label: string;
};

export function OrganizationLicenseAssignForm({ organizationId, members }: { organizationId: string; members: MemberOption[] }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const response = await fetch(`/api/organizations/${organizationId}/licenses/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: String(formData.get("userId") ?? "") })
          });
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "Não foi possível atribuir licença.");
            return;
          }
          setMessage("Licença ativa atribuída.");
        });
      }}
    >
      <select className="h-11 rounded-md border border-cyan-300/15 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300/60" name="userId" required>
        <option value="">Selecione um membro</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>{member.label}</option>
        ))}
      </select>
      {error ? <p className="text-sm font-semibold text-red-200">{error}</p> : null}
      {message ? <p className="text-sm font-semibold text-emerald-200">{message}</p> : null}
      <button className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70" disabled={isPending} type="submit">
        {isPending ? "Atribuindo..." : "Atribuir licença"}
      </button>
    </form>
  );
}
