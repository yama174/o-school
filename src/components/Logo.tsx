/**
 * ブランドロゴ:「O」(大空町の「O」、円・軌道モチーフ)。
 */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/o-icon.png"
      alt="O-school"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
