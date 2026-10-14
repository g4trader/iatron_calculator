import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="ped-brand" aria-label="iatron.PED — início">
      <HeartPulse aria-hidden="true" />
      <span>
        iatron<span className="ped-brand-dot">.</span>PED
      </span>
    </Link>
  );
}
