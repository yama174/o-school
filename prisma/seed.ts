/**
 * デモデータ投入スクリプト。
 * `npm run db:seed` (内部で `prisma db seed` → tsx で実行)
 *
 * 【2度目の改修で構成が大きく変わった点】
 * - 学年ごとに異なる時間割(1年A組・2年A組・3年A組・3年B組)
 * - 同じ時限に複数教科が並ぶ「選択科目」(electiveGroup)のデモ
 * - 課題は「共有課題(SHARED)」と「個人課題(PERSONAL)」に分離、投稿者は匿名表示
 * - 旧・汎用口コミ(Post)は新規シードを行わない(UI/ルートから撤去済みのレガシー機能。
 *   既存データがある場合も物理削除はしていない。詳細は schema.prisma のコメント参照)
 * - 新機能「大空町のお店」(東藻琴/女満別、店舗・写真・口コミ)を追加
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function d(y: number, m: number, day: number): Date {
  return new Date(Date.UTC(y, m - 1, day));
}

function mapUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}

async function main() {
  console.log("🌱 既存データをクリアしています...");
  // 外部キー依存の深いものから順に削除。
  // 旧・汎用口コミ(Post/PostLike/Report)は意図的にここで触らない(レガシーデータ保持のため)。
  await prisma.article.deleteMany();
  await prisma.articleCategory.deleteMany();
  await prisma.shopReport.deleteMany();
  await prisma.shopReview.deleteMany();
  await prisma.shopPhoto.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.shopCategory.deleteMany();
  await prisma.shopRegion.deleteMany();
  await prisma.assignmentCompletion.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.electiveChoice.deleteMany();
  await prisma.dailyOverrideSlot.deleteMany();
  await prisma.dailyOverride.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.event.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.adSlot.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.school.deleteMany();

  console.log("🏫 学校・学年・クラスを作成しています...");
  const school = await prisma.school.create({
    data: { name: "青葉台高等学校", code: "aobadai-h" },
  });

  const grade1 = await prisma.grade.create({ data: { name: "高校1年", order: 1, schoolId: school.id } });
  const grade2 = await prisma.grade.create({ data: { name: "高校2年", order: 2, schoolId: school.id } });
  const grade3 = await prisma.grade.create({ data: { name: "高校3年", order: 3, schoolId: school.id } });

  const class1A = await prisma.class.create({ data: { name: "1年A組", gradeId: grade1.id } });
  const class2A = await prisma.class.create({ data: { name: "2年A組", gradeId: grade2.id } });
  const class3A = await prisma.class.create({ data: { name: "3年A組", gradeId: grade3.id } });
  const class3B = await prisma.class.create({ data: { name: "3年B組", gradeId: grade3.id } });
  const allClasses = [class1A, class2A, class3A, class3B];

  await prisma.siteSetting.create({
    data: { schoolId: school.id, visibilityMode: "HYBRID", adsGloballyEnabled: true },
  });

  console.log("📚 教科を作成しています...");
  const subjectDefs = [
    { name: "現代の国語", colorHex: "#ef4444" },
    { name: "数学Ⅰ", colorHex: "#60a5fa" },
    { name: "数学A", colorHex: "#818cf8" },
    { name: "数学Ⅱ", colorHex: "#3b82f6" },
    { name: "数学Ⅲ", colorHex: "#1d4ed8" },
    { name: "英語コミュニケーションⅠ", colorHex: "#a78bfa" },
    { name: "英語コミュニケーションⅡ", colorHex: "#8b5cf6" },
    { name: "論理・表現Ⅱ", colorHex: "#ec4899" },
    { name: "体育", colorHex: "#22c55e" },
    { name: "保健", colorHex: "#4ade80" },
    { name: "情報Ⅰ", colorHex: "#06b6d4" },
    { name: "情報Ⅱ", colorHex: "#0891b2" },
    { name: "総合的な探究の時間", colorHex: "#f59e0b" },
    { name: "歴史総合", colorHex: "#c084fc" },
    { name: "日本史探究", colorHex: "#a855f7" },
    { name: "世界史探究", colorHex: "#9333ea" },
    { name: "生物基礎", colorHex: "#16a34a" },
    { name: "化学基礎", colorHex: "#14b8a6" },
    { name: "物理基礎", colorHex: "#0d9488" },
    { name: "音楽Ⅰ", colorHex: "#f472b6" },
    { name: "美術Ⅰ", colorHex: "#fb7185" },
    { name: "書道Ⅰ", colorHex: "#fda4af" },
    { name: "LHR", colorHex: "#64748b" },
  ];
  const subjects: Record<string, { id: string }> = {};
  for (const s of subjectDefs) {
    subjects[s.name] = await prisma.subject.create({
      data: { name: s.name, colorHex: s.colorHex, schoolId: school.id },
    });
  }
  const sid = (name: string) => subjects[name].id;

  console.log("🗓️ 学年別の週間時間割(テンプレート)を作成しています...");

  type SlotDef = { period: number; subject: string; elective?: string; teacher?: string };
  type WeekDef = Record<number, SlotDef[]>; // dayOfWeek(1-5) -> slots

  // 【重要】TimetableSlot(週間テンプレート)は生徒には一切表示されない。
  // 実際に生徒へ表示される時間割は、この下で作成する DailyOverride(実際の日付ごとのデータ)
  // のみが正となる(学校の時間割は毎週同じパターンではなく週によって変わるため)。
  // ここではテンプレートを「管理画面で週を作るときのたたき台」として使えるように登録しつつ、
  // 同じ内容を実際の日付にも展開してデモ用の表示データを作る。
  async function createWeek(classId: string, week: WeekDef) {
    for (const [dow, slots] of Object.entries(week)) {
      for (const slot of slots) {
        await prisma.timetableSlot.create({
          data: {
            classId,
            dayOfWeek: Number(dow),
            period: slot.period,
            subjectId: sid(slot.subject),
            electiveGroup: slot.elective ?? null,
            teacher: slot.teacher ?? null,
          },
        });
      }
    }
  }

  /**
   * テンプレート(WeekDef)を、指定した日付範囲の平日すべてに展開して
   * DailyOverride/DailyOverrideSlotとして作成する(デモ表示用の実データ)。
   * 同じ1週間分のパターンを範囲内の全週で繰り返し使うが、これはあくまで
   * デモデータ作成の都合であり、システム自体は週ごとに異なる内容を許容する
   * (この後の「特定の日だけの変更」が、実際にここで作られたデータを上書きする)。
   */
  async function materializeWeekdays(classId: string, week: WeekDef, from: Date, to: Date) {
    let cur = from;
    while (cur.getTime() <= to.getTime()) {
      const dow = cur.getUTCDay();
      const daySlots = week[dow];
      if (daySlots && daySlots.length > 0) {
        await prisma.dailyOverride.create({
          data: {
            classId,
            date: cur,
            kind: "CUSTOM",
            slots: {
              create: daySlots.map((s) => ({
                period: s.period,
                subjectId: sid(s.subject),
                electiveGroup: s.elective ?? null,
                teacher: s.teacher ?? null,
              })),
            },
          },
        });
      }
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1));
    }
  }

  // ---- 1年A組 -----------------------------------------------------------
  const week1A: WeekDef = {
    1: [
      { period: 1, subject: "現代の国語" },
      { period: 2, subject: "数学Ⅰ" },
      { period: 3, subject: "英語コミュニケーションⅠ" },
      { period: 4, subject: "体育" },
      { period: 5, subject: "歴史総合" },
      { period: 6, subject: "LHR" },
    ],
    2: [
      { period: 1, subject: "数学Ⅰ" },
      { period: 2, subject: "英語コミュニケーションⅠ" },
      { period: 3, subject: "生物基礎" },
      { period: 4, subject: "現代の国語" },
      { period: 5, subject: "情報Ⅰ" },
      { period: 6, subject: "体育" },
    ],
    3: [
      { period: 1, subject: "歴史総合" },
      { period: 2, subject: "数学Ⅰ" },
      { period: 3, subject: "英語コミュニケーションⅠ" },
      // 芸術選択(3択の選択科目デモ)
      { period: 4, subject: "音楽Ⅰ", elective: "芸術選択" },
      { period: 4, subject: "美術Ⅰ", elective: "芸術選択" },
      { period: 4, subject: "書道Ⅰ", elective: "芸術選択" },
      { period: 5, subject: "現代の国語" },
      { period: 6, subject: "総合的な探究の時間" },
    ],
    4: [
      { period: 1, subject: "数学A" },
      { period: 2, subject: "体育" },
      { period: 3, subject: "英語コミュニケーションⅠ" },
      { period: 4, subject: "生物基礎" },
      { period: 5, subject: "現代の国語" },
      { period: 6, subject: "保健" },
    ],
    5: [
      { period: 1, subject: "数学Ⅰ" },
      { period: 2, subject: "歴史総合" },
      { period: 3, subject: "情報Ⅰ" },
      { period: 4, subject: "英語コミュニケーションⅠ" },
      { period: 5, subject: "現代の国語" },
      { period: 6, subject: "LHR" },
    ],
  };

  // ---- 2年A組 -----------------------------------------------------------
  const week2A: WeekDef = {
    1: [
      { period: 1, subject: "数学Ⅱ" },
      { period: 2, subject: "論理・表現Ⅱ" },
      { period: 3, subject: "世界史探究" },
      { period: 4, subject: "化学基礎" },
      { period: 5, subject: "体育" },
      { period: 6, subject: "LHR" },
    ],
    2: [
      { period: 1, subject: "現代の国語" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "英語コミュニケーションⅡ" },
      { period: 4, subject: "化学基礎" },
      { period: 5, subject: "世界史探究" },
      { period: 6, subject: "情報Ⅱ" },
    ],
    3: [
      { period: 1, subject: "体育" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "論理・表現Ⅱ" },
      { period: 4, subject: "世界史探究" },
      { period: 5, subject: "英語コミュニケーションⅡ" },
      { period: 6, subject: "総合的な探究の時間" },
    ],
    4: [
      { period: 1, subject: "論理・表現Ⅱ" },
      { period: 2, subject: "現代の国語" },
      { period: 3, subject: "数学Ⅱ" },
      { period: 4, subject: "化学基礎" },
      { period: 5, subject: "体育" },
      { period: 6, subject: "英語コミュニケーションⅡ" },
    ],
    5: [
      { period: 1, subject: "数学Ⅱ" },
      { period: 2, subject: "現代の国語" },
      // 文理選択(2択の選択科目デモ)
      { period: 3, subject: "日本史探究", elective: "文理選択" },
      { period: 3, subject: "物理基礎", elective: "文理選択" },
      { period: 4, subject: "論理・表現Ⅱ" },
      { period: 5, subject: "世界史探究" },
      { period: 6, subject: "LHR" },
    ],
  };

  // ---- 3年A組(選択科目あり) ---------------------------------------------
  const week3A: WeekDef = {
    1: [
      { period: 1, subject: "現代の国語" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "数学Ⅲ" }, // 3年B組とはここが異なる(クラス別の教科割り当て)
      { period: 4, subject: "体育" },
      { period: 5, subject: "情報Ⅰ" },
      { period: 6, subject: "総合的な探究の時間" },
    ],
    2: [
      { period: 1, subject: "数学Ⅱ" },
      { period: 2, subject: "論理・表現Ⅱ" },
      { period: 3, subject: "日本史探究" },
      { period: 4, subject: "現代の国語" },
      { period: 5, subject: "化学基礎" },
      { period: 6, subject: "英語コミュニケーションⅡ" },
    ],
    3: [
      { period: 1, subject: "体育" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "情報Ⅰ" },
      { period: 4, subject: "日本史探究" },
      { period: 5, subject: "英語コミュニケーションⅡ" },
      { period: 6, subject: "総合的な探究の時間" },
    ],
    4: [
      { period: 1, subject: "論理・表現Ⅱ" },
      { period: 2, subject: "現代の国語" },
      { period: 3, subject: "数学Ⅱ" },
      // 文理選択(同じクラス・同じ時限に複数の候補授業があるデモ)
      { period: 4, subject: "化学基礎", elective: "文理選択" },
      { period: 4, subject: "日本史探究", elective: "文理選択" },
      { period: 5, subject: "体育" },
      { period: 6, subject: "英語コミュニケーションⅡ" },
    ],
    5: [
      { period: 1, subject: "日本史探究" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "情報Ⅰ" },
      { period: 4, subject: "現代の国語" },
      { period: 5, subject: "論理・表現Ⅱ" },
      { period: 6, subject: "LHR" },
    ],
  };

  // ---- 3年B組(選択科目なし・A組と異なる構成) -----------------------------
  const week3B: WeekDef = {
    1: [
      { period: 1, subject: "現代の国語" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "日本史探究" }, // 3年A組は「数学Ⅲ」
      { period: 4, subject: "体育" },
      { period: 5, subject: "情報Ⅰ" },
      { period: 6, subject: "総合的な探究の時間" },
    ],
    2: [
      { period: 1, subject: "数学Ⅱ" },
      { period: 2, subject: "論理・表現Ⅱ" },
      { period: 3, subject: "日本史探究" },
      { period: 4, subject: "現代の国語" },
      { period: 5, subject: "化学基礎" },
      { period: 6, subject: "英語コミュニケーションⅡ" },
    ],
    3: [
      { period: 1, subject: "体育" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "情報Ⅰ" },
      { period: 4, subject: "日本史探究" },
      { period: 5, subject: "英語コミュニケーションⅡ" },
      { period: 6, subject: "総合的な探究の時間" },
    ],
    4: [
      { period: 1, subject: "論理・表現Ⅱ" },
      { period: 2, subject: "現代の国語" },
      { period: 3, subject: "数学Ⅱ" },
      { period: 4, subject: "化学基礎" },
      { period: 5, subject: "体育" },
      { period: 6, subject: "英語コミュニケーションⅡ" },
    ],
    5: [
      { period: 1, subject: "日本史探究" },
      { period: 2, subject: "数学Ⅱ" },
      { period: 3, subject: "情報Ⅰ" },
      { period: 4, subject: "現代の国語" },
      { period: 5, subject: "論理・表現Ⅱ" },
      { period: 6, subject: "LHR" },
    ],
  };

  await createWeek(class1A.id, week1A);
  await createWeek(class2A.id, week2A);
  await createWeek(class3A.id, week3A);
  await createWeek(class3B.id, week3B);

  console.log("📅 実際の日付ごとの時間割(表示データ)を作成しています...");
  // 【重要】ここが生徒に表示される時間割データの本体。テンプレート(週間パターン)を
  // そのまま自動表示するのではなく、実際の日付ごとに DailyOverride として展開する。
  // このデモでは分かりやすさのため同じ週パターンを繰り返し使っているが、実際の運用では
  // 週ごとに異なる内容を自由に入力できる(このデータもすべて管理画面から編集可能)。
  const demoFrom = d(2026, 9, 1);
  const demoTo = d(2026, 10, 3);
  await materializeWeekdays(class1A.id, week1A, demoFrom, demoTo);
  await materializeWeekdays(class2A.id, week2A, demoFrom, demoTo);
  await materializeWeekdays(class3A.id, week3A, demoFrom, demoTo);
  await materializeWeekdays(class3B.id, week3B, demoFrom, demoTo);

  console.log("📅 日付ごとの時間割変更(特定の日だけの上書き)を作成しています...");
  // 学校行事(体育祭・文化祭)は全学年共通のため、全クラスに同じ上書きを作成する。
  async function createOverrideForAllClasses(
    date: Date,
    kind: "CUSTOM" | "NO_CLASS",
    title: string,
    note: string
  ) {
    for (const klass of allClasses) {
      await prisma.dailyOverride.deleteMany({ where: { classId: klass.id, date } });
      await prisma.dailyOverride.create({
        data: { classId: klass.id, date, kind, title, note },
      });
    }
  }

  await createOverrideForAllClasses(
    d(2026, 9, 10),
    "NO_CLASS",
    "体育祭準備",
    "全学年でグラウンド準備・応援練習・係別打ち合わせを行います。"
  );
  await createOverrideForAllClasses(
    d(2026, 9, 11),
    "NO_CLASS",
    "体育祭",
    "9:00 開会式 / 荒天時は9/14(月)に順延。"
  );
  await createOverrideForAllClasses(
    d(2026, 9, 25),
    "NO_CLASS",
    "文化祭",
    "一般公開日。9:30〜15:00。"
  );

  // 3年生だけ午前授業(進路説明会のため) — 学年により対応が異なる例
  await prisma.dailyOverride.deleteMany({ where: { classId: class3A.id, date: d(2026, 9, 9) } });
  await prisma.dailyOverride.create({
    data: {
      classId: class3A.id,
      date: d(2026, 9, 9),
      kind: "CUSTOM",
      title: "午前授業(進路説明会)",
      note: "3年生は午後に進路説明会があるため午前授業。1・2年生は通常授業です。",
      slots: {
        create: [
          { period: 1, subjectId: sid("数学Ⅲ") },
          { period: 2, subjectId: sid("数学Ⅱ") },
          { period: 3, subjectId: sid("情報Ⅰ") },
          { period: 4, subjectId: sid("現代の国語") },
        ],
      },
    },
  });
  await prisma.dailyOverride.deleteMany({ where: { classId: class3B.id, date: d(2026, 9, 9) } });
  await prisma.dailyOverride.create({
    data: {
      classId: class3B.id,
      date: d(2026, 9, 9),
      kind: "CUSTOM",
      title: "午前授業(進路説明会)",
      note: "3年生は午後に進路説明会があるため午前授業。1・2年生は通常授業です。",
      slots: {
        create: [
          { period: 1, subjectId: sid("日本史探究") },
          { period: 2, subjectId: sid("数学Ⅱ") },
          { period: 3, subjectId: sid("情報Ⅰ") },
          { period: 4, subjectId: sid("現代の国語") },
        ],
      },
    },
  });

  // 短縮授業の例(避難訓練のため。全クラス共通で4限までに短縮)
  const shortDaySlots: Record<string, { period: number; subjectId: string }[]> = {
    [class1A.id]: [
      { period: 1, subjectId: sid("現代の国語") },
      { period: 2, subjectId: sid("数学Ⅰ") },
      { period: 3, subjectId: sid("英語コミュニケーションⅠ") },
      { period: 4, subjectId: sid("体育") },
    ],
    [class2A.id]: [
      { period: 1, subjectId: sid("数学Ⅱ") },
      { period: 2, subjectId: sid("論理・表現Ⅱ") },
      { period: 3, subjectId: sid("世界史探究") },
      { period: 4, subjectId: sid("化学基礎") },
    ],
    [class3A.id]: [
      { period: 1, subjectId: sid("現代の国語") },
      { period: 2, subjectId: sid("数学Ⅱ") },
      { period: 3, subjectId: sid("数学Ⅲ") },
      { period: 4, subjectId: sid("体育") },
    ],
    [class3B.id]: [
      { period: 1, subjectId: sid("現代の国語") },
      { period: 2, subjectId: sid("数学Ⅱ") },
      { period: 3, subjectId: sid("日本史探究") },
      { period: 4, subjectId: sid("体育") },
    ],
  };
  for (const klass of allClasses) {
    await prisma.dailyOverride.deleteMany({ where: { classId: klass.id, date: d(2026, 9, 16) } });
    await prisma.dailyOverride.create({
      data: {
        classId: klass.id,
        date: d(2026, 9, 16),
        kind: "CUSTOM",
        title: "短縮授業(避難訓練)",
        note: "5限に避難訓練を実施するため、1〜4限は40分授業に短縮します。5・6限は休講です。",
        slots: { create: shortDaySlots[klass.id] },
      },
    });
  }

  // 特定の日だけの選択科目の例(3年A組・9/17・3限: 数学Ⅲ または 日本史探究)
  await prisma.dailyOverride.deleteMany({ where: { classId: class3A.id, date: d(2026, 9, 17) } });
  await prisma.dailyOverride.create({
    data: {
      classId: class3A.id,
      date: d(2026, 9, 17),
      kind: "CUSTOM",
      title: "特別時間割(模試対策)",
      note: "3限のみ、模試対策として文理選択に応じた演習を行います。",
      slots: {
        create: [
          { period: 1, subjectId: sid("現代の国語") },
          { period: 2, subjectId: sid("数学Ⅱ") },
          { period: 3, subjectId: sid("数学Ⅲ"), electiveGroup: "文理選択(演習)" },
          { period: 3, subjectId: sid("日本史探究"), electiveGroup: "文理選択(演習)" },
          { period: 4, subjectId: sid("情報Ⅰ") },
          { period: 5, subjectId: sid("体育") },
          { period: 6, subjectId: sid("英語コミュニケーションⅡ") },
        ],
      },
    },
  });

  console.log("🎉 学校行事を作成しています...");
  const events = [
    { date: d(2026, 9, 1), title: "二学期始業式", description: "体育館にて8:45開始。" },
    { date: d(2026, 9, 11), title: "体育祭", description: "荒天時は9/14に順延。" },
    { date: d(2026, 9, 25), title: "文化祭", description: "一般公開日。" },
    { date: d(2026, 10, 10), title: "中間考査(1日目)", description: "時間割は別途配布。" },
    { date: d(2026, 10, 12), title: "中間考査(最終日)", description: "" },
    { date: d(2026, 10, 20), title: "進路講演会", description: "3年生5・6限に体育館で実施。" },
    { date: d(2026, 11, 3), title: "創立記念日", description: "休校日です。" },
    { date: d(2026, 11, 17), title: "保護者面談週間(開始)", description: "1週間、午前授業になります。" },
    { date: d(2026, 12, 5), title: "期末考査(1日目)", description: "" },
    { date: d(2026, 12, 8), title: "期末考査(最終日)", description: "" },
    { date: d(2026, 12, 22), title: "終業式・大掃除", description: "午前中で下校です。" },
  ];
  for (const e of events) {
    await prisma.event.create({ data: { ...e, schoolId: school.id } });
  }

  console.log("👤 デモユーザーを作成しています...");
  const pw = async (raw: string) => bcrypt.hash(raw, 10);

  await prisma.user.create({
    data: {
      loginId: "admin",
      nickname: "管理者(先生)",
      passwordHash: await pw("adminpass123"),
      role: "ADMIN",
      classId: class3A.id,
    },
  });

  const student1 = await prisma.user.create({
    data: { loginId: "student1", nickname: "あおい", passwordHash: await pw("password123"), role: "STUDENT", classId: class3A.id },
  });
  const student2 = await prisma.user.create({
    data: { loginId: "student2", nickname: "たくみ", passwordHash: await pw("password123"), role: "STUDENT", classId: class2A.id },
  });
  const student3 = await prisma.user.create({
    data: { loginId: "student3", nickname: "ゆい", passwordHash: await pw("password123"), role: "STUDENT", classId: class1A.id },
  });
  const student4 = await prisma.user.create({
    data: { loginId: "student4", nickname: "りく", passwordHash: await pw("password123"), role: "STUDENT", classId: class3B.id },
  });

  console.log("🧭 選択科目の履修選択(デモ)を作成しています...");
  // electiveGroup(選択科目グループ名)をキーに保存する。曜日・時限は週によって変わるため
  // 識別子として使わない(設計変更点。詳細は schema.prisma の ElectiveChoice のコメント参照)。
  await prisma.electiveChoice.create({
    data: { userId: student1.id, classId: class3A.id, electiveGroup: "文理選択", subjectId: sid("化学基礎") },
  });
  await prisma.electiveChoice.create({
    data: { userId: student2.id, classId: class2A.id, electiveGroup: "文理選択", subjectId: sid("日本史探究") },
  });
  await prisma.electiveChoice.create({
    data: { userId: student3.id, classId: class1A.id, electiveGroup: "芸術選択", subjectId: sid("美術Ⅰ") },
  });

  console.log("📝 課題(共有課題・個人課題)を作成しています...");
  type AssignmentDef = {
    creator: typeof student1;
    visibility: "SHARED" | "PERSONAL";
    grade?: typeof grade1;
    klass?: typeof class1A;
    subject: string;
    title: string;
    due: Date;
  };
  const assignmentDefs: AssignmentDef[] = [
    // 3年生
    { creator: student1, visibility: "SHARED", grade: grade3, subject: "数学Ⅱ", title: "二次関数 応用問題プリント", due: d(2026, 9, 8) },
    { creator: student1, visibility: "SHARED", grade: grade3, klass: class3A, subject: "日本史探究", title: "近代史 年表まとめ(過去問付き)", due: d(2026, 9, 10) },
    { creator: student4, visibility: "SHARED", grade: grade3, klass: class3B, subject: "化学基礎", title: "実験レポート(酸とアルカリ)", due: d(2026, 9, 9) },
    { creator: student1, visibility: "SHARED", grade: grade3, subject: "情報Ⅰ", title: "レポート: 情報セキュリティ", due: d(2026, 9, 12) },
    { creator: student1, visibility: "PERSONAL", subject: "数学Ⅲ", title: "先生に個別に出された補習プリント", due: d(2026, 9, 5) },
    // 2年生
    { creator: student2, visibility: "SHARED", grade: grade2, subject: "数学Ⅱ", title: "章末問題プリント", due: d(2026, 9, 7) },
    { creator: student2, visibility: "SHARED", grade: grade2, klass: class2A, subject: "世界史探究", title: "レポート課題(産業革命について)", due: d(2026, 9, 11) },
    { creator: student2, visibility: "SHARED", grade: grade2, subject: "化学基礎", title: "実験レポート提出", due: d(2026, 9, 14) },
    { creator: student2, visibility: "PERSONAL", subject: "英語コミュニケーションⅡ", title: "個別課題: スピーチ原稿の追加提出", due: d(2026, 9, 6) },
    // 1年生
    { creator: student3, visibility: "SHARED", grade: grade1, subject: "数学Ⅰ", title: "問題集 p.10-15", due: d(2026, 9, 8) },
    { creator: student3, visibility: "SHARED", grade: grade1, klass: class1A, subject: "歴史総合", title: "近代化についてのまとめプリント", due: d(2026, 9, 11) },
    { creator: student3, visibility: "SHARED", grade: grade1, subject: "現代の国語", title: "小論文 下書き提出", due: d(2026, 9, 6) },
    { creator: student3, visibility: "PERSONAL", subject: "数学Ⅰ", title: "個人的な補習課題", due: d(2026, 9, 4) },
  ];

  const createdAssignments = [];
  for (const a of assignmentDefs) {
    const created = await prisma.assignment.create({
      data: {
        creatorId: a.creator.id,
        visibility: a.visibility,
        gradeId: a.grade?.id,
        classId: a.klass?.id,
        subjectId: sid(a.subject),
        title: a.title,
        dueDate: a.due,
      },
    });
    createdAssignments.push(created);
  }
  // 1年生の共有課題を student3 が完了済みにする(動作確認用)
  await prisma.assignmentCompletion.create({
    data: { assignmentId: createdAssignments[11].id, userId: student3.id },
  });

  console.log("✅ 出席記録を作成しています(student1分)...");
  const attendanceDefs: { date: Date; status: "ABSENT" | "LATE" | "EARLY_LEAVE" | "EXCUSED"; note?: string }[] = [
    { date: d(2026, 4, 15), status: "ABSENT", note: "発熱のため" },
    { date: d(2026, 6, 2), status: "ABSENT", note: "風邪のため" },
    { date: d(2026, 7, 8), status: "ABSENT", note: "体調不良" },
    { date: d(2026, 5, 13), status: "LATE", note: "電車遅延" },
    { date: d(2026, 7, 1), status: "LATE", note: "寝坊" },
    { date: d(2026, 6, 18), status: "EARLY_LEAVE", note: "通院のため" },
    { date: d(2026, 9, 1), status: "EARLY_LEAVE", note: "体調不良のため" },
    { date: d(2026, 7, 15), status: "EXCUSED", note: "学校行事(大会参加)のため" },
  ];
  for (const rec of attendanceDefs) {
    await prisma.attendanceRecord.create({ data: { userId: student1.id, ...rec } });
  }

  console.log("💬 お知らせを作成しています...");
  const announcementDefs = [
    { title: "体育祭の持ち物について", body: "9/11(金)体育祭当日は体操服・水筒・タオル・帽子を持参してください。荒天時は9/14(月)に順延します。" },
    { title: "文化祭 一般公開について", body: "9/25(金)は文化祭一般公開日です。在校生も所定の受付を通って入場してください。" },
    { title: "選択科目の履修登録について", body: "1年生の芸術選択・2/3年生の文理選択は「設定」ページから登録・変更できます。締切は今月末です。" },
    { title: "サイトメンテナンスのお知らせ", body: "運営メンテナンスのため、深夜帯にサイトが一時利用できなくなる場合があります。" },
  ];
  for (const a of announcementDefs) {
    await prisma.announcement.create({ data: { ...a, schoolId: school.id } });
  }

  console.log("🏪 大空町のお店データを作成しています...");
  const higashimemanbetsu = await prisma.shopRegion.create({ data: { name: "東藻琴", slug: "higashimemanbetsu", order: 1 } });
  const memanbetsu = await prisma.shopRegion.create({ data: { name: "女満別", slug: "memanbetsu", order: 2 } });

  const categoryDefs = [
    { name: "グルメ", slug: "gourmet", order: 1 },
    { name: "カフェ", slug: "cafe", order: 2 },
    { name: "スイーツ", slug: "sweets", order: 3 },
    { name: "買い物", slug: "shopping", order: 4 },
    { name: "観光", slug: "sightseeing", order: 5 },
    { name: "その他", slug: "other", order: 6 },
  ];
  const categories: Record<string, { id: string }> = {};
  for (const c of categoryDefs) {
    categories[c.slug] = await prisma.shopCategory.create({ data: c });
  }

  type ShopDef = {
    name: string;
    region: typeof higashimemanbetsu;
    category: string;
    description: string;
    address: string;
    businessHours: string;
    closedDays: string;
  };
  const shopDefs: ShopDef[] = [
    {
      name: "ひまわり食堂",
      region: higashimemanbetsu,
      category: "gourmet",
      description: "地元食材を使った定食が人気の家庭的な食堂。日替わり定食が特におすすめです。",
      address: "北海道大空町東藻琴(デモ住所)",
      businessHours: "11:00-14:30 / 17:00-20:00",
      closedDays: "水曜定休",
    },
    {
      name: "らーめん藻琴",
      region: higashimemanbetsu,
      category: "gourmet",
      description: "あっさり醤油ラーメンが看板メニュー。地元の学生にも人気。",
      address: "北海道大空町東藻琴(デモ住所)",
      businessHours: "11:00-20:00",
      closedDays: "木曜定休",
    },
    {
      name: "藻琴珈琲店",
      region: higashimemanbetsu,
      category: "cafe",
      description: "落ち着いた雰囲気の喫茶店。自家焙煎コーヒーと手作りケーキが自慢。",
      address: "北海道大空町東藻琴(デモ住所)",
      businessHours: "9:00-18:00",
      closedDays: "火曜定休",
    },
    {
      name: "牧場ソフトの店 ふわり",
      region: higashimemanbetsu,
      category: "sweets",
      description: "地元牧場のミルクを使ったソフトクリームが名物。夏は行列ができることも。",
      address: "北海道大空町東藻琴(デモ住所)",
      businessHours: "10:00-17:00(季節により変動)",
      closedDays: "不定休",
    },
    {
      name: "とうもこ物産センター",
      region: higashimemanbetsu,
      category: "shopping",
      description: "地元の野菜・乳製品・お土産品が揃う物産センター。",
      address: "北海道大空町東藻琴(デモ住所)",
      businessHours: "9:00-17:00",
      closedDays: "年末年始",
    },
    {
      name: "ひまわりの丘展望広場",
      region: higashimemanbetsu,
      category: "sightseeing",
      description: "夏には一面のひまわり畑が広がる人気の観光スポット。展望台からの眺めが良い。",
      address: "北海道大空町東藻琴(デモ住所)",
      businessHours: "見学自由(開花時期は公式情報を確認)",
      closedDays: "なし",
    },
    {
      name: "湖畔亭",
      region: memanbetsu,
      category: "gourmet",
      description: "網走湖を望む食事処。地元産の魚介を使った定食が人気。",
      address: "北海道大空町女満別(デモ住所)",
      businessHours: "11:00-15:00 / 17:00-21:00",
      closedDays: "月曜定休",
    },
    {
      name: "めまんべつ製麺所",
      region: memanbetsu,
      category: "gourmet",
      description: "自家製麺のうどん・そばが自慢の食事処。",
      address: "北海道大空町女満別(デモ住所)",
      businessHours: "11:00-19:00",
      closedDays: "水曜定休",
    },
    {
      name: "空港通りベーカリー",
      region: memanbetsu,
      category: "cafe",
      description: "焼きたてパンとコーヒーが楽しめる、空港からもアクセスしやすいベーカリーカフェ。",
      address: "北海道大空町女満別(デモ住所)",
      businessHours: "7:30-18:00",
      closedDays: "無休",
    },
    {
      name: "お好み焼き こなな",
      region: memanbetsu,
      category: "gourmet",
      description: "鉄板でじっくり焼き上げるお好み焼きともんじゃが楽しめる。",
      address: "北海道大空町女満別(デモ住所)",
      businessHours: "17:00-22:00",
      closedDays: "火曜定休",
    },
    {
      name: "女満別りんご園直売所",
      region: memanbetsu,
      category: "shopping",
      description: "季節のりんご・野菜を農園から直接購入できる直売所。",
      address: "北海道大空町女満別(デモ住所)",
      businessHours: "9:00-16:00(季節営業)",
      closedDays: "季節により異なる",
    },
    {
      name: "女満別空港展望デッキ",
      region: memanbetsu,
      category: "sightseeing",
      description: "飛行機の離着陸を間近で眺められる展望デッキ。空港利用者以外も見学可能。",
      address: "北海道大空町女満別(デモ住所)",
      businessHours: "空港の営業時間に準ずる",
      closedDays: "なし",
    },
  ];

  const shops: Record<string, { id: string }> = {};
  for (const s of shopDefs) {
    shops[s.name] = await prisma.shop.create({
      data: {
        name: s.name,
        regionId: s.region.id,
        categoryId: categories[s.category].id,
        description: s.description,
        address: s.address,
        businessHours: s.businessHours,
        closedDays: s.closedDays,
        mapUrl: mapUrl(s.name, s.address),
      },
    });
  }

  console.log("⭐ お店の口コミを作成しています...");
  const reviewDefs = [
    { shop: "ひまわり食堂", user: student1, rating: 5, comment: "日替わり定食のオムライスがおいしかった。量も多め。" },
    { shop: "ひまわり食堂", user: student3, rating: 4, comment: "家庭的な味でほっとする。学生には量がありがたい。" },
    { shop: "らーめん藻琴", user: student4, rating: 5, comment: "あっさりだけど旨味がしっかりあって好き。替え玉もできる。" },
    { shop: "藻琴珈琲店", user: student2, rating: 4, comment: "勉強するのにちょうどいい静かさ。ケーキも美味しい。" },
    { shop: "牧場ソフトの店 ふわり", user: student1, rating: 5, comment: "濃厚なのに後味さっぱり。夏は絶対食べたい。" },
    { shop: "湖畔亭", user: student2, rating: 4, comment: "湖が見える席がおすすめ。定食のボリュームも満足。" },
    { shop: "空港通りベーカリー", user: student2, rating: 5, comment: "焼きたてのクロワッサンが最高。朝早くから開いてて助かる。" },
    { shop: "お好み焼き こなな", user: student4, rating: 4, comment: "友達とわいわい食べるのに良い。生地がふわふわ。" },
  ];
  for (const r of reviewDefs) {
    await prisma.shopReview.create({
      data: {
        shopId: shops[r.shop].id,
        userId: r.user.id,
        nickname: r.user.nickname,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }

  console.log("📰 O-schoolの記事を作成しています...");
  const articleCategoryDefs = [
    { name: "大空町のお店紹介", slug: "shop-feature", order: 1 },
    { name: "勉強法", slug: "study-tips", order: 2 },
    { name: "学校生活", slug: "school-life", order: 3 },
    { name: "地域イベント", slug: "local-event", order: 4 },
    { name: "O-school開発日記", slug: "dev-blog", order: 5 },
  ];
  const articleCategories: Record<string, { id: string }> = {};
  for (const c of articleCategoryDefs) {
    articleCategories[c.slug] = await prisma.articleCategory.create({ data: c });
  }

  const articleDefs = [
    {
      category: "shop-feature",
      title: "【今週のおすすめ】ひまわり食堂の日替わり定食が最高すぎる件",
      excerpt: "東藻琴のひまわり食堂で日替わり定食を実食レポート。ボリューム満点で学生に人気の理由を紹介します。",
      body: "東藻琴にあるひまわり食堂の日替わり定食を食べてきました。\n\nこの日はオムライス定食。ケチャップの酸味とふわとろ卵のバランスが絶妙で、ご飯の量も学生にはうれしいボリューム。副菜の小鉢も日替わりで、飽きずに通えるのが魅力です。\n\n部活帰りにお腹を空かせた生徒たちが集まる、地元では有名な食堂。ぜひ一度足を運んでみてください。",
      publishedDaysAgo: 2,
    },
    {
      category: "study-tips",
      title: "定期考査2週間前からできる、教科別の勉強スケジュールの立て方",
      excerpt: "中間考査・期末考査が近づいてきたら読みたい、教科ごとの優先順位のつけ方をまとめました。",
      body: "定期考査が近づくと「何から手をつければいいか分からない」という声をよく聞きます。\n\nおすすめは、まず暗記系(社会・理科基礎)を早めに1周し、数学・英語のような積み上げ型の教科に多めの時間を確保することです。\n\n1週間ごとにやることを書き出し、O-schoolの「課題」ページで自分の課題の進捗をチェックしながら進めると、締切に追われずに済みます。",
      publishedDaysAgo: 6,
    },
    {
      category: "school-life",
      title: "文理選択、実際どうやって決めた?先輩たちの声を集めてみた",
      excerpt: "2年生で分かれる文理選択。実際に選んだ先輩たちがどんな基準で決めたのかをまとめました。",
      body: "2年生になると文理選択で悩む人が多いはず。今回はすでに選択を終えた3年生に話を聞いてみました。\n\n「得意科目より、将来やりたいことから逆算して選んだ」「苦手だけど数学から逃げたくなくて理系にした」など、理由は人それぞれ。\n\n迷っている人は、担任の先生だけでなく色々な先輩の話を聞いてみるのがおすすめです。",
      publishedDaysAgo: 10,
    },
    {
      category: "local-event",
      title: "9/11(金)は体育祭!当日の見どころと持ち物チェックリスト",
      excerpt: "もうすぐ体育祭。当日の流れと忘れ物しやすい持ち物をチェックリストでまとめました。",
      body: "9/11(金)はいよいよ体育祭です。\n\n9:00開会式、午前は学年対抗リレー、午後は選択種目と応援合戦が予定されています。荒天時は9/14(月)に順延です。\n\n持ち物: 体操服・体育館シューズ・水筒・タオル・帽子・ゼッケン。日差しが強い日が多いので、日焼け対策も忘れずに。",
      publishedDaysAgo: 1,
    },
    {
      category: "dev-blog",
      title: "O-school開発日記: 「選択科目」に対応しました",
      excerpt: "同じ時限に複数の授業がある「選択科目」に対応した開発の裏側を、簡単に紹介します。",
      body: "O-schoolはもともと「1時限には必ず1つの授業」という前提で作られていましたが、実際の学校では文理選択や芸術選択のように、同じ時限に複数の授業が並ぶことがよくあります。\n\n今回のアップデートで、1つの時限に複数の教科を登録できるようになりました。生徒は自分がどちらを履修しているかを選んで登録でき、時間割表示にも教科回数の集計にも反映されます。\n\n今後も「実際の学校生活に近づける」ことを目標に、少しずつ改善していきます。",
      publishedDaysAgo: 15,
    },
    {
      category: "shop-feature",
      title: "女満別空港帰りに寄りたい、空港通りベーカリーの焼きたてパン",
      excerpt: "女満別空港からのアクセスも良い、焼きたてパンが自慢のベーカリーカフェを紹介します。",
      body: "女満別エリアで人気のベーカリーカフェ「空港通りベーカリー」。朝7時半から営業しているので、早朝便を利用する前後にも立ち寄りやすいのが魅力です。\n\n特におすすめはクロワッサン。外はサクサク、中はしっとりで、コーヒーとの相性も抜群です。イートインスペースもあるので、ゆっくり過ごすのにもぴったり。",
      publishedDaysAgo: 20,
    },
  ];
  for (const a of articleDefs) {
    await prisma.article.create({
      data: {
        title: a.title,
        excerpt: a.excerpt,
        body: a.body,
        categoryId: articleCategories[a.category].id,
        authorName: "O-school編集部",
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - a.publishedDaysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("📢 広告枠設定を作成しています...");
  const adSlots = [
    { placement: "home-slot-1", label: "トップページ TODAYの下" },
    { placement: "home-slot-2", label: "トップページ 課題の下" },
    { placement: "home-slot-3", label: "トップページ 今月の授業の下" },
    { placement: "home-slot-4", label: "トップページ お店の下" },
    { placement: "home-slot-5", label: "トップページ 記事の下(最下部)" },
    { placement: "timetable-monthly-top", label: "月間時間割ページ 上部" },
    { placement: "timetable-monthly-bottom", label: "月間時間割ページ 下部" },
    { placement: "subject-counts-bottom", label: "教科回数ページ 下部" },
    { placement: "events-bottom", label: "学校行事ページ 下部" },
    { placement: "assignments-bottom", label: "課題一覧ページ 下部" },
    { placement: "search-results-bottom", label: "検索結果ページ 下部" },
    { placement: "shops-list-bottom", label: "お店一覧ページ 下部" },
    { placement: "shop-detail-bottom", label: "お店詳細ページ 下部" },
    { placement: "articles-list-bottom", label: "記事一覧ページ 下部" },
    { placement: "article-detail-bottom", label: "記事詳細ページ 下部" },
  ];
  for (const slot of adSlots) {
    await prisma.adSlot.create({ data: { ...slot, enabled: true } });
  }

  console.log("✅ シード完了！");
  console.log("─────────────────────────────");
  console.log(" 生徒デモアカウント:");
  console.log("  student1 / password123 (あおい・3年A組)");
  console.log("  student2 / password123 (たくみ・2年A組)");
  console.log("  student3 / password123 (ゆい・1年A組)");
  console.log("  student4 / password123 (りく・3年B組)");
  console.log(" 管理者アカウント: admin / adminpass123");
  console.log("─────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
