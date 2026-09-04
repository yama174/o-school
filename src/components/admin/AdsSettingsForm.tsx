"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleAdSlotAction,
  toggleAdsGloballyAction,
  updateVisibilityModeAction,
} from "@/lib/actions/admin-settings";
import { Card } from "@/components/ui";

interface AdSlotItem {
  placement: string;
  label: string;
  enabled: boolean;
}

export function AdsSettingsForm({
  slots,
  adsGloballyEnabled,
  visibilityMode,
}: {
  slots: AdSlotItem[];
  adsGloballyEnabled: boolean;
  visibilityMode: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">サイト全体の広告表示</p>
            <p className="text-xs text-[var(--text-muted)]">OFFにすると、すべての広告枠が非表示になります。</p>
          </div>
          <Toggle
            checked={adsGloballyEnabled}
            disabled={pending}
            onChange={() =>
              startTransition(async () => {
                await toggleAdsGloballyAction();
                refresh();
              })
            }
          />
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold">広告枠ごとの表示設定</p>
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {slots.map((slot) => (
            <li key={slot.placement} className="flex items-center justify-between py-2.5">
              <span className="text-sm">{slot.label}</span>
              <Toggle
                checked={slot.enabled}
                disabled={pending}
                onChange={() =>
                  startTransition(async () => {
                    await toggleAdSlotAction(slot.placement);
                    refresh();
                  })
                }
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold">公開範囲モード</p>
        <div className="flex flex-col gap-2">
          {[
            { key: "SCHOOL_ONLY", label: "A: 学校の生徒だけが利用(招待コード必須)" },
            { key: "PUBLIC", label: "B: 誰でも利用可能" },
            { key: "HYBRID", label: "C: 基本情報は一般公開、生徒向け機能のみログイン必須(推奨・現在の実装)" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="visibilityMode"
                checked={visibilityMode === opt.key}
                disabled={pending}
                onChange={() =>
                  startTransition(async () => {
                    await updateVisibilityModeAction(opt.key);
                    refresh();
                  })
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--text-faint)]">
          ※ このモード設定は現状「記録用の設定値」です。実際の公開範囲を変更するには、READMEの「公開方式の比較」に沿って認証まわりの実装を調整してください。
        </p>
      </Card>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[var(--primary)]" : "bg-[var(--surface-muted)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
