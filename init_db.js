const https = require("https");
const http = require("http");

function getSecrets() {
  return new Promise((resolve, reject) => {
    const vaultAddr = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
    const req = http.request(new URL(`${vaultAddr}/v1/openclaw_secrets/data/api_keys`), {
      headers: { "X-Vault-Token": process.env.VAULT_TOKEN }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(JSON.parse(data).data.data));
    });
    req.on("error", reject);
    req.end();
  });
}

function runSql(token, ref, query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const req = https.request(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

const sql = `
-- 1. Bảng cấu hình hệ thống (giá nạp, bật/tắt bypass mặc định)
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null
);

insert into public.system_settings (key, value)
values 
  ('registration_fee', '{"amount": 100000, "bypass_all": false}'::jsonb)
on conflict (key) do nothing;

-- 2. Bảng quản lý yêu cầu đăng ký (Chờ duyệt / Đã thanh toán / Bypass)
create table if not exists public.registration_requests (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  amount_expected numeric default 100000,
  payment_code text unique not null,
  status text default 'pending_payment', -- 'pending_payment', 'paid_completed', 'bypassed_by_admin'
  generated_password text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Bảng profile độc giả & CHỐNG SHARE TÀI KHOẢN (Single Active Session)
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text default 'reader', -- 'admin', 'reader'
  current_session_token text,
  last_active_at timestamp with time zone default now()
);

-- 4. Enable RLS
alter table public.system_settings enable row level security;
alter table public.registration_requests enable row level security;
alter table public.user_profiles enable row level security;

-- Policies
drop policy if exists "Allow public read settings" on public.system_settings;
create policy "Allow public read settings" on public.system_settings for select using (true);

drop policy if exists "Allow public create registration" on public.registration_requests;
create policy "Allow public create registration" on public.registration_requests for insert with check (true);

drop policy if exists "Allow public check status" on public.registration_requests;
create policy "Allow public check status" on public.registration_requests for select using (true);

drop policy if exists "Allow user read own profile" on public.user_profiles;
create policy "Allow user read own profile" on public.user_profiles for select using (auth.uid() = id);

drop policy if exists "Allow user update own session" on public.user_profiles;
create policy "Allow user update own session" on public.user_profiles for update using (auth.uid() = id);
`;

async function main() {
  const secrets = await getSecrets();
  const token = secrets.SUPABASE_ACCESS_TOKEN;
  console.log("Executing SQL schema creation...");
  const res = await runSql(token, "ujylxmkhychrcvzrlbqx", sql);
  console.log("SQL Status:", res.status);
  console.log("Response:", res.data);
}
main();
