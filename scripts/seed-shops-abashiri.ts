/**
 * 網走市中心部の実在店舗データを投入する(冪等・表記ゆれを正規化して同名店舗はスキップ)。
 * 出典: 網走市観光協会公式サイト(visit-abashiri.jp)、博物館網走監獄公式、
 * オホーツク流氷館公式、食べログ、北海道Likers 等をクロスチェックして調査(2026-09)。
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/seed-shops-abashiri.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function mapUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}

function normalizeName(name: string): string {
  return name.replace(/　/g, " ").replace(/\s+/g, " ").trim();
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
  { name: "ラーメンだるまや 網走店", category: "グルメ", description: "地元で長年愛される老舗ラーメン店。看板は旨味凝縮の「どろラーメン」", address: "北海道網走市南六条西1丁目8-6", businessHours: "11:00〜22:00", closedDays: "第1月曜日", tags: ["ラーメン"] },
  { name: "らーめん海風堂 網走本店", category: "グルメ", description: "味噌ラーメンが看板の人気ラーメン店。地元客・観光客に人気", address: "北海道網走市潮見10丁目1-26", businessHours: "", closedDays: "", tags: ["ラーメン", "味噌ラーメン"] },
  { name: "煮干らぁめん 有頂天", category: "グルメ", description: "スープ・麺・具材にこだわる煮干し系ラーメンの人気店", address: "北海道網走市潮見10-8-15", businessHours: "", closedDays: "", tags: ["ラーメン", "煮干しラーメン"] },
  { name: "麺屋 海嵐", category: "グルメ", description: "札幌の人気店の姉妹店。網走番屋オホーツクマルク内のラーメン店", address: "北海道網走市南4条東6丁目 網走番屋オホーツクマルク内", businessHours: "11:00〜15:00", closedDays: "", tags: ["ラーメン"] },
  { name: "すし屋のきた浜", category: "グルメ", description: "珍しい鮮魚も揃う網走の人気寿司店", address: "北海道網走市南三条西2 第1ツカサビル1F", businessHours: "", closedDays: "", tags: ["寿司", "海鮮"] },
  { name: "鮨Dining 月", category: "グルメ", description: "網走駒場で大きなネタが人気の寿司店", address: "北海道網走市駒場北5丁目83-27", businessHours: "11:00〜22:00", closedDays: "", tags: ["寿司"] },
  { name: "旬鮮料理 あみさい", category: "グルメ", description: "和食料理人の技で網走の味を堪能できる海鮮居酒屋。ザンギも人気", address: "北海道網走市南三条西2-11 第3ツカサビル1F", businessHours: "17:00〜23:00(LO22:30)", closedDays: "日曜日ほか不定休2日", tags: ["居酒屋", "海鮮"] },
  { name: "さかなの金川", category: "グルメ", description: "夫婦で営む老舗魚屋。500円の海鮮丼が名物(数量限定)", address: "北海道網走市南4条西1丁目11番地", businessHours: "9:00〜18:30", closedDays: "日曜", tags: ["海鮮丼"] },
  { name: "和と海 晴ル～haru～", category: "グルメ", description: "昼は海鮮丼・麺類、夜は地魚と流氷水仕込み地ビールの居酒屋に", address: "北海道網走市南5条西2丁目8", businessHours: "昼11:00〜14:30(LO14:00)/夜17:30〜23:00(LO22:00・飲物22:30)", closedDays: "日曜日", tags: ["海鮮", "居酒屋"] },
  { name: "soba 晴風", category: "グルメ", description: "希少な摩周そば粉を使う蕎麦専門店。石臼挽き手打ちが自慢", address: "北海道網走市つくしヶ丘4丁目3-10", businessHours: "11:00〜15:00(LO14:30)", closedDays: "不定休", tags: ["蕎麦"] },
  { name: "YAKINIKU網走ビール館", category: "グルメ", description: "自家製地ビールと和牛が味わえるビアレストラン", address: "北海道網走市南2条西4丁目1-2", businessHours: "月〜木17:00〜22:00(LO21:30)ほか曜日により変動", closedDays: "", tags: ["焼肉", "地ビール"] },
  { name: "網走生ラムジンギスカン フラミンゴ", category: "グルメ", description: "2023年開業、札幌の人気店「えいじん」のFC。生ラムジンギスカン", address: "北海道網走市南5条西1 1F", businessHours: "17:00〜22:00(曜日により変動)", closedDays: "", tags: ["ジンギスカン"] },
  { name: "焼肉の達人 網走店", category: "グルメ", description: "つぼ八系列が展開する焼肉チェーン店の網走店", address: "北海道網走市南四条西2-6", businessHours: "月〜土・祝前17:00〜23:00、日祝17:00〜22:00", closedDays: "", tags: ["焼肉"] },
  { name: "やきとり 一席八鳥", category: "グルメ", description: "網走産「知床若鶏」をミズナラ木炭で焼くモダン焼鳥店", address: "北海道網走市南五条西1丁目 金川ビル1F", businessHours: "", closedDays: "", tags: ["焼き鳥"] },
  { name: "監獄食堂", category: "グルメ", description: "博物館網走監獄内で当時の獄中食を再現したメニューを提供", address: "北海道網走市字呼人1-1 博物館網走監獄内", businessHours: "4/21〜10/30 11:00〜15:00(LO14:30)、冬期は「番外地食堂」に", closedDays: "", tags: ["観光グルメ"] },
  { name: "停車場(北浜駅)", category: "カフェ", description: "1986年開業、JR北浜駅舎内のレトロ喫茶。オホーツク海を一望", address: "北海道網走市北浜 JR北浜駅内", businessHours: "11:00〜18:00(LO17:30)", closedDays: "火曜日", tags: ["駅カフェ", "絶景"] },
  { name: "シーニック・カフェ 帽子岩", category: "カフェ", description: "流氷硝子館内のカフェ。名物「流氷ソーダ」が人気", address: "北海道網走市南4条東6丁目2-1", businessHours: "", closedDays: "", tags: ["カフェ", "流氷硝子館"] },
  { name: "uminoba", category: "カフェ", description: "オホーツク海に面したセレクトショップ併設カフェ。塩ソフトが人気", address: "北海道網走市藻琴14-1", businessHours: "10:00〜17:00(フードLO16:00・ドリンクLO16:30)", closedDays: "", tags: ["カフェ", "ハンバーガー"] },
  { name: "Cafe GrassRoots", category: "カフェ", description: "網走国定公園の自然に囲まれたログハウスカフェ", address: "北海道網走市大曲字46-18", businessHours: "11:00〜19:30(17時以降要予約)", closedDays: "水曜・第3木曜", tags: ["カフェ"] },
  { name: "Salt&Sun", category: "カフェ", description: "オホーツク海を望む健康志向ランチが人気のカフェ", address: "北海道網走市海岸町5番1-4", businessHours: "10:30〜15:00LO", closedDays: "火〜金のみ営業(土日月休み)", tags: ["カフェ", "海岸"] },
  { name: "然も", category: "カフェ", description: "桂台エリアのカフェバー。オホーツクの食を伝える店", address: "", businessHours: "", closedDays: "", tags: ["カフェバー"] },
  { name: "High bridge cafe", category: "カフェ", description: "網走中央商店街にあるカフェ", address: "北海道網走市南4条西3丁目9", businessHours: "月〜土11:30〜21:00、日11:30〜18:00", closedDays: "水曜日", tags: ["カフェ", "商店街"] },
  { name: "日曜島", category: "カフェ", description: "網走台町のカフェ・喫茶店", address: "北海道網走市台町3-3-5", businessHours: "", closedDays: "月曜日", tags: ["カフェ", "喫茶店"] },
  { name: "LIA.cafe", category: "カフェ", description: "オホーツク唯一のFMラジオスタジオ併設カフェ", address: "北海道網走市潮見1丁目356番地2", businessHours: "火土祝11:00〜16:00、水〜金11:00〜18:00", closedDays: "月・日", tags: ["カフェ", "ランチ"] },
  { name: "Cafe&Cake 風花", category: "スイーツ", description: "網走産低温殺菌牛乳と道産卵を使う「網走プリン」が名物のケーキ店", address: "北海道網走市字呼人121-7", businessHours: "10:00〜19:00(カフェLO夏18:00/冬17:00)", closedDays: "水曜(祝日を除く)", tags: ["プリン", "ケーキ"] },
  { name: "鯛焼きカフェ あずき", category: "スイーツ", description: "地元で愛される鯛焼き専門カフェ。テイクアウト・イートイン可", address: "北海道網走市南5条東2丁目6番2", businessHours: "10:30〜13:00、14:00〜17:00", closedDays: "土日祝", tags: ["たい焼き"] },
  { name: "DANIEL du NORD 4条店", category: "スイーツ", description: "網走の小麦を使うパンと洋菓子の専門店", address: "北海道網走市南4条西2丁目", businessHours: "10:00〜18:30", closedDays: "", tags: ["パン", "洋菓子"] },
  { name: "道の駅 流氷街道網走", category: "買い物", description: "網走川河口の道の駅。お土産・網走バーガー・流氷観覧などの拠点", address: "北海道網走市南3条東4丁目", businessHours: "9:00〜18:30(夏季)/9:00〜18:00(冬季)", closedDays: "12/31〜1/1", tags: ["道の駅", "お土産"] },
  { name: "オホーツクマルク 網走番屋", category: "買い物", description: "倉庫を改装した複合施設。土産店・海産物直売・飲食店が集結", address: "北海道網走市南4条東6丁目8-2", businessHours: "9:00頃〜17:00(店舗により異なる)", closedDays: "水曜ほか不定休", tags: ["お土産", "海産物"] },
  { name: "パンドコマ", category: "買い物", description: "焼きたてハード系パンが人気の網走ベーカリー", address: "北海道網走市つくしケ丘2丁目5-3", businessHours: "10:00〜売り切れ次第閉店", closedDays: "水曜日", tags: ["パン", "ベーカリー"] },
  { name: "増田水産 北の浜市網走番屋店", category: "買い物", description: "オホーツク一夜干しや活ホタテなど海産物の直売店", address: "網走番屋(南4条東6丁目8-2)内", businessHours: "", closedDays: "", tags: ["水産物直売", "お土産"] },
  { name: "今野商店 直売網走番屋店", category: "買い物", description: "活カニ・活魚を扱う海産問屋の直売店", address: "網走番屋内", businessHours: "", closedDays: "", tags: ["かに", "水産物直売"] },
  { name: "博物館 網走監獄", category: "観光", description: "旧網走刑務所の舎房等を移築保存した日本唯一の監獄博物館", address: "北海道網走市字呼人1-1", businessHours: "9:00〜17:00(最終入場16:00)", closedDays: "12/31〜1/1", tags: ["網走監獄", "歴史"] },
  { name: "鏡橋", category: "観光", description: "博物館網走監獄内に再現された旧網走刑務所の橋", address: "北海道網走市字呼人1-1 博物館網走監獄内", businessHours: "", closedDays: "", tags: ["網走監獄"] },
  { name: "オホーツク流氷館", category: "観光", description: "天都山山頂の流氷体感型施設。マイナス15℃の流氷体感室あり", address: "北海道網走市天都山244-3", businessHours: "夏季8:30〜18:00/冬季9:00〜16:30", closedDays: "年中無休", tags: ["流氷", "天都山"] },
  { name: "北海道立北方民族博物館", category: "観光", description: "グリーンランドからスカンジナビアまで北方民族を紹介する博物館", address: "北海道網走市字潮見309-1", businessHours: "9:30〜16:30(7〜9月9:00〜17:00)", closedDays: "月曜(7〜9月・2月は無休)", tags: ["博物館", "北方民族"] },
  { name: "モヨロ貝塚館", category: "観光", description: "オホーツク文化のモヨロ貝塚遺跡を展示する網走市立郷土博物館分館", address: "北海道網走市北1条東2丁目", businessHours: "", closedDays: "", tags: ["史跡", "博物館"] },
  { name: "網走市立郷土博物館", category: "観光", description: "網走の自然・歴史・アイヌ文化を紹介する郷土博物館", address: "北海道網走市桂町1丁目1番3号", businessHours: "", closedDays: "", tags: ["博物館", "郷土"] },
  { name: "天都山展望台", category: "観光", description: "網走湖・能取湖・オホーツク海・知床連山を一望できる展望台", address: "北海道網走市天都山245-1", businessHours: "", closedDays: "", tags: ["展望台", "絶景"] },
  { name: "能取岬", category: "観光", description: "高さ40〜50mの断崖が続く岬。灯台と牧場、流氷観察の名所", address: "北海道網走市", businessHours: "", closedDays: "", tags: ["岬", "流氷", "絶景"] },
  { name: "卯原内サンゴ草群生地", category: "観光", description: "8月下旬〜9月下旬に真紅の絨毯のようなサンゴ草(アッケシソウ)が広がる能取湖畔", address: "北海道網走市卯原内60-3", businessHours: "", closedDays: "", tags: ["サンゴ草", "能取湖"] },
  { name: "大曲湖畔園地(ひまわり畑)", category: "観光", description: "旧網走刑務所農場跡地の広大なひまわり畑。夏と秋の年2回開花", address: "北海道網走市字三眺25番", businessHours: "9:00〜17:00", closedDays: "", tags: ["ひまわり", "花畑"] },
  { name: "網走流氷観光砕氷船おーろら", category: "観光", description: "冬期の流氷観光砕氷船。道の駅内に発着場を持つ", address: "北海道網走市南3条東4-5-1 道の駅流氷街道網走内", businessHours: "", closedDays: "", tags: ["流氷", "砕氷船"] },
  { name: "セイコーマート 網走南2条店", category: "コンビニ", description: "網走駅前近くの24時間営業コンビニ", address: "北海道網走市南2条西4丁目2番3号", businessHours: "24時間", closedDays: "", tags: ["コンビニ"] },
];

async function main() {
  const region = await prisma.shopRegion.findFirst({ where: { name: "網走" } });
  if (!region) throw new Error("地域「網走」が見つかりません");

  const categories = await prisma.shopCategory.findMany();
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));

  const existingShops = await prisma.shop.findMany();
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
