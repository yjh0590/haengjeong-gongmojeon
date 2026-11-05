import { brandSubtitles, type BrandRole } from "../config/brand";

export default function SiteBrand({ role }: { role: BrandRole }) {
  return <span className={`site-brand site-brand-${role}`}>
    <span className="site-brand-mark" aria-hidden="true"><img src="/brand/characters/together-avatar-v3.webp" alt="" width="42" height="42" decoding="async" /></span>
    <span className="site-brand-copy"><strong className="site-brand-name">맛&멋 AI Street</strong><small className="site-brand-subtitle">{brandSubtitles[role]}</small></span>
  </span>;
}
