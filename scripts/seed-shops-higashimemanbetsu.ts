/**
 * 東藻琴エリアの実在店舗データを投入する(冪等・同名店舗はスキップ)。
 * 出典: 大空町公式サイト、道の駅ノンキーランドひがしもこと公式サイト、食べログ、
 * 大空町商工会、ホクレン商事 等をクロスチェックして調査(2026-09)。
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/seed-shops-higashimemanbetsu.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function mapUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}

interface ShopSeed {
  name: string;
  category: string;
  description: string;
  address: string;
  businessHours: string;
  closedDays: string;
  tags: string[];
}

const shops: ShopSeed[] = [
  {
    name: "道の駅 ノンキーランドひがしもこと",
    category: "観光",
    description: "国道334号・102号交点にある道の駅。ホテル・レストラン・売店・多目的ホールを併設",
    address: "北海道網走郡大空町東藻琴100",
    businessHours: "9:00～18:00(施設により異なる)",
    closedDays: "12/31～翌年1/5",
    tags: ["道の駅", "観光拠点", "宿泊"],
  },
  {
    name: "レストラン くるりんく",
    category: "グルメ",
    description: "道の駅ノンキーランドひがしもこと内。東藻琴産長いも料理・海鮮丼・ステーキ・ラーメン",
    address: "北海道網走郡大空町東藻琴100",
    businessHours: "ランチ11:00～15:00(L.O.14:00)/ディナー17:00～20:00(L.O.19:00)",
    closedDays: "年末年始",
    tags: ["長いも", "道の駅グルメ", "海鮮丼"],
  },
  {
    name: "ショップあえ～る",
    category: "買い物",
    description: "道の駅ノンキーランドひがしもこと売店。名物「のんき~焼き」、東藻琴の長いも・東藻琴牛、流氷硝子製品",
    address: "北海道網走郡大空町東藻琴100",
    businessHours: "9:00～18:00",
    closedDays: "12/31～翌年1/5",
    tags: ["お土産", "特産品", "道の駅"],
  },
  {
    name: "ホテルひがしもこと",
    category: "その他",
    description: "道の駅ノンキーランドひがしもこと併設。洋室18室・和室2室、最大66名収容",
    address: "北海道網走郡大空町東藻琴100",
    businessHours: "",
    closedDays: "",
    tags: ["ホテル", "宿泊", "道の駅"],
  },
  {
    name: "ひがしもこと芝桜公園",
    category: "観光",
    description: "約10万平方メートルの斜面が芝桜で彩られる名所。ゴーカート・釣堀・足湯・キャンプ場併設",
    address: "北海道網走郡大空町東藻琴末広393",
    businessHours: "9:00～17:00",
    closedDays: "",
    tags: ["芝桜", "花名所", "観光公園"],
  },
  {
    name: "ひがしもこと芝桜公園売店",
    category: "買い物",
    description: "行者ニンニクフランクフルトやソフトクリームなどを提供する公園内売店",
    address: "北海道網走郡大空町東藻琴末広393(東藻琴芝桜公園内)",
    businessHours: "",
    closedDays: "",
    tags: ["売店", "軽食", "芝桜公園"],
  },
  {
    name: "ひがしもこと乳酪館",
    category: "観光",
    description: "東藻琴産生乳を使ったチーズ工房兼展示施設。チーズ・バター・アイス作り体験、四角いカマンベールチーズが名物",
    address: "北海道網走郡大空町東藻琴409番地の1",
    businessHours: "9:00～17:30(通年)",
    closedDays: "5～10月は月曜、11～4月は月・火曜",
    tags: ["チーズ工房", "体験施設", "乳製品"],
  },
  {
    name: "藻琴山(トレッキングコース)",
    category: "観光",
    description: "標高約1000m、阿寒摩周国立公園内。東藻琴コースは6合目まで車で行け、山頂まで約1時間の軽登山",
    address: "北海道網走郡大空町東藻琴(道道102号沿い登山口)",
    businessHours: "",
    closedDays: "",
    tags: ["登山", "トレッキング", "国立公園"],
  },
  {
    name: "ふれあいセンターフロックス",
    category: "その他",
    description: "ナトリウム塩化物泉の日帰り温泉を併設する老人福祉センター。大浴場・サウナ・気泡浴あり",
    address: "北海道網走郡大空町東藻琴387番地の9",
    businessHours: "11:00～22:00(受付21:00まで)",
    closedDays: "毎週木曜、1月1日、清掃日",
    tags: ["日帰り温泉", "福祉センター"],
  },
  {
    name: "豚珍亭",
    category: "グルメ",
    description: "東藻琴産長いもと町産豚を使ったしゃぶしゃぶ風ご当地グルメが名物の食堂",
    address: "北海道網走郡大空町東藻琴316",
    businessHours: "10:00～18:00(L.O.17:30)",
    closedDays: "",
    tags: ["長いも", "ご当地グルメ"],
  },
  {
    name: "お食事処 まる",
    category: "グルメ",
    description: "知床牛(大橋牧場直営)を使った焼肉丼などを提供する居酒屋・創作料理店",
    address: "北海道網走郡大空町東藻琴55-3",
    businessHours: "17:00～22:00",
    closedDays: "",
    tags: ["知床牛", "居酒屋"],
  },
  {
    name: "田舎ノ隠れ家 なかはち",
    category: "グルメ",
    description: "古民家利用の隠れ家的食堂。要予約、うなぎやさくら豚ヒレカツカレーなどを提供",
    address: "北海道網走郡大空町東藻琴141",
    businessHours: "予約制",
    closedDays: "",
    tags: ["古民家", "予約制"],
  },
  {
    name: "Cafe＆Bar ENON",
    category: "カフェ",
    description: "しじ美醤油(藻琴湖しじみ醤油)などを使った料理を提供するダイニングバー",
    address: "北海道網走郡大空町東藻琴333",
    businessHours: "18:00～",
    closedDays: "月・金・日曜",
    tags: ["ダイニングバー", "しじみ醤油"],
  },
  {
    name: "おうちごはん 椛椛",
    category: "グルメ",
    description: "古民家を利用した家庭的な雰囲気の食堂。丼・弁当なども提供",
    address: "北海道網走郡大空町東藻琴335-1",
    businessHours: "",
    closedDays: "",
    tags: ["食堂", "家庭料理"],
  },
  {
    name: "ひがしもこと(食堂)",
    category: "グルメ",
    description: "郷土料理・居酒屋を兼ねる食堂",
    address: "北海道網走郡大空町東藻琴318-5",
    businessHours: "",
    closedDays: "",
    tags: ["食堂", "郷土料理"],
  },
  {
    name: "大空フーズ",
    category: "グルメ",
    description: "地元素材にこだわった手作りソーセージの製造販売兼カフェ。名物ホットドッグ「大空ドッグ」",
    address: "北海道網走郡大空町東藻琴85-33",
    businessHours: "10:00～18:00",
    closedDays: "",
    tags: ["ソーセージ", "ホットドッグ"],
  },
  {
    name: "若鶏の半身揚げ 中山商店",
    category: "グルメ",
    description: "若鶏の半身揚げが名物の鳥料理店",
    address: "北海道網走郡大空町東藻琴304",
    businessHours: "",
    closedDays: "月曜",
    tags: ["からあげ", "鳥料理"],
  },
  {
    name: "精肉店 肉将",
    category: "買い物",
    description: "大橋牧場直営の精肉店。知床牛・純血但馬血統八将牛を対面販売",
    address: "北海道網走郡大空町東藻琴",
    businessHours: "",
    closedDays: "",
    tags: ["知床牛", "精肉店"],
  },
  {
    name: "すがの菓子司",
    category: "スイーツ",
    description: "生どら焼きや「チーズ小僧」(クリームチーズ入りカマンベール饅頭)が名物の菓子店",
    address: "北海道網走郡大空町東藻琴353",
    businessHours: "8:00～19:00(月～土)",
    closedDays: "日曜",
    tags: ["どら焼き", "菓子店"],
  },
  {
    name: "東藻琴ジャム倶楽部",
    category: "買い物",
    description: "東藻琴産のハスカップ・アロニア・カシス等の果実を使った無添加ジャムを製造販売",
    address: "北海道網走郡大空町東藻琴500-11",
    businessHours: "",
    closedDays: "",
    tags: ["ジャム", "特産品"],
  },
  {
    name: "大空ざんまい",
    category: "買い物",
    description: "藻琴湖産しじみを使った加工品(しじみ醤油など)を製造販売",
    address: "北海道網走郡大空町東藻琴333",
    businessHours: "",
    closedDays: "",
    tags: ["藻琴湖しじみ", "特産品"],
  },
  {
    name: "エーコープ 東もこと店",
    category: "買い物",
    description: "JAグループ系スーパー。日用品・食品のほか精肉・鮮魚も扱う地域の生活拠点店",
    address: "北海道網走郡大空町東藻琴75",
    businessHours: "10:00～19:00",
    closedDays: "日曜",
    tags: ["スーパー", "生活雑貨"],
  },
];

/** 全角/半角スペースの表記ゆれを無視して比較するための正規化(全角スペース→半角、連続スペース圧縮)。 */
function normalizeName(name: string): string {
  return name.replace(/　/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const region = await prisma.shopRegion.findFirst({ where: { name: "東藻琴" } });
  if (!region) throw new Error("地域「東藻琴」が見つかりません");

  const categories = await prisma.shopCategory.findMany();
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));

  // 既存店舗名を正規化して集合化(手入力との表記ゆれ重複を防ぐ)
  const existingShops = await prisma.shop.findMany({ where: { regionId: region.id } });
  const existingNames = new Set(existingShops.map((s) => normalizeName(s.name)));

  let created = 0;
  for (const s of shops) {
    if (existingNames.has(normalizeName(s.name))) {
      console.log(`ℹ️ 既存: ${s.name}`);
      continue;
    }
    const catId = categoryId.get(s.category);
    if (!catId) {
      console.warn(`⚠️ カテゴリー「${s.category}」が見つからずスキップ: ${s.name}`);
      continue;
    }
    await prisma.shop.create({
      data: {
        name: s.name,
        regionId: region.id,
        categoryId: catId,
        description: s.description,
        address: s.address || null,
        businessHours: s.businessHours || null,
        closedDays: s.closedDays || null,
        tags: s.tags,
        mapUrl: s.address ? mapUrl(s.name, s.address) : null,
      },
    });
    console.log(`✅ 追加: ${s.name}`);
    created++;
  }
  console.log(`🎉 完了(${created}件追加)。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
