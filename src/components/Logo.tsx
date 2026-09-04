/**
 * ブランドロゴ:「O」(円・軌道)モチーフ。
 * 大空町の「O(オオゾラ)」、空・軌道・地球を連想させる円環をシンボルにしている。
 */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill="var(--primary)" />
      <circle cx="16" cy="16" r="15" fill="url(#logo-gradient)" fillOpacity="0.35" />
      <circle cx="16" cy="16" r="7.4" fill="var(--surface)" />
      {/* 軌道線(控えめな「軌道・飛行」のモチーフ) */}
      <path
        d="M4 20.5C8 23.5 22 12 28 15"
        stroke="var(--surface)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
        fill="none"
      />
      <defs>
        <linearGradient id="logo-gradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
