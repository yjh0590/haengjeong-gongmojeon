import type { GuidePicture as Picture } from "../data/guidebooks";

/** Small explanatory drawings: text labels remain real, accessible HTML. */
export default function GuidePicture({ picture }: { picture: Picture }) {
  return <svg viewBox="0 0 160 110" fill="none" aria-hidden="true" className="guide-step-picture">
    <rect x="4" y="4" width="152" height="102" rx="24" fill="var(--picture-bg, #edf3ff)"/>
    <circle cx="133" cy="23" r="8" fill="#fff"/><circle cx="24" cy="88" r="5" fill="#fff"/>
    <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {picture === "map" ? <><path d="M26 28l35-9 38 13 35-9v61l-35 9-38-13-35 9z" fill="#fff"/><path d="M61 19v61m38-48v61" opacity=".25"/><path d="M80 35c-12 0-18 9-18 18 0 13 18 27 18 27s18-14 18-27c0-9-6-18-18-18z" fill="#a9c7f3"/><circle cx="80" cy="53" r="6" fill="#fff"/></>
      : picture === "photo" ? <><rect x="27" y="17" width="106" height="73" rx="8" fill="#fff"/><path d="M37 70l21-23 21 17 17-13 27 27" fill="#bad9cf"/><circle cx="105" cy="35" r="9" fill="#ffe2a1"/><path d="M62 98h36M80 90v8"/><path d="M43 34h14m-7-6 7 6-7 6"/></>
      : picture === "store" ? <><path d="M37 46h86v47H37z" fill="#fff"/><path d="M31 46l10-25h78l10 25z" fill="#ffd9ad"/><path d="M32 46c0 13 19 13 19 0 0 13 19 13 19 0 0 13 20 13 20 0 0 13 19 13 19 0 0 13 20 13 20 0"/><rect x="48" y="65" width="25" height="28" rx="2" fill="#d5e5fa"/><path d="M86 65h25v15H86z" fill="#e1efdf"/></>
      : picture === "write" ? <><rect x="39" y="15" width="78" height="82" rx="9" fill="#fff"/><path d="M53 34h40M53 47h29M53 60h18" opacity=".4"/><path d="M79 81l5-18 31-31 13 13-31 31z" fill="#ffd9ad"/><path d="M108 39l13 13M79 81l18-5"/></>
      : picture === "check" ? <><rect x="43" y="18" width="74" height="80" rx="8" fill="#fff"/><rect x="62" y="12" width="36" height="15" rx="6" fill="#d5e5fa"/><path d="M56 47l5 5 8-10m8 5h25M56 70l5 5 8-10m8 5h25"/></>
      : picture === "publish" ? <><rect x="32" y="25" width="96" height="68" rx="10" fill="#fff"/><path d="M32 43h96M42 34h1m8 0h1m8 0h1"/><circle cx="80" cy="67" r="18" fill="#c5e2ce"/><path d="M71 67l6 6 13-14"/></>
      : picture === "heart" ? <><rect x="45" y="16" width="70" height="82" rx="12" fill="#fff"/><path d="M65 87h30" opacity=".3"/><path d="M80 73S54 60 54 46c0-16 20-19 26-6 6-13 26-10 26 6 0 14-26 27-26 27z" fill="#f5bbbc"/></>
      : <><circle cx="57" cy="38" r="16" fill="#ffdbb3"/><circle cx="103" cy="38" r="16" fill="#d5e5fa"/><path d="M28 92V79c0-27 58-27 58 0v13z" fill="#ffdbb3"/><path d="M77 92V79c0-27 55-27 55 0v13z" fill="#d5e5fa"/><path d="M70 25l10-9 10 9" opacity=".4"/></>}
    </g>
  </svg>;
}
