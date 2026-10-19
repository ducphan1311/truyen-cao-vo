const fs = require("fs");
const path = require("path");

const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, "all_translated.json"), "utf8"));

const htmlTemplate = `<!DOCTYPE html>
<html lang="vi" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cao Võ: Từ Giết Gà Bắt Đầu Quét Ngang Tinh Không</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f111a;
      --card-bg: #161926;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --border: #23293e;
      --gold: #f59e0b;
      --sidebar-w: 320px;
    }

    [data-theme="light"] {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --accent: #0284c7;
      --accent-glow: rgba(2, 132, 199, 0.15);
      --border: #e2e8f0;
      --gold: #d97706;
    }

    [data-theme="sepia"] {
      --bg: #f4ecd8;
      --card-bg: #eadeb8;
      --text: #433422;
      --text-muted: #79664f;
      --accent: #9a3412;
      --accent-glow: rgba(154, 52, 18, 0.15);
      --border: #d7c9a6;
      --gold: #b45309;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Merriweather', Georgia, serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.85;
      font-size: 18px;
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
      #sidebar {
        transform: translateX(-100%);
      }
      #sidebar.open {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(0,0,0,0.5);
      }
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .novel-title {
      font-family: 'Cinzel', serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--gold);
      line-height: 1.3;
      letter-spacing: 0.5px;
    }

    .chapter-search {
      margin-top: 8px;
      padding: 8px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-size: 14px;
      font-family: 'Nunito', sans-serif;
      outline: none;
    }
    .chapter-search:focus {
      border-color: var(--accent);
    }

    .chapter-list {
      flex: 1;
      overflow-y: auto;
      list-style: none;
      padding: 10px 0;
    }

    .chapter-item {
      padding: 12px 20px;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-left: 3px solid transparent;
      transition: all 0.2s;
    }

    .chapter-item:hover {
      background: var(--accent-glow);
      color: var(--accent);
    }

    .chapter-item.active {
      border-left-color: var(--accent);
      background: var(--accent-glow);
      color: var(--accent);
      font-weight: 700;
    }

    .chap-meta {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Main Content Area */
    #main-wrapper {
      flex: 1;
      margin-left: var(--sidebar-w);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    @media (max-width: 900px) {
      #main-wrapper {
        margin-left: 0;
      }
    }

    /* Top Control Bar */
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
      backdrop-filter: blur(10px);
    }

    .left-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-toggle-menu {
      background: none;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-family: 'Nunito', sans-serif;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .theme-selector {
      display: flex;
      gap: 6px;
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

    .theme-btn.active {
      background: var(--card-bg);
      color: var(--accent);
      font-weight: 700;
    }

    .font-controls {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .font-btn {
      background: none;
      border: 1px solid var(--border);
      color: var(--text);
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
    }

    /* Reader Container */
    #reader-container {
      max-width: 840px;
      width: 100%;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }

    .chapter-hero {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px dashed var(--border);
    }

    .badge-universe {
      display: inline-block;
      padding: 4px 12px;
      background: var(--accent-glow);
      color: var(--accent);
      border-radius: 20px;
      font-family: 'Nunito', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 16px;
      text-transform: uppercase;
    }

    h1.chapter-title {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      color: var(--text);
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .chapter-meta {
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      color: var(--text-muted);
    }

    /* Paragraph Styling */
    .novel-body p {
      margin-bottom: 1.5em;
      text-align: justify;
      text-indent: 1.8em;
    }

    .novel-body p:first-of-type {
      text-indent: 0;
    }
    .novel-body p:first-of-type::first-letter {
      font-family: 'Cinzel', serif;
      font-size: 3.2em;
      float: left;
      line-height: 0.8;
      padding-right: 10px;
      color: var(--gold);
    }

    /* Navigation Footer */
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
      transition: all 0.2s;
      text-decoration: none;
    }

    .nav-btn:hover:not(:disabled) {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <aside id="sidebar">
    <div class="sidebar-header">
      <div class="novel-title">CAO VÕ: TỪ GIẾT GÀ BẮT ĐẦU QUÉT NGANG TINH KHÔNG</div>
      <input type="text" id="search-input" class="chapter-search" placeholder="Tìm kiếm chương...">
    </div>
    <ul class="chapter-list" id="chapter-list">
      <!-- Chapter Items injected by JS -->
    </ul>
  </aside>

  <!-- Main Content -->
  <div id="main-wrapper">
    <header class="top-bar">
      <div class="left-controls">
        <button class="btn-toggle-menu" id="toggle-sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          Mục lục
        </button>
        <div class="theme-selector">
          <button class="theme-btn active" data-set-theme="dark">Tối</button>
          <button class="theme-btn" data-set-theme="sepia">Vàng</button>
          <button class="theme-btn" data-set-theme="light">Sáng</button>
        </div>
      </div>

      <div class="font-controls">
        <button class="font-btn" id="font-dec">A-</button>
        <button class="font-btn" id="font-inc">A+</button>
      </div>
    </header>

    <main id="reader-container">
      <div class="chapter-hero">
        <div class="badge-universe">Tinh Vũ Kỷ Nguyên • Cao Võ Tinh Không</div>
        <h1 class="chapter-title" id="display-title">Đang tải chương...</h1>
        <div class="chapter-meta" id="display-meta">Nhân vật chính: Diệp Nhiên • Bản dịch hoàn chỉnh</div>
      </div>

      <div class="novel-body" id="display-body">
        <!-- Content will be rendered here -->
      </div>

      <div class="chapter-nav-footer">
        <button class="nav-btn" id="btn-prev">← Chương trước</button>
        <button class="nav-btn" id="btn-next">Chương sau →</button>
      </div>
    </main>
  </div>

  <script>
    const CHAPTERS = ${JSON.stringify(chapters)};
    let currentIndex = 0;
    let currentFontSize = 18;

    const sidebar = document.getElementById('sidebar');
    const chapterListEl = document.getElementById('chapter-list');
    const displayTitle = document.getElementById('display-title');
    const displayBody = document.getElementById('display-body');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const searchInput = document.getElementById('search-input');

    function renderChapterList(items) {
      chapterListEl.innerHTML = '';
      items.forEach((c, idx) => {
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

    function loadChapter(idx) {
      if (idx < 0 || idx >= CHAPTERS.length) return;
      currentIndex = idx;
      const c = CHAPTERS[idx];

      displayTitle.textContent = \`Chương \${c.num}: \${c.title}\`;
      
      // Format paragraphs
      const paragraphs = c.content.split(/\\n\\n+/).filter(p => p.trim().length > 0);
      displayBody.innerHTML = paragraphs.map(p => \`<p>\${p.trim()}</p>\`).join('');

      btnPrev.disabled = idx === 0;
      btnNext.disabled = idx === CHAPTERS.length - 1;

      // Update active in list
      document.querySelectorAll('.chapter-item').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Toggle menu
    document.getElementById('toggle-sidebar').onclick = () => {
      sidebar.classList.toggle('open');
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

    // Font size controls
    document.getElementById('font-inc').onclick = () => {
      if (currentFontSize < 28) {
        currentFontSize += 2;
        document.body.style.fontSize = currentFontSize + 'px';
      }
    };
    document.getElementById('font-dec').onclick = () => {
      if (currentFontSize > 14) {
        currentFontSize -= 2;
        document.body.style.fontSize = currentFontSize + 'px';
      }
    };

    // Navigation buttons
    btnPrev.onclick = () => loadChapter(currentIndex - 1);
    btnNext.onclick = () => loadChapter(currentIndex + 1);

    // Search filter
    searchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = CHAPTERS.map((c, i) => ({ ...c, originalIndex: i }))
        .filter(c => c.num.toString().includes(q) || c.title.toLowerCase().includes(q));
      renderChapterList(filtered);
    };

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') loadChapter(currentIndex - 1);
      if (e.key === 'ArrowRight') loadChapter(currentIndex + 1);
    });

    // Init
    renderChapterList(CHAPTERS.map((c, i) => ({ ...c, originalIndex: i })));
    loadChapter(0);
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, "index.html"), htmlTemplate);
console.log("Generated index.html successfully!");
