const fs = require("fs");
const path = require("path");
const http = require("http");

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

async function build() {
  const secrets = await getVaultSecrets();
  const anonKey = secrets.ANON_PUBLIC_KEY;
  const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, "all_polished.json"), "utf8"));

  const html = `<!DOCTYPE html>
<html lang="vi" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cao Võ: Từ Giết Gà Bắt Đầu Quét Ngang Tinh Không</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    :root {
      --bg: #0b0d14;
      --card-bg: #131622;
      --text: #e2e8f0;
      --text-muted: #8492a6;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.15);
      --border: #1e2436;
      --gold: #f59e0b;
      --gold-glow: rgba(245, 158, 11, 0.15);
      --green: #10b981;
      --red: #ef4444;
      --sidebar-w: 320px;
    }

    [data-theme="light"] {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --accent: #0284c7;
      --accent-glow: rgba(2, 132, 199, 0.12);
      --border: #e2e8f0;
      --gold: #d97706;
      --gold-glow: rgba(217, 119, 6, 0.1);
    }

    [data-theme="sepia"] {
      --bg: #f4ecd8;
      --card-bg: #eadeb8;
      --text: #433422;
      --text-muted: #79664f;
      --accent: #9a3412;
      --accent-glow: rgba(154, 52, 18, 0.12);
      --border: #d7c9a6;
      --gold: #b45309;
      --gold-glow: rgba(180, 83, 9, 0.1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    /* CẤM CHỌN CHỮ VÀ BÔI ĐEN TOÀN DIỆN */
    body, html, * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }

    /* VÔ HIỆU HÓA IN ẤN */
    @media print {
      body { display: none !important; }
    }

    body {
      font-family: 'Merriweather', Georgia, serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.9;
      font-size: 18.5px;
      transition: background 0.3s, color 0.3s;
      min-height: 100vh;
      display: flex;
    }

    /* Sidebar Navigation */
    #sidebar {
      width: var(--sidebar-w);
      background: var(--card-bg);
      border-right: 1px solid var(--border);
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 50;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @media (max-width: 900px) {
      #sidebar { transform: translateX(-100%); }
      #sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.6); }
    }

    .sidebar-header {
      padding: 24px 20px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .novel-badge {
      font-family: 'Nunito', sans-serif;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent);
      font-weight: 700;
    }

    .novel-title {
      font-family: 'Cinzel', serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--gold);
      line-height: 1.35;
    }

    .chapter-search {
      margin-top: 6px;
      padding: 9px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 14px;
      font-family: 'Nunito', sans-serif;
      outline: none;
      -webkit-user-select: text !important;
      user-select: text !important;
    }

    .chapter-list {
      flex: 1;
      overflow-y: auto;
      list-style: none;
      padding: 10px 0;
    }

    .chapter-item {
      padding: 14px 20px;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 3px;
      border-left: 3px solid transparent;
      transition: all 0.2s;
    }
    .chapter-item:hover { background: var(--accent-glow); color: var(--accent); }
    .chapter-item.active { border-left-color: var(--accent); background: var(--accent-glow); color: var(--accent); font-weight: 700; }
    .chap-meta { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }

    /* Main Content */
    #main-wrapper {
      flex: 1;
      margin-left: var(--sidebar-w);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    @media (max-width: 900px) { #main-wrapper { margin-left: 0; } }

    header.top-bar {
      position: sticky;
      top: 0;
      z-index: 40;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(12px);
    }

    .left-controls { display: flex; align-items: center; gap: 12px; }
    .btn-action {
      background: none;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13.5px;
      font-family: 'Nunito', sans-serif;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-action:hover { border-color: var(--accent); color: var(--accent); }
    .btn-primary { background: var(--accent); color: #000; border-color: var(--accent); }
    .btn-primary:hover { opacity: 0.9; color: #000; }

    .theme-selector {
      display: flex;
      gap: 4px;
      background: var(--bg);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .theme-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-family: 'Nunito', sans-serif;
    }
    .theme-btn.active { background: var(--card-bg); color: var(--accent); font-weight: 700; }

    .right-controls { display: flex; align-items: center; gap: 10px; }

    /* Reader Container */
    #reader-container {
      max-width: 820px;
      width: 100%;
      margin: 0 auto;
      padding: 48px 24px 80px;
      position: relative;
    }

    .chapter-hero {
      text-align: center;
      margin-bottom: 44px;
      padding-bottom: 32px;
      border-bottom: 1px dashed var(--border);
    }
    .badge-universe {
      display: inline-block;
      padding: 5px 14px;
      background: var(--gold-glow);
      color: var(--gold);
      border-radius: 20px;
      font-family: 'Nunito', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 18px;
      text-transform: uppercase;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    h1.chapter-title {
      font-family: 'Cinzel', serif;
      font-size: 27px;
      color: var(--text);
      line-height: 1.45;
      margin-bottom: 14px;
    }
    .chapter-meta { font-family: 'Nunito', sans-serif; font-size: 13.5px; color: var(--text-muted); }

    .novel-body p {
      margin-bottom: 1.6em;
      text-align: justify;
      text-indent: 1.8em;
      position: relative;
    }
    .novel-body p:first-of-type { text-indent: 0; }
    .novel-body p:first-of-type::first-letter {
      font-family: 'Cinzel', serif;
      font-size: 3.4em;
      float: left;
      line-height: 0.8;
      padding-right: 12px;
      color: var(--gold);
    }

    /* Paywall Protection */
    .paywall-overlay {
      position: relative;
      margin-top: 20px;
      padding: 40px 24px;
      background: linear-gradient(to bottom, transparent, var(--card-bg) 70%);
      border: 1px solid var(--border);
      border-radius: 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .paywall-title {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      color: var(--gold);
    }
    .paywall-desc {
      font-family: 'Nunito', sans-serif;
      font-size: 15px;
      color: var(--text-muted);
      max-width: 500px;
      line-height: 1.6;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-backdrop.open { display: flex; }
    .modal-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      padding: 28px;
      position: relative;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .modal-card.wide { max-width: 850px; }
    .modal-close {
      position: absolute;
      top: 18px;
      right: 18px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 20px;
    }
    .modal-header h3 { font-family: 'Cinzel', serif; font-size: 20px; color: var(--gold); margin-bottom: 6px; }
    .modal-header p { font-family: 'Nunito', sans-serif; font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; }

    .form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-family: 'Nunito', sans-serif; font-size: 13.5px; color: var(--text); font-weight: 600; }
    .form-input {
      padding: 10px 14px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-family: 'Nunito', sans-serif;
      font-size: 14.5px;
      outline: none;
      -webkit-user-select: text !important;
      user-select: text !important;
    }
    .form-input:focus { border-color: var(--accent); }
    .form-btn-submit {
      width: 100%;
      padding: 12px;
      background: var(--accent);
      color: #000;
      border: none;
      border-radius: 8px;
      font-family: 'Nunito', sans-serif;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      margin-top: 8px;
    }

    /* Admin Table */
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Nunito', sans-serif;
      font-size: 13.5px;
      margin-top: 14px;
    }
    .admin-table th, .admin-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    .admin-table th { color: var(--text-muted); font-weight: 600; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge.pending { background: rgba(245, 158, 11, 0.2); color: var(--gold); }
    .badge.success { background: rgba(16, 185, 129, 0.2); color: var(--green); }
    .btn-sm-bypass {
      padding: 4px 10px;
      background: var(--green);
      color: #000;
      border: none;
      border-radius: 4px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12px;
    }

    .chapter-nav-footer {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid var(--border);
    }
    .nav-btn {
      flex: 1;
      padding: 14px 20px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      text-align: center;
      cursor: pointer;
      font-family: 'Nunito', sans-serif;
      font-weight: 700;
    }
    .nav-btn:hover:not(:disabled) { background: var(--accent); color: #000; border-color: var(--accent); }
    .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* Security Toast Notification */
    #security-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(239, 68, 68, 0.95);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 9999;
      transform: translateY(150%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #security-toast.show { transform: translateY(0); }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <aside id="sidebar">
    <div class="sidebar-header">
      <span class="novel-badge">Bản Dịch Chuẩn Văn Học</span>
      <div class="novel-title">CAO VÕ: TỪ GIẾT GÀ BẮT ĐẦU QUÉT NGANG TINH KHÔNG</div>
      <input type="text" id="search-input" class="chapter-search" placeholder="Tìm kiếm chương...">
    </div>
    <ul class="chapter-list" id="chapter-list"></ul>
  </aside>

  <!-- Main Wrapper -->
  <div id="main-wrapper">
    <header class="top-bar">
      <div class="left-controls">
        <button class="btn-action" id="toggle-sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          Mục lục
        </button>
        <div class="theme-selector">
          <button class="theme-btn active" data-set-theme="dark">Tối</button>
          <button class="theme-btn" data-set-theme="sepia">Vàng</button>
          <button class="theme-btn" data-set-theme="light">Sáng</button>
        </div>
      </div>

      <div class="right-controls">
        <!-- Auth Controls -->
        <span id="user-display" style="font-family:'Nunito',sans-serif;font-size:13.5px;color:var(--text-muted);display:none;"></span>
        <button class="btn-action" id="btn-admin-panel" style="display:none;color:var(--gold);border-color:var(--gold);">⚙️ Quản Trị</button>
        <button class="btn-action btn-primary" id="btn-open-register">Đăng Ký Đọc</button>
        <button class="btn-action" id="btn-open-login">Đăng Nhập</button>
        <button class="btn-action" id="btn-logout" style="display:none;">Đăng Xuất</button>
      </div>
    </header>

    <main id="reader-container">
      <div class="chapter-hero">
        <div class="badge-universe">Tinh Vũ Kỷ Nguyên • Cao Võ Tinh Không</div>
        <h1 class="chapter-title" id="display-title">Đang tải chương...</h1>
        <div class="chapter-meta" id="display-meta">Nhân vật chính: Diệp Nhiên • Bản dịch độc quyền bảo mật</div>
      </div>

      <div class="novel-body" id="display-body"></div>

      <!-- Paywall Card (Shows when not authenticated & chapter > 1053) -->
      <div class="paywall-overlay" id="paywall-card" style="display:none;">
        <h2 class="paywall-title">🔒 Nội Dung Dành Cho Độc GiẢ</h2>
        <p class="paywall-desc">Bạn đang đọc thử miễn phí Chương 1053. Để tiếp tục thưởng thức trọn vẹn bản dịch trau chuốt các chương tiếp theo, vui lòng đăng ký tài khoản.</p>
        <div style="display:flex;gap:12px;">
          <button class="btn-action btn-primary" onclick="openRegisterModal()" style="padding:10px 20px;">Đăng Ký Mở Khóa</button>
          <button class="btn-action" onclick="openLoginModal()" style="padding:10px 20px;">Đã Có Mật Khẩu? Đăng Nhập</button>
        </div>
      </div>

      <div class="chapter-nav-footer">
        <button class="nav-btn" id="btn-prev">← Chương trước</button>
        <button class="nav-btn" id="btn-next">Chương sau →</button>
      </div>
    </main>
  </div>

  <!-- Register Modal -->
  <div class="modal-backdrop" id="modal-register">
    <div class="modal-card">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <div class="modal-header">
        <h3>Đăng Ký Đọc Truyện</h3>
        <p>Nhập email để nhận mật khẩu đọc truyện gửi tự động về hòm thư.</p>
      </div>
      <div id="register-step-1">
        <div class="form-group">
          <label class="form-label">Email của bạn:</label>
          <input type="email" id="reg-email" class="form-input" placeholder="tenbanchon@gmail.com" required>
        </div>
        <button class="form-btn-submit" id="btn-submit-reg">Tiếp Tục →</button>
      </div>
      <div id="register-step-2" style="display:none;text-align:center;">
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;">
          <p style="font-family:'Nunito',sans-serif;font-size:14px;color:var(--text-muted);margin-bottom:12px;">Quét mã VietQR bên dưới để thanh toán kích hoạt:</p>
          <img id="qr-code-img" src="" style="width:200px;height:200px;margin:0 auto 12px;border-radius:8px;background:#fff;padding:8px;" alt="VietQR">
          <div style="font-family:'Nunito',sans-serif;font-size:14px;text-align:left;">
            <div>Số tiền: <b id="qr-amount" style="color:var(--gold);">100,000 VND</b></div>
            <div>Nội dung CK: <b id="qr-memo" style="color:var(--accent);">CAV1053</b></div>
          </div>
        </div>
        <p style="font-family:'Nunito',sans-serif;font-size:13px;color:var(--text-muted);">Hệ thống sẽ tự động gửi mật khẩu về email của bạn ngay khi giao dịch được xác nhận hoặc được Admin duyệt.</p>
      </div>
    </div>
  </div>

  <!-- Login Modal -->
  <div class="modal-backdrop" id="modal-login">
    <div class="modal-card">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <div class="modal-header">
        <h3>Đăng Nhập Độc Giả</h3>
        <p>Nhập email và mật khẩu được cấp qua hòm thư của bạn.</p>
      </div>
      <div class="form-group">
        <label class="form-label">Email:</label>
        <input type="email" id="login-email" class="form-input" placeholder="tenbanchon@gmail.com" required>
      </div>
      <div class="form-group">
        <label class="form-label">Mật khẩu:</label>
        <input type="password" id="login-password" class="form-input" placeholder="••••••••" required>
      </div>
      <button class="form-btn-submit" id="btn-submit-login">Đăng Nhập Ngay</button>
    </div>
  </div>

  <!-- Admin Panel Modal -->
  <div class="modal-backdrop" id="modal-admin">
    <div class="modal-card wide">
      <button class="modal-close" onclick="closeModals()">✕</button>
      <div class="modal-header">
        <h3>⚙️ Quản Trị Hệ Thống Đọc Truyện</h3>
        <p>Xem danh sách yêu cầu đăng ký, nạp tiền và cấp quyền Bypass gửi mật khẩu tự động.</p>
      </div>
      <div style="overflow-x:auto;max-height:400px;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Email</th>
              <th>Số tiền</th>
              <th>Mã CK</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody id="admin-req-list">
            <tr><td colspan="6" style="text-align:center;">Đang tải dữ liệu...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Security Toast -->
  <div id="security-toast">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <span id="security-msg">Bản dịch được bảo vệ bản quyền. Nghiêm cấm sao chép!</span>
  </div>

  <script>
    // Supabase Configuration
    const SUPABASE_URL = "https://ujylxmkhychrcvzrlbqx.supabase.co";
    const SUPABASE_ANON_KEY = "${anonKey}";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const CHAPTERS = ${JSON.stringify(chapters)};
    let currentIndex = 0;
    let currentUser = null;
    let currentProfile = null;
    let mySessionToken = localStorage.getItem('novel_session_token');
    if (!mySessionToken) {
      mySessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('novel_session_token', mySessionToken);
    }

    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const chapterListEl = document.getElementById('chapter-list');
    const displayTitle = document.getElementById('display-title');
    const displayBody = document.getElementById('display-body');
    const paywallCard = document.getElementById('paywall-card');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const userDisplay = document.getElementById('user-display');
    const btnAdminPanel = document.getElementById('btn-admin-panel');
    const btnOpenRegister = document.getElementById('btn-open-register');
    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnLogout = document.getElementById('btn-logout');
    const securityToast = document.getElementById('security-toast');

    function showSecurityToast(msg) {
      document.getElementById('security-msg').textContent = msg || 'Bản quyền nội dung thuộc về tác quyền. Nghiêm cấm sao chép!';
      securityToast.classList.add('show');
      setTimeout(() => securityToast.classList.remove('show'), 2500);
    }

    // ==========================================
    // 🛡️ ANTI-COPY & ANTI-SCRAPE SECURITY LAYER
    // ==========================================

    // 1. Chặn chuột phải (Context Menu)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showSecurityToast('Chuột phải đã bị vô hiệu hóa để bảo vệ bản quyền tác phẩm!');
      return false;
    });

    // 2. Chặn các phím tắt copy, select all, print, save web, view source, devtools
    document.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl/Cmd + C, A, X, S, P, U
      if (isCmdOrCtrl && ['c', 'a', 'x', 's', 'p', 'u'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('Thao tác sao chép / in ấn / lưu trữ bị vô hiệu hóa!');
        return false;
      }

      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect / DevTools)
      if (e.keyCode === 123 || (isCmdOrCtrl && e.shiftKey && ['i', 'j', 'c'].includes(key))) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('Truy cập công cụ nhà phát triển đã bị chặn!');
        return false;
      }
    }, true);

    // 3. Ghi đè Clipboard nếu cố tình copy qua bất kỳ cơ chế nào
    document.addEventListener('copy', (e) => {
      const userTag = currentUser ? (' [Reader: ' + currentUser.email + ']') : '';
      const notice = 'Tác phẩm dịch độc quyền: Cao Võ: Từ Giết Gà Bắt Đầu Quét Ngang Tinh Không' + userTag + '. Nghiêm cấm mọi hành vi sao chép, trích xuất và phân phối lại trái phép!';
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', notice);
      } else if (window.clipboardData) {
        window.clipboardData.setData('Text', notice);
      }
      e.preventDefault();
      showSecurityToast('Nội dung đã được mã hóa bản quyền!');
    });

    // 4. Debugger Trap (Bẫy Console khựng lại ngay khi cố tình mở DevTools)
    (function antiDevTools() {
      function trap() {
        (function() {
          return false;
        }["constructor"]("debugger")());
      }
      setInterval(trap, 350);
    })();

    // 5. Thủy ấn vô hình (Zero-Width Steganography) nhúng Email độc giả
    function injectInvisibleWatermark(paragraph, userIdentifier) {
      if (!userIdentifier) return paragraph;
      try {
        const binary = Array.from(new TextEncoder().encode(userIdentifier))
          .map(b => b.toString(2).padStart(8, '0'))
          .join('');
        // Map 0 -> \u200B (ZWSP), 1 -> \u200C (ZWNJ), delimiter -> \u200D (ZWJ)
        const zwTag = '\u200D' + Array.from(binary).map(b => b === '1' ? '\u200C' : '\u200B').join('') + '\u200D';
        const spaceIdx = paragraph.indexOf(' ');
        if (spaceIdx !== -1) {
          return paragraph.slice(0, spaceIdx) + zwTag + paragraph.slice(spaceIdx);
        }
      } catch (err) {
        console.error("Watermark injection err:", err);
      }
      return paragraph;
    }

    // === ACCOUNT SHARING SECURITY CHECK ===
    async function enforceSingleActiveSession() {
      if (!currentUser) return;
      try {
        const { data, error } = await supabaseClient.rpc('validate_and_refresh_session', {
          p_session_token: mySessionToken
        });
        if (data && data.valid === false && data.reason === 'session_overridden') {
          alert('⚠️ CẢNH BÁO BẢO MẬT: Tài khoản của bạn vừa đăng nhập ở một thiết bị hoặc trình duyệt khác! Bạn sẽ bị đăng xuất ngay lập tức để bảo vệ tài khoản.');
          await supabaseClient.auth.signOut();
          location.reload();
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    }
    setInterval(enforceSingleActiveSession, 15000);

    // Render Chapters List
    function renderChapterList(items) {
      chapterListEl.innerHTML = '';
      items.forEach((c) => {
        const li = document.createElement('li');
        li.className = 'chapter-item' + (c.originalIndex === currentIndex ? ' active' : '');
        li.innerHTML = \`
          <span class="chap-meta">Chương \${c.num}</span>
          <span class="chap-title">\${c.title}</span>
        \`;
        li.onclick = () => {
          loadChapter(c.originalIndex);
          if (window.innerWidth <= 900) sidebar.classList.remove('open');
        };
        chapterListEl.appendChild(li);
      });
    }

    // Load Chapter with Security Check
    async function loadChapter(idx) {
      if (idx < 0 || idx >= CHAPTERS.length) return;
      currentIndex = idx;
      const c = CHAPTERS[idx];

      displayTitle.textContent = \`Chương \${c.num}: \${c.title}\`;

      // Allow Chapter 1053 free reading, require auth for subsequent chapters
      const isFreeChapter = c.num === 1053;
      const isAuthenticated = currentUser !== null;

      if (!isFreeChapter && !isAuthenticated) {
        // Show Paywall
        displayBody.innerHTML = '';
        paywallCard.style.display = 'flex';
      } else {
        // Authenticated or Free
        paywallCard.style.display = 'none';
        const paragraphs = c.content.split(/\\n\\n+/).filter(p => p.trim().length > 0);
        
        // Render paragraphs with invisible watermark
        const readerEmail = currentUser ? currentUser.email : 'public_trial';
        displayBody.innerHTML = paragraphs.map(p => {
          const secureParagraph = injectInvisibleWatermark(p.trim(), readerEmail);
          return \`<p>\${secureParagraph}</p>\`;
        }).join('');

        if (isAuthenticated) enforceSingleActiveSession();
      }

      btnPrev.disabled = idx === 0;
      btnNext.disabled = idx === CHAPTERS.length - 1;

      document.querySelectorAll('.chapter-item').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Modal Handlers
    function openRegisterModal() { document.getElementById('modal-register').classList.add('open'); }
    function openLoginModal() { document.getElementById('modal-login').classList.add('open'); }
    function closeModals() { document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open')); }

    btnOpenRegister.onclick = openRegisterModal;
    btnOpenLogin.onclick = openLoginModal;

    // Register Form Submit
    document.getElementById('btn-submit-reg').onclick = async () => {
      const email = document.getElementById('reg-email').value.trim();
      if (!email || !email.includes('@')) return alert('Vui lòng nhập email hợp lệ!');

      const btn = document.getElementById('btn-submit-reg');
      btn.textContent = 'Đang xử lý...';
      btn.disabled = true;

      try {
        const paymentCode = 'CV' + Math.floor(100000 + Math.random() * 900000);
        const { data, error } = await supabaseClient
          .from('registration_requests')
          .insert([{ email, amount_expected: 100000, payment_code: paymentCode, status: 'pending_payment' }])
          .select();

        // Show QR
        document.getElementById('register-step-1').style.display = 'none';
        document.getElementById('register-step-2').style.display = 'block';
        document.getElementById('qr-memo').textContent = paymentCode;
        const qrUrl = \`https://img.vietqr.io/image/970422-0988888888-compact2.png?amount=100000&addInfo=\${paymentCode}&accountName=TRUYEN%20CAO%20VO\`;
        document.getElementById('qr-code-img').src = qrUrl;
      } catch (err) {
        alert('Có lỗi xảy ra: ' + err.message);
      } finally {
        btn.textContent = 'Tiếp Tục →';
        btn.disabled = false;
      }
    };

    // Login Form Submit
    document.getElementById('btn-submit-login').onclick = async () => {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      if (!email || !password) return alert('Vui lòng nhập đầy đủ email và mật khẩu!');

      const btn = document.getElementById('btn-submit-login');
      btn.textContent = 'Đang kiểm tra...';
      btn.disabled = true;

      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        alert('Đăng nhập thất bại: ' + error.message);
        btn.textContent = 'Đăng Nhập Ngay';
        btn.disabled = false;
      } else {
        closeModals();
        await refreshAuthState();
        loadChapter(currentIndex);
      }
    };

    // Logout
    btnLogout.onclick = async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    };

    // Refresh Auth State
    async function refreshAuthState() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        currentUser = session.user;
        userDisplay.style.display = 'inline-block';
        userDisplay.textContent = currentUser.email;
        btnOpenRegister.style.display = 'none';
        btnOpenLogin.style.display = 'none';
        btnLogout.style.display = 'inline-flex';

        // Fetch user profile
        const { data: profile } = await supabaseClient.from('user_profiles').select('*').eq('id', currentUser.id).single();
        if (profile) {
          currentProfile = profile;
          if (profile.role === 'admin') {
            btnAdminPanel.style.display = 'inline-flex';
          }
        }
        await enforceSingleActiveSession();
      } else {
        currentUser = null;
        currentProfile = null;
        userDisplay.style.display = 'none';
        btnAdminPanel.style.display = 'none';
        btnOpenRegister.style.display = 'inline-flex';
        btnOpenLogin.style.display = 'inline-flex';
        btnLogout.style.display = 'none';
      }
    }

    // Admin Panel Load
    btnAdminPanel.onclick = async () => {
      document.getElementById('modal-admin').classList.add('open');
      const tbody = document.getElementById('admin-req-list');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải danh sách...</td></tr>';

      const { data, error } = await supabaseClient.rpc('admin_get_registrations');
      if (error) {
        tbody.innerHTML = \`<tr><td colspan="6" style="color:var(--red);text-align:center;">Lỗi: \${error.message}</td></tr>\`;
        return;
      }

      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có yêu cầu đăng ký nào.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(r => {
        const isBypassed = r.status === 'bypassed_by_admin' || r.status === 'paid_completed';
        return \`
          <tr>
            <td>\${new Date(r.created_at).toLocaleString('vi-VN')}</td>
            <td><b>\${r.email}</b></td>
            <td>\${Number(r.amount_expected).toLocaleString()} đ</td>
            <td><code style="color:var(--accent);">\${r.payment_code}</code></td>
            <td>
              <span class="badge \${isBypassed ? 'success' : 'pending'}">
                \${r.status === 'pending_payment' ? 'Chưa Nạp' : (r.status === 'bypassed_by_admin' ? 'Đã Bypass' : 'Đã Nạp')}
              </span>
            </td>
            <td>
              \${!isBypassed ? \`<button class="btn-sm-bypass" onclick="adminBypass('\${r.id}')">Bypass & Gửi Pass</button>\` : '<span style="color:var(--green);font-size:12px;">✓ Đã Cấp</span>'}
            </td>
          </tr>
        \`;
      }).join('');
    };

    window.adminBypass = async (id) => {
      if (!confirm('Bạn có chắc chắn muốn cho tài khoản này Bypass nạp tiền và cấp quyền đọc ngay lập tức?')) return;
      try {
        const res = await fetch('http://127.0.0.1:20129/api/admin/bypass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: id })
        });
        const json = await res.json();
        if (json.success) {
          alert('Đã cấp quyền Bypass thành công! Mật khẩu tự động đã được gửi về email của độc giả.');
          btnAdminPanel.click();
        } else {
          alert('Lỗi: ' + json.error);
        }
      } catch (e) {
        alert('Không kết nối được backend service: ' + e.message);
      }
    };

    // Theme selector
    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.onclick = () => {
        const theme = btn.getAttribute('data-set-theme');
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('[data-set-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    document.getElementById('toggle-sidebar').onclick = () => sidebar.classList.toggle('open');
    btnPrev.onclick = () => loadChapter(currentIndex - 1);
    btnNext.onclick = () => loadChapter(currentIndex + 1);

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = CHAPTERS.map((c, i) => ({ ...c, originalIndex: i }))
        .filter(c => c.title.toLowerCase().includes(q) || c.num.toString().includes(q));
      renderChapterList(filtered);
    });

    // Init
    (async () => {
      renderChapterList(CHAPTERS.map((c, i) => ({ ...c, originalIndex: i })));
      await refreshAuthState();
      loadChapter(0);
    })();
  </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, "index.html"), html);
  console.log("Successfully updated index.html with comprehensive Anti-Copy & Anti-Scraping protection!");
}

build();
