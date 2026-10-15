import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="ped-brand" aria-label="PED.iatron — início">
      <HeartPulse aria-hidden="true" />
      <span>
        PED<span className="ped-brand-dot">.</span>iatron
      </span>
    </Link>
  );
}
