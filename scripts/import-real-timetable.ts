/**
 * 実際の時間割PDF(9/7〜9/11, 9/14〜9/18)から書き起こしたデータを本番DBに投入する。
 *
 * 【入力元】D:\Program Files\aaaaaaaaaaaaaaaaaaaaa\低予算AIR\時間割\
 *   - R08_時間割 9月7日～11日 生徒用改訂版0904.pdf
 *   - 9月14～18日.pdf
 *
 * 【選択科目グループについての注記】
 * 「農業と環境」等、農業科クラスと普通科クラスが同じ時限を共有している箇所は、
 * ペアとなる相手の教科が日によって変わる(例: ある日は「数学Ｂ」、別の日は
 * 「論理・表現Ⅱ」)。これは学習者が毎回選び直すような選択科目というより、
 * 実際には別トラック(コース)の生徒が同じ時限に別々の授業を受けている状態に近い。
 * 本スクリプトでは electiveGroup ラベルを固定(例: "2年選択1")して扱うため、
 * 相手教科が変わった日は、生徒側が選び直す(前回選択がその日の候補になければ
 * 再度選択を促される)形になる。これはアプリの既存動作で問題なく吸収される。
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/import-real-timetable.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Candidate {
  subject: string;
  teacher?: string;
}
interface PeriodSlot {
  period: number;
  candidates: Candidate[];
  group?: string; // 複数candidatesがある場合の選択科目グループ名
}
interface DayPlan {
  date: string; // YYYY-MM-DD
  grades: Record<"1" | "2" | "3", PeriodSlot[]>;
  notes?: Partial<Record<"1" | "2" | "3", string>>;
}

const c = (subject: string, teacher?: string): Candidate => ({ subject, teacher });

// ---------------------------------------------------------------------------
// 週1: 9月7日(月)〜9月11日(金)
// ---------------------------------------------------------------------------
const week1: DayPlan[] = [
  {
    date: "2026-09-07",
    grades: {
      "1": [
        { period: 1, candidates: [c("数学Ⅰ", "児玉")] },
        { period: 2, candidates: [c("英語コミュニケーションⅠ", "平山")] },
        { period: 3, candidates: [c("家庭基礎", "青山")] },
        { period: 4, candidates: [c("体育", "菱田")] },
        { period: 5, candidates: [c("情報Ⅰ", "横山")] },
        { period: 6, candidates: [c("情報Ⅰ", "横山")] },
      ],
      "2": [
        { period: 1, candidates: [c("英語コミュニケーションⅡ", "平山")] },
        { period: 2, candidates: [c("体育", "菱田")] },
        { period: 3, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 4, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 5, candidates: [c("物理基礎", "北川"), c("地学基礎", "滝ヶ平")], group: "2年選択2" },
        { period: 6, candidates: [c("物理基礎", "北川"), c("地学基礎", "滝ヶ平")], group: "2年選択2" },
      ],
      "3": [
        { period: 1, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        { period: 2, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        { period: 3, candidates: [c("文学国語", "大川")] },
        { period: 4, candidates: [c("古典探究", "大川"), c("英語探究", "半田"), c("フードデザイン", "青山")], group: "3年選択2" },
        { period: 5, candidates: [c("政治・経済", "中澤"), c("大空スポーツ", "菱田"), c("生活と福祉", "青山")], group: "3年選択3" },
        { period: 6, candidates: [c("政治・経済", "中澤"), c("大空スポーツ", "菱田"), c("生活と福祉", "青山")], group: "3年選択3" },
      ],
    },
  },
  {
    date: "2026-09-08",
    grades: {
      "1": [
        { period: 1, candidates: [c("数学Ａ", "横山")] },
        { period: 2, candidates: [c("数学Ａ", "横山")] },
        { period: 3, candidates: [c("美術Ⅰ", "木賊")] },
        { period: 4, candidates: [c("美術Ⅰ", "木賊")] },
        { period: 5, candidates: [c("論理・表現Ⅰ", "半田")] },
        { period: 6, candidates: [c("保健", "菱田")] },
      ],
      "2": [
        { period: 1, candidates: [c("地理総合", "丹羽")] },
        { period: 2, candidates: [c("地理総合", "丹羽")] },
        { period: 3, candidates: [c("数学Ⅱ", "児玉")] },
        { period: 4, candidates: [c("英語コミュニケーションⅡ", "平山")] },
        { period: 5, candidates: [c("論理国語", "大川")] },
        { period: 6, candidates: [c("ＬＨＲ", "半田")] },
      ],
      "3": [
        {
          period: 1,
          candidates: [c("生物基礎", "滝ヶ平"), c("物理基礎", "北川"), c("英語コミュニケーションⅢ", "平山"), c("地域資源活用", "若狭")],
          group: "3年選択4",
        },
        {
          period: 2,
          candidates: [c("生物基礎", "滝ヶ平"), c("物理基礎", "北川"), c("英語コミュニケーションⅢ", "平山"), c("地域資源活用", "若狭")],
          group: "3年選択4",
        },
        { period: 3, candidates: [c("文学国語", "大川")] },
        { period: 4, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        { period: 5, candidates: [c("数学Ｃ", "児玉"), c("農業と情報", "神村"), c("美術Ⅱ", "木賊")], group: "3年選択5" },
        { period: 6, candidates: [c("数学Ｃ", "児玉"), c("農業と情報", "神村"), c("美術Ⅱ", "木賊")], group: "3年選択5" },
      ],
    },
  },
  {
    date: "2026-09-09",
    grades: {
      "1": [
        { period: 1, candidates: [c("体育", "菱田")] },
        { period: 2, candidates: [c("家庭基礎", "青山")] },
        { period: 3, candidates: [c("現代の国語", "大川")] },
        { period: 4, candidates: [c("公共", "中澤")] },
        { period: 5, candidates: [c("産業社会と人間", "北川・菱田・中澤・滝ヶ平")] },
        { period: 6, candidates: [c("産業社会と人間", "北川・菱田・中澤・滝ヶ平")] },
      ],
      "2": [
        { period: 1, candidates: [c("生物基礎", "滝ヶ平")] },
        { period: 2, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 3, candidates: [c("数学Ⅱ", "児玉")] },
        { period: 4, candidates: [c("数学Ⅱ", "児玉")] },
        { period: 5, candidates: [c("総合的な探究の時間", "半田・若狭・平山・神村")] },
        { period: 6, candidates: [c("総合的な探究の時間", "半田・若狭・平山・神村")] },
      ],
      "3": [
        { period: 1, candidates: [c("国語表現", "大川"), c("数学Ⅲ", "児玉"), c("保育基礎", "青山")], group: "3年選択6" },
        { period: 2, candidates: [c("体育", "菱田")] },
        { period: 3, candidates: [c("政治・経済", "中澤"), c("大空スポーツ", "菱田"), c("生活と福祉", "青山")], group: "3年選択3" },
        { period: 4, candidates: [c("情報Ⅱ", "横山"), c("論理・表現Ⅲ", "半田"), c("野菜", "神村")], group: "3年選択7" },
        { period: 5, candidates: [c("総合的な探究の時間", "児玉・青山・大川")] },
        { period: 6, candidates: [c("総合的な探究の時間", "児玉・青山・大川")] },
      ],
    },
  },
  {
    date: "2026-09-10",
    notes: { "3": "CPSV" },
    grades: {
      "1": [
        { period: 1, candidates: [c("現代の国語", "大川")] },
        { period: 2, candidates: [c("数学Ａ", "横山")] },
        { period: 3, candidates: [c("数学Ⅰ", "児玉")] },
        { period: 4, candidates: [c("数学Ⅰ", "児玉")] },
        { period: 5, candidates: [c("保健", "菱田")] },
        { period: 6, candidates: [c("公共", "中澤")] },
      ],
      "2": [
        { period: 1, candidates: [c("英語コミュニケーションⅡ", "平山")] },
        { period: 2, candidates: [c("英語コミュニケーションⅡ", "平山")] },
        { period: 3, candidates: [c("農業と環境", "若狭"), c("論理・表現Ⅱ", "半田")], group: "2年選択1" },
        { period: 4, candidates: [c("論理国語", "大川")] },
        { period: 5, candidates: [c("論理国語", "大川")] },
        { period: 6, candidates: [c("体育", "菱田")] },
      ],
      "3": [
        { period: 1, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        { period: 2, candidates: [c("古典探究", "大川"), c("英語探究", "半田"), c("フードデザイン", "青山")], group: "3年選択2" },
        { period: 3, candidates: [c("体育", "菱田")] },
        { period: 4, candidates: [c("情報Ⅱ", "横山"), c("論理・表現Ⅲ", "半田"), c("野菜", "神村")], group: "3年選択7" },
        { period: 5, candidates: [c("情報Ⅱ", "横山"), c("論理・表現Ⅲ", "半田"), c("野菜", "神村")], group: "3年選択7" },
        { period: 6, candidates: [c("ＬＨＲ", "児玉・青山")] },
      ],
    },
  },
  {
    date: "2026-09-11",
    notes: { "1": "5分短縮日課", "2": "5分短縮日課", "3": "5分短縮日課" },
    grades: {
      "1": [
        { period: 1, candidates: [c("公共", "中澤")] },
        { period: 2, candidates: [c("体育", "菱田")] },
        { period: 3, candidates: [c("英語コミュニケーションⅠ", "平山")] },
        { period: 4, candidates: [c("英語コミュニケーションⅠ", "平山")] },
        { period: 5, candidates: [c("論理・表現Ⅰ", "半田")] },
        { period: 6, candidates: [c("数学Ａ", "横山")] },
      ],
      "2": [
        { period: 1, candidates: [c("数学Ⅱ", "児玉")] },
        { period: 2, candidates: [c("生物基礎", "滝ヶ平")] },
        { period: 3, candidates: [c("歴史総合", "中澤")] },
        { period: 4, candidates: [c("歴史総合", "中澤")] },
        { period: 5, candidates: [c("保健", "菱田")] },
        { period: 6, candidates: [c("体育", "菱田")] },
      ],
      "3": [
        { period: 1, candidates: [c("文学国語", "大川")] },
        { period: 2, candidates: [c("古典探究", "大川"), c("英語探究", "半田"), c("フードデザイン", "青山")], group: "3年選択2" },
        { period: 3, candidates: [c("国語表現", "大川"), c("数学Ⅲ", "児玉"), c("保育基礎", "青山")], group: "3年選択6" },
        { period: 4, candidates: [c("国語表現", "大川"), c("数学Ⅲ", "児玉"), c("保育基礎", "青山")], group: "3年選択6" },
        {
          period: 5,
          candidates: [c("生物基礎", "滝ヶ平"), c("物理基礎", "北川"), c("英語コミュニケーションⅢ", "平山"), c("地域資源活用", "若狭")],
          group: "3年選択4",
        },
        {
          period: 6,
          candidates: [c("生物基礎", "滝ヶ平"), c("物理基礎", "北川"), c("英語コミュニケーションⅢ", "平山"), c("地域資源活用", "若狭")],
          group: "3年選択4",
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// 週2: 9月14日(月)〜9月18日(金)
// ---------------------------------------------------------------------------
const week2: DayPlan[] = [
  {
    date: "2026-09-14",
    grades: {
      "1": [
        { period: 1, candidates: [c("公共", "中澤")] },
        { period: 2, candidates: [c("数学Ⅰ", "児玉")] },
        { period: 3, candidates: [c("数学Ⅰ", "児玉")] },
        { period: 4, candidates: [c("家庭基礎", "青山")] },
        { period: 5, candidates: [c("体育", "菱田")] },
        { period: 6, candidates: [c("数学Ａ", "横山")] },
      ],
      "2": [
        { period: 1, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 2, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 3, candidates: [c("生物基礎", "滝ヶ平")] },
        { period: 4, candidates: [c("論理国語", "大川")] },
        { period: 5, candidates: [c("数学Ⅱ", "児玉")] },
        { period: 6, candidates: [c("数学Ⅱ", "児玉")] },
      ],
      "3": [
        { period: 1, candidates: [c("古典探究", "大川"), c("英語探究", "半田"), c("フードデザイン", "青山")], group: "3年選択2" },
        { period: 2, candidates: [c("古典探究", "大川"), c("英語探究", "半田"), c("フードデザイン", "青山")], group: "3年選択2" },
        { period: 3, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        { period: 4, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        { period: 5, candidates: [c("文学国語", "大川")] },
        { period: 6, candidates: [c("体育", "菱田")] },
      ],
    },
  },
  {
    date: "2026-09-15",
    grades: {
      "1": [
        { period: 1, candidates: [c("情報Ⅰ", "横山")] },
        { period: 2, candidates: [c("情報Ⅰ", "横山")] },
        { period: 3, candidates: [c("美術Ⅰ", "木賊")] },
        { period: 4, candidates: [c("美術Ⅰ", "木賊")] },
        { period: 5, candidates: [c("現代の国語", "大川")] },
        { period: 6, candidates: [c("論理・表現Ⅰ", "半田")] },
      ],
      "2": [
        { period: 1, candidates: [c("地理総合", "丹羽")] },
        { period: 2, candidates: [c("地理総合", "丹羽")] },
        { period: 3, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 4, candidates: [c("体育", "菱田")] },
        { period: 5, candidates: [c("歴史総合", "中澤")] },
        { period: 6, candidates: [c("歴史総合", "中澤")] },
      ],
      "3": [
        { period: 1, candidates: [c("情報Ⅱ", "横山"), c("論理・表現Ⅲ", "半田"), c("野菜", "神村")], group: "3年選択7" },
        { period: 2, candidates: [c("情報Ⅱ", "横山"), c("論理・表現Ⅲ", "半田"), c("野菜", "神村")], group: "3年選択7" },
        { period: 3, candidates: [c("体育", "菱田")] },
        { period: 4, candidates: [c("文学国語", "大川")] },
        { period: 5, candidates: [c("数学Ｃ", "児玉"), c("農業と情報", "神村"), c("美術Ⅱ", "木賊")], group: "3年選択5" },
        { period: 6, candidates: [c("数学Ｃ", "児玉"), c("農業と情報", "神村"), c("美術Ⅱ", "木賊")], group: "3年選択5" },
      ],
    },
  },
  {
    date: "2026-09-16",
    notes: { "1": "ボランティア活動", "2": "ボランティア活動", "3": "CPSV" },
    grades: {
      "1": [
        { period: 1, candidates: [c("情報Ⅰ", "横山")] },
        { period: 2, candidates: [c("情報Ⅰ", "横山")] },
        { period: 3, candidates: [c("産業社会と人間", "北川・菱田・中澤・滝ヶ平")] },
        { period: 4, candidates: [c("産業社会と人間", "北川・菱田・中澤・滝ヶ平")] },
        { period: 5, candidates: [c("産業社会と人間", "北川・菱田・中澤・滝ヶ平")] },
        { period: 6, candidates: [c("産業社会と人間", "北川・菱田・中澤・滝ヶ平")] },
      ],
      "2": [
        { period: 1, candidates: [c("数学Ⅱ", "児玉")] },
        { period: 2, candidates: [c("体育", "菱田")] },
        { period: 3, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 4, candidates: [c("農業と環境", "若狭"), c("数学Ｂ", "横山")], group: "2年選択1" },
        { period: 5, candidates: [c("総合的な探究の時間", "半田・若狭・平山・神村")] },
        { period: 6, candidates: [c("総合的な探究の時間", "半田・若狭・平山・神村")] },
      ],
      "3": [
        { period: 1, candidates: [c("情報Ⅱ", "横山"), c("論理・表現Ⅲ", "半田"), c("野菜", "神村")], group: "3年選択7" },
        { period: 2, candidates: [c("情報Ⅱ", "横山"), c("論理・表現Ⅲ", "半田"), c("野菜", "神村")], group: "3年選択7" },
        { period: 3, candidates: [c("体育", "菱田")] },
        { period: 4, candidates: [c("国語表現", "大川"), c("数学Ⅲ", "児玉"), c("保育基礎", "青山")], group: "3年選択6" },
        { period: 5, candidates: [c("総合的な探究の時間", "児玉・青山・大川")] },
        { period: 6, candidates: [c("総合的な探究の時間", "児玉・青山・大川")] },
      ],
    },
  },
  {
    date: "2026-09-17",
    notes: {
      "1": "生徒会役員選挙(6限)・5分短縮日課(15:10終了)",
      "2": "生徒会役員選挙(6限)・5分短縮日課(15:10終了)",
      "3": "5分短縮日課(15:10終了)",
    },
    grades: {
      "1": [
        { period: 1, candidates: [c("数学Ⅰ", "児玉")] },
        { period: 2, candidates: [c("数学Ⅰ", "児玉")] },
        { period: 3, candidates: [c("数学Ａ", "横山")] },
        { period: 4, candidates: [c("数学Ａ", "横山")] },
        { period: 5, candidates: [c("保健", "菱田")] },
        // 6限: 生徒会役員選挙のためコマなし
      ],
      "2": [
        { period: 1, candidates: [c("体育", "菱田")] },
        { period: 2, candidates: [c("英語コミュニケーションⅡ", "平山")] },
        { period: 3, candidates: [c("英語コミュニケーションⅡ", "平山")] },
        { period: 4, candidates: [c("保健", "菱田")] },
        { period: 5, candidates: [c("数学Ⅱ", "児玉")] },
        // 6限: 生徒会役員選挙のためコマなし
      ],
      "3": [
        { period: 1, candidates: [c("文学国語", "大川")] },
        { period: 2, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        { period: 3, candidates: [c("日本史探究", "中澤"), c("化学", "北川"), c("草花", "神村")], group: "3年選択1" },
        {
          period: 4,
          candidates: [c("生物基礎", "滝ヶ平"), c("物理基礎", "北川"), c("英語コミュニケーションⅢ", "平山"), c("地域資源活用", "若狭")],
          group: "3年選択4",
        },
        { period: 5, candidates: [c("古典探究", "大川"), c("英語探究", "半田"), c("フードデザイン", "青山")], group: "3年選択2" },
        { period: 6, candidates: [c("古典探究", "大川"), c("英語探究", "半田"), c("フードデザイン", "青山")], group: "3年選択2" },
      ],
    },
  },
  {
    date: "2026-09-18",
    notes: { "1": "後期役員決め", "2": "後期役員決め", "3": "後期役員決め" },
    grades: {
      "1": [
        { period: 1, candidates: [c("数学Ａ", "横山")] },
        { period: 2, candidates: [c("数学Ａ", "横山")] },
        { period: 3, candidates: [c("公共", "中澤")] },
        { period: 4, candidates: [c("ＬＨＲ", "北川・菱田")] },
        { period: 5, candidates: [c("論理・表現Ⅰ", "半田")] },
        { period: 6, candidates: [c("論理・表現Ⅰ", "半田")] },
      ],
      "2": [
        { period: 1, candidates: [c("論理国語", "大川")] },
        { period: 2, candidates: [c("生物基礎", "滝ヶ平")] },
        { period: 3, candidates: [c("数学Ⅱ", "児玉")] },
        { period: 4, candidates: [c("ＬＨＲ", "半田・若狭")] },
        { period: 5, candidates: [c("物理基礎", "北川"), c("地学基礎", "滝ヶ平")], group: "2年選択2" },
        { period: 6, candidates: [c("物理基礎", "北川"), c("地学基礎", "滝ヶ平")], group: "2年選択2" },
      ],
      "3": [
        { period: 1, candidates: [c("政治・経済", "中澤"), c("大空スポーツ", "菱田"), c("生活と福祉", "青山")], group: "3年選択3" },
        { period: 2, candidates: [c("政治・経済", "中澤"), c("大空スポーツ", "菱田"), c("生活と福祉", "青山")], group: "3年選択3" },
        { period: 3, candidates: [c("文学国語", "大川")] },
        { period: 4, candidates: [c("ＬＨＲ", "児玉・青山")] },
        { period: 5, candidates: [c("国語表現", "大川"), c("数学Ⅲ", "児玉"), c("保育基礎", "青山")], group: "3年選択6" },
        { period: 6, candidates: [c("国語表現", "大川"), c("数学Ⅲ", "児玉"), c("保育基礎", "青山")], group: "3年選択6" },
      ],
    },
  },
];

const GRADE_TO_CLASS_NAME: Record<"1" | "2" | "3", string> = {
  "1": "1年1組",
  "2": "2年1組",
  "3": "3年1組",
};

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("School が存在しません。");

  const subjects = await prisma.subject.findMany({ where: { schoolId: school.id } });
  const subjectId = new Map(subjects.map((s) => [s.name, s.id]));

  const classByGrade: Record<"1" | "2" | "3", string> = {} as never;
  for (const g of ["1", "2", "3"] as const) {
    const klass = await prisma.class.findFirst({ where: { name: GRADE_TO_CLASS_NAME[g] } });
    if (!klass) throw new Error(`Class ${GRADE_TO_CLASS_NAME[g]} が見つかりません。`);
    classByGrade[g] = klass.id;
  }

  const allDays = [...week1, ...week2];
  let created = 0;

  for (const day of allDays) {
    for (const g of ["1", "2", "3"] as const) {
      const classId = classByGrade[g];
      const date = new Date(`${day.date}T00:00:00.000Z`);
      const slots = day.grades[g];
      const note = day.notes?.[g] ?? null;

      // 既存があれば安全に上書き(冪等に再実行できるようにする)
      await prisma.dailyOverride.deleteMany({ where: { classId, date } });

      const slotCreates: {
        period: number;
        subjectId: string;
        teacher: string | null;
        electiveGroup: string | null;
      }[] = [];

      for (const slot of slots) {
        for (const cand of slot.candidates) {
          const sid = subjectId.get(cand.subject);
          if (!sid) {
            throw new Error(`教科「${cand.subject}」がDBに見つかりません(${day.date} ${g}年次 ${slot.period}限)`);
          }
          slotCreates.push({
            period: slot.period,
            subjectId: sid,
            teacher: cand.teacher ?? null,
            electiveGroup: slot.group ?? null,
          });
        }
      }

      await prisma.dailyOverride.create({
        data: {
          classId,
          date,
          kind: "CUSTOM",
          note,
          slots: { create: slotCreates },
        },
      });
      created++;
      console.log(`✅ ${day.date} ${GRADE_TO_CLASS_NAME[g]}: ${slotCreates.length}コマ`);
    }
  }

  console.log(`🎉 完了しました(${created}件のDailyOverrideを作成)。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
