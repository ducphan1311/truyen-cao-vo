const http = require("http");

function callLLM(prompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "gemini/gemini-3.8-flash",
      stream: false,
      messages: [
        {
          role: "system",
          content: "Bạn là dịch giả chuyên nghiệp biên dịch truyện huyền huyễn/cao võ từ bản convert sang tiếng Việt hoàn chỉnh. Chỉ xuất văn bản tiếng Việt hoàn chỉnh, không thêm lời chào, không ghi chú ngoài lề."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4096
    });

    const req = http.request({
      hostname: "127.0.0.1",
      port: 20128,
      path: "/v1/chat/completions",
      method: "POST",
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
          const parsed = JSON.parse(data);
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error("Parse err: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  const res = await callLLM("Biên dịch đoạn này thành tiếng Việt văn phong truyện kiếm hiệp/tiên hiệp tự nhiên:\n'Béo Thiên Ma tộc giống như là không có nghe được, đứng chắp tay, mập mạp trên mặt tròn tràn đầy ngạo nghễ. Ngươi nếu có thể kháng trụ ta một quyền này, ta có thể tha cho ngươi một cái mạng'");
  console.log("Result:\n", res);
}
test();
