import React from 'react';

interface IconProps {
  name: string;
  size?: number;
}

export default function Icon({ name, size = 20 }: IconProps) {
  const s = size;
  const c = "currentColor";
  const sw = 2;
  const r = { fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  const icons: Record<string, React.ReactNode> = {
    shield: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>,
    shirt: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>,
    droplet: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>,
    smartphone: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
    camera: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    umbrella: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></svg>,
    mountain: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>,
    briefcase: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    history: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    trash: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
    plus: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
    minus: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M5 12h14"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
    chevronDown: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m6 9 6 6 6-6"/></svg>,
    chevronUp: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m18 15-6-6-6 6"/></svg>,
    sparkles: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    download: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
    undo: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
    paw: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><circle cx="11" cy="9" r="3"/><circle cx="17" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="11" r="2"/><circle cx="3" cy="11" r="2"/><path d="m10 14 1 3 1-3"/></svg>,
  };
  return icons[name] || null;
}
