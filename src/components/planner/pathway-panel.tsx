import type { ReactNode } from 'react';

export function PathwayPanel({ title, label, collapsible = true, children }: {
  title: string;
  label: string;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const style = 'm-4 rounded-xl border border-blue-200 bg-white p-5 text-sm text-slate-700';
  const heading = <h2 className="inline text-xl font-bold text-blue-900">{title}</h2>;
  if (!collapsible) return <section aria-label={label} className={`${style} space-y-4`}>{heading}{children}</section>;
  return <details open className={style} aria-label={label}>
    <summary className="cursor-pointer rounded text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">{heading}</summary>
    <div className="mt-4 space-y-4">{children}</div>
  </details>;
}
