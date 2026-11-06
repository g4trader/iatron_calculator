'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition, type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/** Keep the current workspace usable while the authorized destination loads. */
export default function NavigationLink({ href, children, onNavigate, onMouseEnter, onFocus, ...props }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const internal = href.startsWith('/mentory');
  const prepare = () => { if (internal) router.prefetch(href); };
  return <><Link {...props} href={href} aria-busy={pending || undefined}
    onMouseEnter={event => { onMouseEnter?.(event); prepare(); }}
    onFocus={event => { onFocus?.(event); prepare(); }}
    onNavigate={event => {
      onNavigate?.(event);
      if (!internal || props.download) return;
      event.preventDefault();
      if (pending) return;
      startTransition(() => {
        if (props.replace) router.replace(href, { scroll: props.scroll });
        else router.push(href, { scroll: props.scroll });
      });
    }}>{children}</Link>{pending && <span className="mentor-navigation-status" role="status">Abrindo página…</span>}</>;
}
