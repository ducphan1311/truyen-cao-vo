const http = require("http");
const https = require("https");
const { exec } = require("child_process");

function getVaultSecrets() {
  return new Promise((resolve, reject) => {
    const vaultAddr = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
    const req = http.request(new URL(`${vaultAddr}/v1/openclaw_secrets/data/api_keys`), {
      headers: { "X-Vault-Token": process.env.VAULT_TOKEN }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data).data.data);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function runSupabaseQuery(token, query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const req = https.request(`https://api.supabase.com/v1/projects/ujylxmkhychrcvzrlbqx/database/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function createSupabaseUser(serviceKey, email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "reader" }
    });

    const req = https.request("https://ujylxmkhychrcvzrlbqx.supabase.co/auth/v1/admin/users", {
      method: "POST",
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function sendPasswordEmail(toEmail, password, reason) {
  return new Promise((resolve) => {
    const subject = "Tài khoản đọc truyện Cao Võ: Tinh Không của bạn đã được kích hoạt";
    const body = `Chào bạn,\n\nYêu cầu đăng ký đọc truyện của bạn (${reason}) đã hoàn tất thành công!\n\nThông tin đăng nhập của bạn:\n- Trang web: https://ducphan1311.github.io/truyen-cao-vo/\n- Tài khoản: ${toEmail}\n- Mật khẩu: ${password}\n\n*Lưu ý bảo mật:*\n- Hệ thống kích hoạt cơ chế Chống chia sẻ tài khoản (Single Active Session). Nếu bạn đăng nhập ở thiết bị khác, thiết bị cũ sẽ tự động bị đăng xuất ngay lập tức.\n\nChúc bạn có những giây phút đọc truyện vui vẻ!`;

    // Send email via himalaya or node mailer
    const escapedBody = body.replace(/"/g, '\\"');
    const cmd = `printf "%s" "${escapedBody}" | himalaya message send -t "${toEmail}" -s "${subject}"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("Himalaya send mail error:", err.message, stderr);
        resolve(false);
      } else {
        console.log("Email sent successfully to:", toEmail);
        resolve(true);
      }
    });
  });
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// REST Server on local port 20129 to handle Admin Bypass & Registration hooks
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", async () => {
    try {
      const secrets = await getVaultSecrets();
      const token = secrets.SUPABASE_ACCESS_TOKEN;
      const serviceKey = secrets.SERVICE_ROLE_KEY;

      if (req.url === "/api/admin/bypass" && req.method === "POST") {
        const { requestId, adminToken } = JSON.parse(body);
        // Verify admin token if provided, or verify via service
        const q = `SELECT * FROM public.registration_requests WHERE id = '${requestId}';`;
        const requests = await runSupabaseQuery(token, q);
        if (!requests || requests.length === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Request not found" }));
        }

        const target = requests[0];
        const newPassword = generatePassword();

        // 1. Create or update user in Supabase Auth
        await createSupabaseUser(serviceKey, target.email, newPassword);

        // 2. Update request status
        const updateQ = `UPDATE public.registration_requests SET status = 'bypassed_by_admin', generated_password = '${newPassword}', updated_at = now() WHERE id = '${requestId}';`;
        await runSupabaseQuery(token, updateQ);

        // 3. Send email to user
        await sendPasswordEmail(target.email, newPassword, "Được Admin duyệt trực tiếp");

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: true, password: newPassword }));
      }

      if (req.url === "/api/register" && req.method === "POST") {
        const { email } = JSON.parse(body);
        if (!email) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing email" }));
        }

        // Check settings
        const settingsRes = await runSupabaseQuery(token, "SELECT value FROM public.system_settings WHERE key = 'registration_fee';");
        const setting = settingsRes && settingsRes[0] ? settingsRes[0].value : { amount: 100000, bypass_all: false };

        const paymentCode = "CV" + Math.floor(100000 + Math.random() * 900000);

        if (setting.bypass_all) {
          // Bypass immediately
          const newPassword = generatePassword();
          await createSupabaseUser(serviceKey, email, newPassword);
          const insQ = `INSERT INTO public.registration_requests (email, amount_expected, payment_code, status, generated_password) VALUES ('${email}', ${setting.amount}, '${paymentCode}', 'bypassed_by_admin', '${newPassword}') ON CONFLICT (email) DO UPDATE SET status = 'bypassed_by_admin', generated_password = '${newPassword}';`;
          await runSupabaseQuery(token, insQ);
          await sendPasswordEmail(email, newPassword, "Hệ thống tự động mở quyền đọc miễn phí");

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ status: "bypassed", email }));
        } else {
          // Require payment
          const insQ = `INSERT INTO public.registration_requests (email, amount_expected, payment_code, status) VALUES ('${email}', ${setting.amount}, '${paymentCode}', 'pending_payment') ON CONFLICT (email) DO NOTHING RETURNING *;`;
          const insRes = await runSupabaseQuery(token, insQ);
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ status: "pending_payment", amount: setting.amount, paymentCode }));
        }
      }

      res.writeHead(404);
      res.end();
    } catch (err) {
      console.error("API error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(20129, () => {
  console.log("Local Backend Service for Auth & Paywall running on http://127.0.0.1:20129");
});
