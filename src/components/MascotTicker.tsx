import { Mascot, type MascotName } from "@/components/ui";

const FACE_POOL: MascotName[] = [
  "face-smile",
  "face-smile-more",
  "face-grin",
  "face-surprised",
  "face-wink",
  "face-side-eye",
  "face-flustered",
  "face-side",
];

/** サーバーコンポーネントの表示ごとに変化して良いだけの軽いランダム選出。 */
function pickFaces(count: number): MascotName[] {
  const picks: MascotName[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(FACE_POOL[Math.floor(Math.random() * FACE_POOL.length)]);
  }
  return picks;
}

/**
 * トップページ用: カード上部に表情差分を薄く並べたループスクロールの帯を敷き、
 * その下でマスコットが一言しゃべっているように見せるバナー。
 */
export function MascotTicker({ message, pose = "stand-normal" }: { message: string; pose?: MascotName }) {
  const faces = pickFaces(12);
  // 継ぎ目なくループさせるため、同じ並びを2回繰り返し、ちょうど半分だけ動かす
  const strip = [...faces, ...faces];

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="overflow-hidden border-b border-[var(--border)] bg-[var(--surface-muted)] py-2 opacity-60">
        <div className="flex w-max shrink-0 animate-mascot-marquee items-center gap-7">
          {strip.map((face, i) => (
            <Mascot key={i} name={face} size={30} className="shrink-0" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <Mascot name={pose} size={60} className="shrink-0" />
        <div className="flex-1 rounded-2xl rounded-bl-sm bg-[var(--primary-soft)] px-3.5 py-2.5 text-sm">
          {message}
        </div>
      </div>
    </div>
  );
}
