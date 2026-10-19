const https = require("https");
const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "raw_chapters");
if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir);

const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, "chapters_index.json"), "utf8"));

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" } }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function cleanHtmlToText(htmlChunk) {
  let text = htmlChunk.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, "$1");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/\t/g, "").replace(/\n\s*\n+/g, "\n\n").trim();
  return text;
}

function extractChinese(htmlChunk) {
  let ch = "";
  const regex = /<i[^>]*ch="([^"]+)"/g;
  let m;
  while ((m = regex.exec(htmlChunk)) !== null) {
    ch += m[1];
  }
  return ch;
}

async function scrapeChapter(c) {
  const savePath = path.join(rawDir, `${c.num}.json`);
  if (fs.existsSync(savePath)) {
    return JSON.parse(fs.readFileSync(savePath, "utf8"));
  }

  const url = `https://dichtienghoa.net/truyen/23246/${c.id}`;
  const html = await fetchUrl(url);
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) throw new Error("Nuxt data not found for " + c.num);

  const nuxtData = JSON.parse(m[1]);
  // Find the string containing <i id=
  const contentString = nuxtData.find(item => typeof item === "string" && item.includes("<i id=1"));
  if (!contentString) {
    throw new Error("Content string not found for " + c.num);
  }

  const vietRaw = cleanHtmlToText(contentString);
  const data = {
    id: c.id,
    num: c.num,
    rawTitle: c.rawTitle,
    vietRaw: vietRaw
  };
  fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  console.log(`Starting crawl for ${chapters.length} chapters...`);
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    try {
      process.stdout.write(`Fetching ${c.num} (${i + 1}/${chapters.length})... `);
      await scrapeChapter(c);
      console.log("OK");
      // Gentle delay
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log("FAIL:", e.message);
    }
  }
  console.log("Crawl completed!");
}

main();
