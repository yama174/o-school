import { Mascot, type MascotName } from "@/components/ui";

/**
 * マスコット「O」が吹き出しでしゃべっているように見せるコンポーネント。
 * お店の紹介文など、無機質になりがちな説明文に親しみを持たせるために使う。
 */
export function MascotSpeech({
  text,
  mascot = "stand-discover",
  size = 72,
}: {
  text: string;
  mascot?: MascotName;
  size?: number;
}) {
  return (
    <div className="flex items-end gap-2">
      <Mascot name={mascot} size={size} className="shrink-0" />
      <div className="relative flex-1 rounded-2xl rounded-bl-sm bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm">
        {text}
      </div>
    </div>
  );
}
