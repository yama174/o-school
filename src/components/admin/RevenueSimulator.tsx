"use client";

import { useMemo, useState } from "react";
import { Card, FieldLabel, inputClass } from "@/components/ui";

const USER_PRESETS = [20, 30, 50, 100, 200, 500, 1000];
const PV_PRESETS = [1, 2, 3, 5, 10];
const RATE_PRESETS = [50, 75, 100];

function yen(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export function RevenueSimulator() {
  const [users, setUsers] = useState(200);
  const [pvPerUser, setPvPerUser] = useState(3);
  const [adRate, setAdRate] = useState(75);
  const [rpm, setRpm] = useState(150);
  const [visitsPerMonth, setVisitsPerMonth] = useState(20); // 月に何日訪れるか(再訪頻度)

  const result = useMemo(() => {
    const monthlyPV = users * pvPerUser * visitsPerMonth;
    const adImpressions = monthlyPV * (adRate / 100);
    const monthlyRevenue = (adImpressions / 1000) * rpm;
    const annualRevenue = monthlyRevenue * 12;
    const revenuePerUser = users > 0 ? monthlyRevenue / users : 0;
    return { monthlyPV, adImpressions, monthlyRevenue, annualRevenue, revenuePerUser };
  }, [users, pvPerUser, adRate, rpm, visitsPerMonth]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">条件を設定</p>
        <div className="flex flex-col gap-4">
          <SliderField
            label="ユーザー数"
            value={users}
            setValue={setUsers}
            min={0}
            max={1000}
            step={10}
            presets={USER_PRESETS}
            unit="人"
          />
          <SliderField
            label="1ユーザーあたりの1回訪問PV"
            value={pvPerUser}
            setValue={setPvPerUser}
            min={1}
            max={10}
            step={1}
            presets={PV_PRESETS}
            unit="PV"
          />
          <SliderField
            label="月に何日訪れるか(再訪頻度)"
            value={visitsPerMonth}
            setValue={setVisitsPerMonth}
            min={1}
            max={30}
            step={1}
            presets={[1, 4, 10, 20, 30]}
            unit="日/月"
          />
          <SliderField
            label="広告表示率(広告が実際に表示される割合)"
            value={adRate}
            setValue={setAdRate}
            min={0}
            max={100}
            step={5}
            presets={RATE_PRESETS}
            unit="%"
          />
          <div>
            <FieldLabel>RPM(広告表示1,000回あたりの収益・円)</FieldLabel>
            <input
              type="number"
              value={rpm}
              onChange={(e) => setRpm(Number(e.target.value) || 0)}
              className={inputClass}
              min={0}
            />
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              日本の教育・学生向けコンテンツのAdSense RPMは、規模やジャンルにより大きく変動します(数十円〜数百円程度が目安とされることが多いですが、実測値ではありません)。実際の値は自サイトのAdSenseレポートで確認してください。
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold">試算結果</p>
        <dl className="flex flex-col gap-2.5 text-sm">
          <Row label="月間PV" value={`${Math.round(result.monthlyPV).toLocaleString("ja-JP")} PV`} />
          <Row label="広告表示回数(月間)" value={`${Math.round(result.adImpressions).toLocaleString("ja-JP")} 回`} />
          <Row label="推定月収" value={yen(result.monthlyRevenue)} highlight />
          <Row label="推定年収" value={yen(result.annualRevenue)} highlight />
          <Row label="1ユーザーあたり月間収益" value={yen(result.revenuePerUser)} />
        </dl>
        <p className="mt-3 rounded-lg bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-muted)]">
          同じ「ユーザー数」でも、毎日使う{users}人と月1回しか来ない{users}人では、月間PVが最大30倍近く変わります。
          「再訪頻度」を上げる工夫(今日の時間割・課題締切・行事カウントダウンなど毎日開きたくなる機能)が収益に直結します。
        </p>
      </Card>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-0">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className={highlight ? "text-lg font-black text-[var(--primary)]" : "font-bold"}>{value}</dd>
    </div>
  );
}

function SliderField({
  label,
  value,
  setValue,
  min,
  max,
  step,
  presets,
  unit,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  step: number;
  presets: number[];
  unit: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-sm font-bold">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setValue(p)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              value === p ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
            }`}
          >
            {p}
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
}
