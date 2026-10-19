const fs = require("fs");
const path = require("path");
const http = require("http");

const rawDir = path.join(__dirname, "raw_chapters");
const polishedDir = path.join(__dirname, "ai_polished_chapters");
if (!fs.existsSync(polishedDir)) fs.mkdirSync(polishedDir);

function callLLM(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "oc1",
      stream: true,
      messages: [
        {
          role: "system",
          content: `Bạn là dịch giả văn học mạng chuyên nghiệp, chuyên biên dịch tiểu thuyết tiên hiệp / huyền huyễn / cao võ tinh không từ bản convert tiếng Trung sang tiếng Việt hoàn chỉnh, văn phong mượt mà, sống động, tự nhiên.
Quy tắc bắt buộc:
1. Giữ nguyên thuật ngữ tu luyện, danh từ riêng, tên chiêu thức (Tinh Lực, Tinh Khiếu, Lục Tinh Khiếu, Tinh Nguyên Thân, Tinh Quan, Tinh Tướng Thể, Tinh Vương, Chân Vương, Chúa Tể, Khí Vận Chi Linh, Tinh Khải Chi Nhãn, Tinh Văn Thiết, Cổ Chiến Trường, Á Nhân Tinh Vực, Thương Tinh Ma Điển, Viêm Hoàng Tổ Long, Thiên Ma Tộc, Thần Linh Tộc...).
2. Tên nhân vật: Diệp Nhiên (không dịch là Diệp đốt hay Diệp cháy), Ma Diệu Yên (không dịch là Ma Diệu Khói), Thần Vô Hành (không dịch là Thần Vô Đi)...
3. Diễn đạt thành câu văn tiếng Việt trôi chảy, đúng ngữ cảnh đối thoại hoặc miêu tả chiến đấu hoành tráng, loại bỏ hoàn toàn dấu vết convert thô (như "này loại", "đó cái", "ăn trước một quyền của ta", "mặt tươi cười nói"...).
4. Chỉ xuất văn bản tiếng Việt sau khi dịch, không kèm lời chào hỏi, không thêm ghi chú mở đầu/kết thúc.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 8192
    });

    const req = http.request({
      hostname: "127.0.0.1",
      port: 20128,
      path: "/v1/chat/completions",
      method: "POST",
      timeout: 60000,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-3d60d95d020cf27c-asc8xs-cb88400e",
        "Content-Length": Buffer.byteLength(postData)
      }
    }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          // Parse SSE stream
          const lines = data.split("\n");
          let content = "";
          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const parsed = JSON.parse(line.substring(6));
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  content += parsed.choices[0].delta.content;
                }
              } catch (_) {}
            }
          }
          if (content.trim()) {
            resolve(content.trim());
          } else {
            reject(new Error("No content in stream: " + data.substring(0, 150)));
          }
        } catch (e) {
          reject(new Error("Stream parse err: " + data.substring(0, 150)));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function splitTextIntoChunks(text, maxChars = 3000) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let cur = "";
  for (const p of paragraphs) {
    if ((cur + "\n\n" + p).length > maxChars && cur.length > 0) {
      chunks.push(cur.trim());
      cur = p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur.trim().length > 0) chunks.push(cur.trim());
  return chunks;
}

async function translateChapter(num) {
  const savePath = path.join(polishedDir, `${num}.json`);
  if (fs.existsSync(savePath)) {
    console.log(`Chapter ${num} already polished.`);
    return JSON.parse(fs.readFileSync(savePath, "utf8"));
  }

  const raw = JSON.parse(fs.readFileSync(path.join(rawDir, `${num}.json`), "utf8"));
  console.log(`Translating Chapter ${num}: "${raw.rawTitle}" (${raw.vietRaw.length} chars)...`);

  const titlePrompt = `Dịch tiêu đề chương truyện huyền huyễn này sang tiếng Việt tự nhiên và khí thế (chỉ trả về tiêu đề đã dịch, không thêm gì khác):
"${raw.rawTitle}"`;
  const cleanTitle = await callLLM(titlePrompt);

  const chunks = splitTextIntoChunks(raw.vietRaw);
  console.log(`- Split into ${chunks.length} chunks`);
  const translatedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`  Processing chunk ${i + 1}/${chunks.length}... `);
    const chunkPrompt = `Biên dịch đoạn văn bản convert thô sau đây thành tiếng Việt văn học tự nhiên, trau chuốt, giữ đúng thuật ngữ tu luyện và tên nhân vật:

${chunks[i]}`;
    
    let success = false;
    let retries = 3;
    while (!success && retries > 0) {
      try {
        const trans = await callLLM(chunkPrompt);
        translatedChunks.push(trans);
        success = true;
        console.log("OK");
      } catch (err) {
        retries--;
        console.log(`Retry (${err.message})... `);
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    if (!success) {
      throw new Error(`Failed to translate chunk ${i + 1} of chapter ${num}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const fullContent = translatedChunks.join("\n\n");
  const finalObj = {
    num: raw.num,
    id: raw.id,
    rawTitle: raw.rawTitle,
    title: cleanTitle.replace(/^["'\s]+|["'\s]+$/g, ""),
    content: fullContent
  };

  fs.writeFileSync(savePath, JSON.stringify(finalObj, null, 2));
  console.log(`Chapter ${num} completed!\n`);
  return finalObj;
}

async function main() {
  for (let num = 1056; num <= 1061; num++) {
    try {
      await translateChapter(num);
    } catch (e) {
      console.error(`Error on chapter ${num}:`, e.message);
    }
  }
  console.log("=== HOÀN TẤT BIÊN DỊCH BẰNG OC1 ===");
}

main();
