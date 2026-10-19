const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "raw_chapters");
const transDir = path.join(__dirname, "translated_chapters");
if (!fs.existsSync(transDir)) fs.mkdirSync(transDir);

// Quy tắc từ vựng & thuật ngữ chuẩn
const replacements = [
  [/\bDiệp đốt\b/g, "Diệp Nhiên"],
  [/\bDiệp cháy\b/g, "Diệp Nhiên"],
  [/\bkhí vận chi linh\b/gi, "Khí Vận Chi Linh"],
  [/\btinh nguyên thân\b/gi, "Tinh Nguyên Thân"],
  [/\btinh văn sắt\b/gi, "Tinh Văn Thiết"],
  [/\btinh quan\b/gi, "Tinh Quan"],
  [/\btinh tướng thể\b/gi, "Tinh Tướng Thể"],
  [/\btinh tướng\b/gi, "Tinh Tướng"],
  [/\btinh vương\b/gi, "Tinh Vương"],
  [/\bđại tinh vương\b/gi, "Đại Tinh Vương"],
  [/\bchân vương\b/gi, "Chân Vương"],
  [/\bchúa tể\b/gi, "Chúa Tể"],
  [/\blục tinh khiếu\b/gi, "Lục Tinh Khiếu"],
  [/\btứ tinh khiếu\b/gi, "Tứ Tinh Khiếu"],
  [/\btinh khiếu\b/gi, "Tinh Khiếu"],
  [/\bma diệu khói\b/gi, "Ma Diệu Yên"],
  [/\bThần Vô đi\b/gi, "Thần Vô Hành"],
  [/\btinh khải chi nhãn\b/gi, "Tinh Khải Chi Nhãn"],
  [/\btinh khải mắt\b/gi, "Tinh Khải Chi Nhãn"],
  [/\bthần diệu cốt\b/gi, "Thần Diệu Cốt"],
  [/\bcổ chiến trường\b/gi, "Cổ Chiến Trường"],
  [/\bá nhân tinh vực\b/gi, "Á Nhân Tinh Vực"],
  [/\bthương tinh ma điển\b/gi, "Thương Tinh Ma Điển"],
  [/\bviêm hoàng tổ long\b/gi, "Viêm Hoàng Tổ Long"],
  [/\blinh binh lực\b/gi, "lực Linh Binh"],
  [/\bma cốt thân\b/gi, "Ma Cốt Thân"],
  [/\bthiên ma tộc\b/gi, "Thiên Ma Tộc"],
  [/\bthần linh tộc\b/gi, "Thần Linh Tộc"],
  [/\bcổ ma tộc\b/gi, "Cổ Ma Tộc"],
  [/\bthần minh tộc\b/gi, "Thần Minh Tộc"],
  [/\bvũ cấp\b/gi, "Vũ cấp"],
  [/\bkỳ vật\b/gi, "kỳ vật"],
  [/\btinh thuật\b/gi, "tinh thuật"],
  [/\btinh thiên linh cảnh\b/gi, "Tinh Thiên Linh Cảnh"],
  [/\bthập thần thiên tử\b/gi, "Thập Thần Thiên Tử"],
  [/\bvương bát đản\b/gi, "khốn kiếp"],
  [/\bnày loại\b/g, "loại này"],
  [/\bnày cái\b/g, "cái này"],
  [/\bnày chút\b/g, "những này"],
  [/\bnày lần\b/g, "lần này"],
  [/\bđó cái\b/g, "cái kia"],
  [/\bđó chút\b/g, "những kia"],
  [/\bngay tại chỗ\b/g, "ngay tại chỗ"],
  [/\bnhất cổ tác khí\b/g, "thừa thắng xông lên"],
  [/\bhai ngàn vạn\b/g, "hai mươi triệu"],
  [/\bchín trăm triệu\b/g, "chín trăm triệu"],
  [/\bhút lấy\b/g, "hấp thu"],
  [/\btinh trời ban phúc\b/gi, "Tinh Thiên Ban Phúc"]
];

function polishText(text) {
  let res = text;
  for (const [r, sub] of replacements) {
    res = res.replace(r, sub);
  }
  return res;
}

const files = fs.readdirSync(rawDir).filter(f => f.endsWith(".json")).sort((a,b) => parseInt(a) - parseInt(b));
console.log(`Processing ${files.length} raw chapters...`);

const translatedAll = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(rawDir, file), "utf8"));
  const polishedContent = polishText(data.vietRaw);
  const chapterObj = {
    num: data.num,
    id: data.id,
    rawTitle: data.rawTitle,
    title: polishText(data.rawTitle).toUpperCase(),
    content: polishedContent
  };
  fs.writeFileSync(path.join(transDir, file), JSON.stringify(chapterObj, null, 2));
  translatedAll.push(chapterObj);
}

fs.writeFileSync(path.join(__dirname, "all_translated.json"), JSON.stringify(translatedAll, null, 2));
console.log("Done polish and save!");
