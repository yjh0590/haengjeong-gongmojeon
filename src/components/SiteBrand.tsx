import { brandSubtitles, type BrandRole } from "../config/brand";

export default function SiteBrand({ role }: { role: BrandRole }) {
  return <span className={`site-brand site-brand-${role}`}>
    <span className="site-brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M8 22 24 10M8 10l16 12" stroke="currentColor" strokeWidth="2.5"/><circle cx="8" cy="10" r="4" fill="currentColor"/><circle cx="24" cy="10" r="4" fill="currentColor"/><circle cx="8" cy="22" r="4" fill="currentColor"/><circle cx="24" cy="22" r="4" fill="currentColor"/></svg></span>
    <span className="site-brand-copy"><strong className="site-brand-name">맛&멋 AI Street</strong><small className="site-brand-subtitle">{brandSubtitles[role]}</small></span>
  </span>;
}
