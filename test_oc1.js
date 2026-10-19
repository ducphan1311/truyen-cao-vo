const http = require("http");

const postData = JSON.stringify({
  model: "oc1",
  messages: [
    { role: "system", content: "Bạn là dịch giả văn học mạng. Dịch câu sau sang tiếng Việt tự nhiên:" },
    { role: "user", content: "Ngươi nếu có thể kháng trụ ta một quyền này, ta có thể tha cho ngươi một cái mạng." }
  ],
  max_tokens: 100
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
    console.log("Status:", res.statusCode);
    console.log("Data:", data);
  });
});

req.on("error", console.error);
req.write(postData);
req.end();
