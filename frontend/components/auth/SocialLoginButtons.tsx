"use client";

import { signIn } from "next-auth/react";
import { Facebook } from "lucide-react";

type SocialLoginButtonsProps = {
  callbackUrl?: string;
  providers: {
    google: boolean;
    facebook: boolean;
  };
};

export function SocialLoginButtons({ callbackUrl = "/dashboard", providers }: SocialLoginButtonsProps) {
  if (!providers.google && !providers.facebook) {
    return (
      <div className="mt-8 rounded-md border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-sm font-semibold text-cyan-100">
        Login social será habilitado em breve
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-3">
      {providers.google ? (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="h-12 rounded-md bg-white text-sm font-black text-slate-950"
        >
          Continuar com Google
        </button>
      ) : null}
      {providers.facebook ? (
        <button
          type="button"
          onClick={() => signIn("facebook", { callbackUrl })}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-cyan-300/15 bg-slate-900 text-sm font-bold text-white"
        >
          <Facebook className="h-4 w-4" aria-hidden="true" /> Continuar com Meta
        </button>
      ) : null}
    </div>
  );
}
