// Ikon SVG lokal; tidak memerlukan paket ikon atau koneksi internet.
export default function UiIcon({ name, size = 20, ...props }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    cap: <><path d="m2 9 10-5 10 5-10 5-10-5Zm4 3v5c4 3 8 3 12 0v-5M22 9v7"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 6a8 8 0 0 1 13 1L20 12M4 12l.9 5a8 8 0 0 0 13 1"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    logout: <><path d="M9 4H4v16h5M9 12h12m-4-4 4 4-4 4"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    edit: <><path d="m15 5 4 4M4 20l4-1L21 6a2.8 2.8 0 0 0-4-4L4 15l-1 6 6-1M14 21h7"/></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
    chevron: <path d="m9 5 7 7-7 7"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false" {...props}>{paths[name] ?? paths.grid}</svg>;
}
