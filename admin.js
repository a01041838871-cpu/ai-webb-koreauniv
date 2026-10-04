/* ==========================================================
 *  관리자 화면 (admin.js) — 오른쪽 위 🔒 버튼
 *  사이트·섹션 편집 / 공지 / 수강생 명단 / 수강신청 / 출석 / 과제 / 설정
 *  이 파일은 고칠 필요가 없습니다.
 * ========================================================== */
(function () {
  const S = window.SiteStore;
  if (!S) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o ?? null));
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const SS = { auth: "kuj-admin-auth", tab: "kuj-admin-tab", fail: "kuj-admin-fail" };
  const ss = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  let A = null;            // app.js 가 넘겨주는 값 (세션 날짜 등)
  let loginNext = null;    // 로그인 뒤 바로 열 관리자 탭
  let auth = null;         // 구글 시트 방식에서 서버 확인용 비밀번호 (이 탭에서만 기억)
  const D = { roster: [], enrollments: [], attendance: {}, grades: {}, submissions: [], surveyResponses: [] };
  const DATA_KEYS = Object.keys(D);

  const LOCK_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/></svg>`;

  /* ---------- 공통: 알림, 내려받기, CSV ---------- */
  function toast(msg, type = "ok") {
    let t = $("#admToast");
    if (!t) { t = document.createElement("div"); t.id = "admToast"; document.body.appendChild(t); }
    t.className = "adm-toast show " + type;
    t.textContent = msg;
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }
  // 확인 창 — 브라우저 기본 confirm() 은 앱 안 브라우저 등에서 뜨지 않을 수 있어 화면 안에 직접 띄움
  function ask(msg, okText = "확인") {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "adm-confirm";
      wrap.innerHTML = `<div class="adm-confirm-card" role="alertdialog" aria-modal="true"><p></p>
        <div class="adm-row-end"><button type="button" class="adm-btn ghost" data-a="0">취소</button><button type="button" class="adm-btn primary" data-a="1"></button></div></div>`;
      $("p", wrap).textContent = msg;
      $("[data-a='1']", wrap).textContent = okText;
      const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); done(false); } };
      const done = (v) => { wrap.remove(); document.removeEventListener("keydown", key, true); resolve(v); };
      wrap.addEventListener("click", (e) => {
        if (e.target === wrap) return done(false);
        const b = e.target.closest("[data-a]");
        if (b) done(b.dataset.a === "1");
      });
      document.addEventListener("keydown", key, true);
      document.body.appendChild(wrap);
      $("[data-a='1']", wrap).focus();
    });
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  // 엑셀에서 한글이 깨지지 않도록 BOM 을 붙인 CSV
  function toCSV(rows) {
    const cell = (v) => {
      let s = String(v ?? "");
      if (/^[=+@]/.test(s)) s = "'" + s;                    // 엑셀 수식으로 실행되지 않게
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  }
  const downloadCSV = (name, rows) => download(`${name}_${todayStr()}.csv`, toCSV(rows), "text/csv;charset=utf-8");

  /* ---------- 데이터 불러오기 / 저장 ---------- */
  async function loadData() {
    for (const k of DATA_KEYS) D[k] = await S.get(k, Array.isArray(D[k]) ? [] : {}, auth);
  }
  async function save(key) {
    try { await S.set(key, D[key], auth); return true; }
    catch (e) { toast("저장하지 못했어요: " + e.message, "err"); return false; }
  }
  async function saveSiteConfig(cfg, msg) {
    try {
      await S.saveConfig(cfg, auth);
      toast(msg || "저장했어요. 사이트에 반영합니다…");
      setTimeout(() => location.reload(), 700);
    } catch (e) { toast("저장하지 못했어요: " + e.message, "err"); }
  }
  function exportConfigJs() {
    const cfg = clone(window.SITE_CONFIG);
    cfg.backend = clone(S.fileConfig.backend || { type: "local", url: "" });
    const text = `/* 🌸 사이트 설정 파일 (config.js)\n * 관리자 화면에서 ${new Date().toLocaleString("ko-KR")} 에 내려받은 파일입니다.\n * 서버의 기존 config.js 를 이 파일로 바꾸면 모든 방문자에게 수정 내용이 보입니다.\n * (각 항목 설명은 「사용안내.md」를 참고하세요)\n */\nwindow.SITE_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;
    download("config.js", text, "text/javascript;charset=utf-8");
    toast("config.js 를 내려받았어요");
  }

  /* ---------- 자물쇠 버튼 & 로그인 ---------- */
  function addLockButton() {
    const inner = $(".topbar-inner");
    if (!inner || $(".lock-btn")) return;
    const btn = document.createElement("button");
    btn.className = "lock-btn";
    btn.type = "button";
    btn.title = "관리자";
    btn.setAttribute("aria-label", "관리자 화면 열기");
    btn.innerHTML = LOCK_SVG;
    inner.insertBefore(btn, $("#menuToggle"));
    btn.addEventListener("click", () => (ss.get(SS.auth) ? openAdmin() : openLogin()));
  }

  function openLogin() {
    closeLogin();
    const wrap = document.createElement("div");
    wrap.className = "adm-login";
    wrap.innerHTML = `
      <div class="adm-login-back" data-x></div>
      <form class="adm-login-card" autocomplete="off">
        <button type="button" class="adm-x" data-x aria-label="닫기">×</button>
        <div class="adm-lock-icon">${LOCK_SVG}</div>
        <h3>관리자 로그인</h3>
        <p>관리자 비밀번호를 입력하세요.</p>
        <input type="password" name="pw" placeholder="비밀번호" aria-label="비밀번호" required autofocus>
        <p class="adm-login-err" role="alert"></p>
        <button class="btn primary" type="submit">들어가기</button>
      </form>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("open"));
    $$("[data-x]", wrap).forEach((b) => b.addEventListener("click", closeLogin));
    const form = $("form", wrap), err = $(".adm-login-err", wrap), input = $("input", wrap);
    input.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fail = JSON.parse(ss.get(SS.fail) || '{"n":0,"until":0}');
      if (Date.now() < fail.until) { err.textContent = `잠시 후 다시 시도하세요 (${Math.ceil((fail.until - Date.now()) / 1000)}초)`; return; }
      const cfg = window.SITE_CONFIG.admin || {};
      const btn = $("button[type=submit]", form);
      btn.disabled = true; btn.textContent = "확인 중…";
      await new Promise((r) => setTimeout(r, 30));
      const ok = cfg.passwordHash && S.hashPassword(input.value, cfg.salt, cfg.iterations) === cfg.passwordHash;
      let serverOk = ok;
      if (ok && S.mode === "gas") {
        try { await S.verify(input.value); } catch (ex) { serverOk = false; err.textContent = "서버 확인 실패: " + ex.message; }
      }
      btn.disabled = false; btn.textContent = "들어가기";
      if (ok && serverOk) {
        ss.del(SS.fail);
        auth = input.value;
        ss.set(SS.auth, S.mode === "gas" ? auth : "local");
        closeLogin();
        if (A.renderJoin) A.renderJoin();   // 참여하기의 설문 표에 수정·삭제 버튼 보이기
        openAdmin(loginNext);
        loginNext = null;
      } else {
        fail.n += 1;
        if (fail.n >= 5) { fail.until = Date.now() + 30000; fail.n = 0; }
        ss.set(SS.fail, JSON.stringify(fail));
        if (!ok || serverOk) err.textContent = fail.until > Date.now() ? "5번 틀려서 30초 동안 잠겼어요." : "비밀번호가 맞지 않아요.";   // 서버 오류 문구는 그대로 둠
        input.select();
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      }
    });
  }
  function closeLogin() {
    const w = $(".adm-login");
    if (w) w.remove();
  }

  /* ---------- 관리자 화면 틀 ---------- */
  const TABS = [
    { id: "dash", icon: "🏠", label: "대시보드" },
    { id: "content", icon: "✏️", label: "사이트·섹션 편집" },
    { id: "notice", icon: "📢", label: "공지" },
    { id: "calendar", icon: "📅", label: "수업 달력" },
    { id: "survey", icon: "🗳️", label: "설문" },
    { id: "roster", icon: "👥", label: "수강생 명단" },
    { id: "apply", icon: "📝", label: "수강신청" },
    { id: "attend", icon: "✅", label: "출석" },
    { id: "assign", icon: "📤", label: "과제" },
    { id: "settings", icon: "⚙️", label: "설정" }
  ];
  let current = "dash";

  async function openAdmin(tab) {
    auth = ss.get(SS.auth) === "local" ? null : ss.get(SS.auth);
    let el = $("#adm");
    if (!el) {
      el = document.createElement("div");
      el.id = "adm";
      el.className = "adm";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "관리자 화면");
      el.innerHTML = `
        <header class="adm-top">
          <strong class="adm-title">${LOCK_SVG}<span>관리자 화면</span></strong>
          <span class="adm-mode ${S.mode}">${S.mode === "gas" ? "☁️ 구글 시트 저장" : "💻 이 브라우저 저장"}</span>
          <div class="adm-top-actions">
            <button type="button" class="adm-btn" data-act="close">사이트 보기</button>
            <button type="button" class="adm-btn ghost" data-act="logout">로그아웃</button>
          </div>
        </header>
        <nav class="adm-nav">${TABS.map((t) => `<button type="button" data-tab="${t.id}"><span>${t.icon}</span>${t.label}</button>`).join("")}</nav>
        <main class="adm-main" id="admMain"><p class="adm-loading">불러오는 중…</p></main>`;
      document.body.appendChild(el);
      $("[data-act=close]", el).addEventListener("click", closeAdmin);
      $("[data-act=logout]", el).addEventListener("click", logout);
      $$(".adm-nav button", el).forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
    }
    document.body.classList.add("adm-open");
    el.classList.add("open");
    try { await loadData(); }
    catch (e) { $("#admMain").innerHTML = `<p class="adm-err">데이터를 불러오지 못했어요: ${esc(e.message)}</p>`; return; }
    show(tab || ss.get(SS.tab) || "dash");
  }
  function closeAdmin() {
    const el = $("#adm");
    if (el) el.classList.remove("open");
    document.body.classList.remove("adm-open");
    ss.del(SS.tab);
  }
  function logout() {
    ss.del(SS.auth); ss.del(SS.tab);
    auth = null;
    const el = $("#adm"); if (el) el.remove();
    document.body.classList.remove("adm-open");
    if (A.renderJoin) A.renderJoin();
    toast("로그아웃했어요");
  }
  function show(tab) {
    current = TABS.some((t) => t.id === tab) ? tab : "dash";
    ss.set(SS.tab, current);
    $$(".adm-nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === current));
    const main = $("#admMain");
    main.scrollTop = 0;
    ({ dash, content, notice, calendar, survey, roster, apply, attend, assign, settings })[current](main);
  }
  const panelHead = (title, desc, actions = "") => `
    <div class="adm-head">
      <div><h2>${title}</h2>${desc ? `<p>${desc}</p>` : ""}</div>
      <div class="adm-head-actions">${actions}</div>
    </div>`;
  const localNote = () => S.mode === "local" ? `
    <div class="adm-note">
      💻 지금은 <b>이 브라우저에만 저장</b>하는 방식이에요. 사이트 내용·공지를 모든 방문자에게 보이게 하려면
      <button type="button" class="link-btn" data-export-config>config.js 내려받기</button> 후 서버의 파일을 바꿔 주세요.
      학생 수강신청·과제 제출을 받으려면 「사용안내.md」의 <b>구글 시트 연결</b>을 설정하세요.
    </div>` : "";
  function bindCommon(main) {
    $$("[data-export-config]", main).forEach((b) => b.addEventListener("click", exportConfigJs));
    $$("[data-go]", main).forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));
  }

  /* ========== 1. 대시보드 ========== */
  function dash(main) {
    const sessions = (A.allSessions || []).filter((s) => !s.holiday);
    const today = todayStr();
    const next = sessions.find((s) => s.key >= today);
    const waiting = D.enrollments.filter((e) => (e.status || "대기") === "대기").length;
    const notices = ((window.SITE_CONFIG.notices || {}).items || []).length;
    main.innerHTML = `
      ${panelHead("대시보드", "수업 운영 현황을 한눈에 확인하세요.")}
      ${localNote()}
      <div class="adm-stats">
        <button type="button" class="adm-stat" data-go="roster"><span>👥</span><b>${D.roster.length}</b><small>수강생</small></button>
        <button type="button" class="adm-stat ${waiting ? "alert" : ""}" data-go="apply"><span>📝</span><b>${waiting}</b><small>수강신청 대기</small></button>
        <button type="button" class="adm-stat" data-go="assign"><span>📤</span><b>${D.submissions.length}</b><small>과제 제출</small></button>
        <button type="button" class="adm-stat" data-go="notice"><span>📢</span><b>${notices}</b><small>공지</small></button>
      </div>
      <div class="adm-card">
        <h3>📅 다음 수업</h3>
        ${next ? `<p><b>${next.w.week}주차</b> · ${A.dateLabel(next.date)} ${esc(next.time)} · ${esc(next.place)}<br>${esc(next.topic)}</p>
          <button type="button" class="adm-btn" data-go="attend">출석 체크하러 가기 →</button>` : "<p>남은 수업이 없어요.</p>"}
      </div>
      <div class="adm-card">
        <h3>⚡ 바로가기</h3>
        <div class="adm-quick">
          <button type="button" class="adm-btn" data-go="notice">📢 공지 올리기</button>
          <button type="button" class="adm-btn" data-go="content">✏️ 사이트 내용 고치기</button>
          <button type="button" class="adm-btn ghost" data-export-config>⬇️ config.js 내려받기</button>
          <button type="button" class="adm-btn ghost" id="dashBackup">💾 전체 데이터 백업</button>
        </div>
      </div>`;
    bindCommon(main);
    $("#dashBackup").addEventListener("click", backupAll);
  }

  /* ========== 2. 사이트·섹션 편집 (설정값으로 자동 생성되는 입력 양식) ========== */
  const SECTIONS = [
    { key: "site", label: "사이트 기본 정보" }, { key: "hero", label: "첫 화면" }, { key: "about", label: "프로그램 소개" },
    { key: "course", label: "시대별 탐구" }, { key: "curriculum", label: "커리큘럼 · 일정" }, { key: "guide", label: "수강안내" },
    { key: "faq", label: "FAQ" }, { key: "footer", label: "푸터 (준비물·교수자·연락처)" }, { key: "apply", label: "수강신청서" },
    { key: "banner", label: "맨 위 알림 띠" }, { key: "join", label: "참여하기" }, { key: "myroom", label: "내 강의실" },
    { key: "nav", label: "상단 메뉴" }, { key: "theme", label: "색상 · 분위기" }
  ];
  const LABELS = {
    title: "제목", subtitle: "부제", eyebrow: "작은 머리글(영문)", badge: "배지 문구", titleJp: "일본어 문구", description: "설명",
    buttons: "버튼", label: "이름", href: "링크", style: "모양 (primary / ghost)", info: "정보 카드", icon: "아이콘(이모지)", value: "값",
    sub: "보조 설명", auto: "자동 계산", logoIcon: "로고 아이콘", logoText: "로고 글자", logoSub: "로고 아래 글자",
    overviewTitle: "개요 제목", overview: "과목 개요", goalTitle: "목표 제목", goal: "학습 목표", highlights: "특징 카드", desc: "설명",
    eras: "시대 카드", key: "고유 키(영문, 바꾸지 마세요)", name: "이름", nameJp: "일본어 이름", period: "시기·일시", weeks: "주차",
    summary: "요약", keywords: "키워드", works: "감상 작품", calendarTitle: "달력 제목", listTitle: "목록 제목 ({n}=주차 수)",
    firstClassDate: "⭐ 첫 수업일 (YYYY-MM-DD)", classDays: "수업 요일", day: "요일 (일 월 화 수 목 금 토)", time: "시간", place: "장소",
    holidays: "공휴일·휴강일", date: "날짜 (YYYY-MM-DD)", phases: "단계", jp: "일본어 표기", week: "주차 번호", short: "달력용 짧은 제목",
    topic: "학습 주제", era: "시대 키", material: "수업 자료", activity: "활동", details: "학습내용 설명", videos: "참고영상",
    search: "유튜브 검색어", url: "링크 주소", assignment: "과제", due: "제출 기한", online: "온라인 보강수업", extraSessions: "추가 수업(보강 등)",
    byDay: "요일별 내용", exam: "시험", skip: "수업 없음", type: "종류 (exam = 시험)", evaluation: "평가 비율", evaluationNote: "평가 메모",
    cards: "카드", items: "항목", booksTitle: "참고문헌 제목", books: "참고문헌", author: "저자", publisher: "출판사", year: "출판년도",
    q: "질문", a: "답변", prep: "수강준비물", professor: "교수자", position: "직위", field: "분야", photo: "사진 경로", bio: "소개",
    history: "약력", contact: "연락처", bottomText: "하단 문구", copyright: "저작권 문구", id: "메뉴 id (바꾸지 마세요)",
    pink: "벚꽃 분홍", pinkDeep: "진한 분홍", lavender: "연보라", purple: "진한 보라", cream: "배경색", ink: "글자색",
    petals: "꽃잎 흩날림", petalCount: "꽃잎 개수", intro: "안내 문구", consent: "개인정보 동의 문구", done: "접수 완료 문구",
    show: "보이기", button: "버튼 글자", applyText: "수강신청 카드 설명", myroomText: "내 강의실 카드 설명", showScores: "학생에게 과제 점수 보여주기",
    images: "참고 그림", file: "위키미디어 파일 이름 (File: 뒤 이름)", image: "그림 주소 (직접 입력)", wiki: "위키백과 문서 제목 (일본어)",
    awards: "수상", publications: "저서", papers: "학술논문", articles: "일반논문", listTitles: "목록 제목", when: "시기", journal: "학술지·수록처", note: "비고",
    badgeImages: "배지 양옆 그림", left: "왼쪽", right: "오른쪽", mirrorRight: "오른쪽 좌우반전", text: "내용", online_: "온라인", events: "기타 일정 (📌 특강·답사 등)"
  };
  const LONG_KEYS = ["overview", "goal", "bio", "body", "details", "desc", "a", "description", "summary", "consent", "intro"];
  const OPTIONAL = {
    "curriculum.weeks.*": {
      short: "", details: "", era: "", time: "", place: "", type: "exam",
      assignment: { title: "", desc: "", due: "" },
      online: { title: "", desc: "", period: "", url: "" },
      images: [{ title: "", file: "", wiki: "" }],
      videos: [{ title: "", url: "" }],
      extraSessions: [{ date: "", time: "", place: "온라인", online: true, exam: false, short: "온라인 보강", topic: "", details: "", url: "" }]
    },
    "curriculum": { events: [{ id: "", date: "", title: "", time: "", place: "", details: "", url: "" }] },
    "footer.professor": { nameJp: "", photo: "" }
  };
  const pattern = (path) => path.map((p) => (typeof p === "number" ? "*" : p)).join(".");
  const labelOf = (k) => (typeof k === "number" ? `#${k + 1}` : LABELS[k] || k);
  const itemTitle = (it, i) => {
    if (it === null || typeof it !== "object") return `#${i + 1}`;
    if (it.week !== undefined && it.topic) return `${it.week}주차 · ${it.topic}`;
    return it.title || it.name || it.q || it.label || it.text || (it.date ? `${it.date} ${it.name || ""}` : "") || it.day || `#${i + 1}`;
  };
  function blankLike(v) {
    if (Array.isArray(v)) return [];
    if (v && typeof v === "object") { const o = {}; Object.keys(v).forEach((k) => (o[k] = blankLike(v[k]))); return o; }
    if (typeof v === "number") return 0;
    if (typeof v === "boolean") return false;
    return "";
  }
  const getAt = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);
  const setAt = (obj, path, val) => { const last = path[path.length - 1]; getAt(obj, path.slice(0, -1))[last] = val; };

  let draft = null, draftKey = null;
  const openSet = new Set();

  function content(main) {
    draftKey = draftKey || "site";
    draft = clone(window.SITE_CONFIG[draftKey]);
    main.innerHTML = `
      ${panelHead("사이트·섹션 편집", "섹션을 고르고 내용을 고친 뒤 <b>저장</b>을 누르면 바로 사이트에 반영돼요.",
        `<button type="button" class="adm-btn ghost" data-export-config>⬇️ config.js 내려받기</button>`)}
      ${localNote()}
      <div class="adm-sec-tabs">${SECTIONS.map((s) => `<button type="button" data-sec="${s.key}" class="${s.key === draftKey ? "on" : ""}">${s.label}</button>`).join("")}</div>
      <form class="adm-editor" id="admEditor"></form>
      <div class="adm-savebar">
        <button type="button" class="adm-btn ghost" id="edReset">되돌리기</button>
        <button type="button" class="adm-btn primary" id="edSave">💾 저장하고 사이트에 반영</button>
      </div>`;
    bindCommon(main);
    $$(".adm-sec-tabs button", main).forEach((b) => b.addEventListener("click", () => { draftKey = b.dataset.sec; openSet.clear(); content(main); }));
    $("#edReset").addEventListener("click", () => { draft = clone(window.SITE_CONFIG[draftKey]); drawEditor(); toast("저장 전 상태로 되돌렸어요"); });
    $("#edSave").addEventListener("click", () => {
      const cfg = clone(window.SITE_CONFIG);
      cfg[draftKey] = clone(draft);
      ss.set(SS.tab, "content");
      saveSiteConfig(cfg, "저장했어요. 사이트에 반영합니다…");
    });
    drawEditor();
  }
  function drawEditor() {
    const form = $("#admEditor");
    const scroll = $("#admMain").scrollTop;
    form.innerHTML = "";
    form.appendChild(node(draft, [draftKey], SECTIONS.find((s) => s.key === draftKey).label, true));
    $("#admMain").scrollTop = scroll;
  }
  function node(val, path, label, root) {
    if (Array.isArray(val)) return arrayNode(val, path, label);
    if (val && typeof val === "object") return objectNode(val, path, label, root);
    return leafNode(val, path, label);
  }
  function leafNode(val, path, label) {
    const key = path[path.length - 1];
    const wrap = document.createElement("label");
    wrap.className = "ed-field";
    const name = `<span class="ed-label">${esc(label)}</span>`;
    if (typeof val === "boolean") {
      wrap.classList.add("check");
      wrap.innerHTML = `<input type="checkbox" ${val ? "checked" : ""}>${name}`;
      $("input", wrap).addEventListener("change", (e) => setAt(draft, path.slice(1), e.target.checked));
      return wrap;
    }
    if (typeof val === "number") {
      wrap.innerHTML = `${name}<input type="number" value="${esc(val)}">`;
      $("input", wrap).addEventListener("input", (e) => setAt(draft, path.slice(1), e.target.value === "" ? 0 : Number(e.target.value)));
      return wrap;
    }
    const s = val == null ? "" : String(val);
    if (/^#[0-9a-f]{6}$/i.test(s)) {
      wrap.innerHTML = `${name}<span class="ed-color"><input type="color" value="${esc(s)}"><input type="text" value="${esc(s)}"></span>`;
      const [c, t] = $$("input", wrap);
      c.addEventListener("input", () => { t.value = c.value; setAt(draft, path.slice(1), c.value); });
      t.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(t.value)) c.value = t.value; setAt(draft, path.slice(1), t.value); });
      return wrap;
    }
    const long = LONG_KEYS.includes(key) || s.length > 70 || s.includes("\n");
    wrap.innerHTML = long ? `${name}<textarea rows="${Math.min(8, Math.max(3, Math.ceil(s.length / 60)))}">${esc(s)}</textarea>` : `${name}<input type="text" value="${esc(s)}">`;
    $(long ? "textarea" : "input", wrap).addEventListener("input", (e) => setAt(draft, path.slice(1), e.target.value));
    return wrap;
  }
  function objectNode(obj, path, label, root) {
    const box = document.createElement(root ? "div" : "fieldset");
    box.className = root ? "ed-root" : "ed-obj";
    if (!root) box.innerHTML = `<legend>${esc(label)}</legend>`;
    const opt = OPTIONAL[pattern(path)] || {};
    Object.keys(obj).forEach((k) => {
      const child = node(obj[k], path.concat(k), labelOf(k));
      if (k in opt) {
        const row = document.createElement("div");
        row.className = "ed-optional";
        row.appendChild(child);
        const rm = document.createElement("button");
        rm.type = "button"; rm.className = "ed-mini danger"; rm.textContent = `✕ ${labelOf(k)} 빼기`;
        rm.addEventListener("click", () => { delete getAt(draft, path.slice(1))[k]; drawEditor(); });
        row.appendChild(rm);
        box.appendChild(row);
      } else box.appendChild(child);
    });
    const missing = Object.keys(opt).filter((k) => !(k in obj));
    if (missing.length) {
      const add = document.createElement("div");
      add.className = "ed-addopt";
      add.innerHTML = `<span>＋ 추가:</span>` + missing.map((k) => `<button type="button" class="ed-mini" data-k="${k}">${esc(labelOf(k))}</button>`).join("");
      $$("button", add).forEach((b) => b.addEventListener("click", () => {
        getAt(draft, path.slice(1))[b.dataset.k] = clone(opt[b.dataset.k]);
        drawEditor();
      }));
      box.appendChild(add);
    }
    return box;
  }
  function arrayNode(arr, path, label) {
    const box = document.createElement("div");
    box.className = "ed-arr";
    box.innerHTML = `<div class="ed-arr-head"><span class="ed-label">${esc(label)}</span><small>${arr.length}개</small></div>`;
    const list = document.createElement("div");
    list.className = "ed-arr-list";
    const primitive = arr.every((v) => v === null || typeof v !== "object");
    arr.forEach((item, i) => {
      const ipath = path.concat(i);
      const ctrls = `
        <span class="ed-ctrls">
          <button type="button" class="ed-mini" data-mv="-1" title="위로" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="ed-mini" data-mv="1" title="아래로" ${i === arr.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="ed-mini danger" data-del title="삭제">🗑</button>
        </span>`;
      let row;
      if (primitive) {
        row = document.createElement("div");
        row.className = "ed-prim";
        const f = leafNode(item, ipath, `${i + 1}`);
        row.appendChild(f);
        row.insertAdjacentHTML("beforeend", ctrls);
      } else {
        row = document.createElement("details");
        row.className = "ed-item";
        const id = JSON.stringify(ipath);
        if (openSet.has(id)) row.open = true;
        row.addEventListener("toggle", () => (row.open ? openSet.add(id) : openSet.delete(id)));
        row.innerHTML = `<summary><span class="ed-item-title">${esc(itemTitle(item, i))}</span>${ctrls}</summary>`;
        const body = document.createElement("div");
        body.className = "ed-item-body";
        body.appendChild(node(item, ipath, "", true));
        row.appendChild(body);
      }
      $$("[data-mv]", row).forEach((b) => b.addEventListener("click", (e) => {
        e.preventDefault();
        const a = getAt(draft, path.slice(1)), j = i + Number(b.dataset.mv);
        [a[i], a[j]] = [a[j], a[i]];
        drawEditor();
      }));
      $("[data-del]", row).addEventListener("click", async (e) => {
        e.preventDefault();
        if (!(await ask(`'${itemTitle(item, i)}' 항목을 삭제할까요?`, "삭제"))) return;
        getAt(draft, path.slice(1)).splice(i, 1);
        drawEditor();
      });
      list.appendChild(row);
    });
    box.appendChild(list);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "ed-add";
    add.textContent = `＋ ${label} 추가`;
    add.addEventListener("click", () => {
      const a = getAt(draft, path.slice(1));
      const tpl = a.length ? blankLike(a[a.length - 1]) : "";
      if (tpl && typeof tpl === "object" && "week" in tpl) tpl.week = Math.max(0, ...a.map((x) => Number(x.week) || 0)) + 1;
      if (tpl && typeof tpl === "object" && "id" in tpl && path[path.length - 1] !== "nav") tpl.id = S.uid();
      a.push(tpl);
      if (tpl && typeof tpl === "object") openSet.add(JSON.stringify(path.concat(a.length - 1)));
      drawEditor();
    });
    box.appendChild(add);
    return box;
  }

  /* ========== 3. 공지 ========== */
  function notice(main, editId) {
    const n = window.SITE_CONFIG.notices || { items: [] };
    const items = (n.items || []).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
    const ed = editId ? (n.items || []).find((x) => x.id === editId) : null;
    main.innerHTML = `
      ${panelHead("공지", "공지는 첫 화면 바로 아래 '공지사항'에 보여요. 📌 고정 공지는 맨 위에 나와요.")}
      ${localNote()}
      <form class="adm-card adm-form" id="ntForm">
        <h3>${ed ? "✏️ 공지 수정" : "📢 새 공지 올리기"}</h3>
        <div class="adm-grid2">
          <label class="ed-field"><span class="ed-label">날짜</span><input type="date" name="date" value="${esc(ed ? ed.date : todayStr())}" required></label>
          <label class="ed-field"><span class="ed-label">제목 *</span><input type="text" name="title" value="${esc(ed ? ed.title : "")}" required></label>
        </div>
        <label class="ed-field"><span class="ed-label">내용 *</span><textarea name="body" rows="5" required>${esc(ed ? ed.body : "")}</textarea></label>
        <div class="adm-checks">
          <label><input type="checkbox" name="pinned" ${ed && ed.pinned ? "checked" : ""}> 📌 맨 위에 고정</label>
          <label><input type="checkbox" name="important" ${ed && ed.important ? "checked" : ""}> ❗ 중요 표시</label>
        </div>
        <div class="adm-row-end">
          ${ed ? `<button type="button" class="adm-btn ghost" id="ntCancel">취소</button>` : ""}
          <button type="submit" class="adm-btn primary">${ed ? "수정 저장" : "공지 올리기"}</button>
        </div>
      </form>
      <div class="adm-card">
        <h3>공지 목록 (${items.length})</h3>
        ${items.length ? `<ul class="adm-list">${items.map((it) => `
          <li>
            <div><b>${it.pinned ? "📌 " : ""}${it.important ? '<span class="adm-pill red">중요</span> ' : ""}${esc(it.title)}</b><small>${esc(it.date)}</small><p>${esc(it.body)}</p></div>
            <span class="adm-row-btns"><button type="button" class="adm-btn ghost sm" data-edit="${esc(it.id)}">수정</button><button type="button" class="adm-btn danger sm" data-del="${esc(it.id)}">삭제</button></span>
          </li>`).join("")}</ul>` : "<p class='adm-empty'>아직 공지가 없어요.</p>"}
      </div>`;
    bindCommon(main);
    const saveNotices = (list, msg) => {
      const cfg = clone(window.SITE_CONFIG);
      cfg.notices = Object.assign({ eyebrow: "NOTICE", title: "공지사항", subtitle: "" }, cfg.notices || {}, { items: list });
      ss.set(SS.tab, "notice");
      saveSiteConfig(cfg, msg);
    };
    $("#ntForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      const item = { id: ed ? ed.id : S.uid(), date: f.date, title: f.title.trim(), body: f.body.trim(), pinned: !!f.pinned, important: !!f.important };
      const list = clone(n.items || []);
      if (ed) list[list.findIndex((x) => x.id === ed.id)] = item; else list.push(item);
      saveNotices(list, ed ? "공지를 수정했어요" : "공지를 올렸어요");
    });
    if (ed) $("#ntCancel").addEventListener("click", () => notice(main));
    $$("[data-edit]", main).forEach((b) => b.addEventListener("click", () => notice(main, b.dataset.edit)));
    $$("[data-del]", main).forEach((b) => b.addEventListener("click", async () => {
      const it = n.items.find((x) => x.id === b.dataset.del);
      if (it && (await ask(`'${it.title}' 공지를 삭제할까요?`, "삭제"))) saveNotices(n.items.filter((x) => x.id !== it.id), "공지를 삭제했어요");
    }));
  }

  /* ========== 3-1. 수업 달력 (일정 추가·수정·삭제) ==========
   *  달력은 config.js 의 curriculum 값으로 자동 계산됩니다. 여기서 고치면 아래 값이 바뀌어요.
   *   - 정규 수업 수정 → weeks[n].byDay[요일]   (그 주 그 요일만 바뀜)
   *   - 정규 수업 삭제 → weeks[n].byDay[요일].skip = true   (되살리기 가능)
   *   - 보강·추가 수업·시험 추가 → weeks[n].extraSessions
   *   - 휴강·공휴일 → holidays,  기타 일정(📌) → events */
  const CAL_KINDS = [["class", "📖 수업 · 보강"], ["exam", "📝 시험"], ["holiday", "🌙 휴강 · 공휴일"], ["event", "📌 기타 일정"]];
  function calEntries() {
    const CUR = A.CUR, out = [];
    CUR.weeks.forEach((w) => {
      A.weekSessions(w).forEach((s) => {
        if (s.holiday && !s.extra) return;   // 휴강과 겹친 정규 수업은 휴강 줄에서 함께 보여줌
        out.push({ src: s.extra ? "extra" : "reg", key: s.key, w, s });
      });
      A.regularDates(w).forEach((r) => {
        if (((w.byDay || {})[r.day] || {}).skip) out.push({ src: "skip", key: r.key, w, day: r.day });
      });
    });
    (CUR.holidays || []).forEach((h, i) => {
      if (A.parseDate(h.date)) out.push({ src: "hol", key: h.date, h, i, off: A.allSessions.filter((s) => s.key === h.date && s.holiday) });
    });
    (CUR.events || []).forEach((e, i) => { if (A.parseDate(e.date)) out.push({ src: "evt", key: e.date, e, i }); });
    const rank = { hol: 0, reg: 1, extra: 1, skip: 2, evt: 3 };
    return out.sort((a, b) => a.key.localeCompare(b.key) || rank[a.src] - rank[b.src]);
  }
  function calForm(en) {
    const f = { kind: "class", date: "", week: "", online: false, short: "", topic: "", time: "", place: "", details: "", url: "", name: "", title: "" };
    if (!en) return f;
    if (en.src === "hol") return Object.assign(f, { kind: "holiday", date: en.key, name: en.h.name || "" });
    if (en.src === "evt") return Object.assign(f, { kind: "event", date: en.key, title: en.e.title || "", time: en.e.time || "", place: en.e.place || "", details: en.e.details || "", url: en.e.url || "" });
    const s = en.s;
    return Object.assign(f, { kind: s.exam ? "exam" : "class", date: en.key, week: en.w.week, online: !!s.online, short: s.short, topic: s.topic,
      time: s.time === "-" ? "" : s.time, place: s.place === "-" ? "" : s.place, details: s.details, url: s.url || "" });
  }
  const byDate = (a, b) => String(a.date).localeCompare(String(b.date));
  function tidyByDay(w, day) {
    if (w.byDay && w.byDay[day] && !Object.keys(w.byDay[day]).length) delete w.byDay[day];
    if (w.byDay && !Object.keys(w.byDay).length) delete w.byDay;
  }
  // cur = 고칠 curriculum 사본, en = 지울 항목
  function calRemove(cur, en) {
    const w = en.w && cur.weeks.find((x) => x.week === en.w.week);
    if (en.src === "reg") { w.byDay = w.byDay || {}; w.byDay[en.s.day] = Object.assign({}, w.byDay[en.s.day], { skip: true }); }
    else if (en.src === "extra") { w.extraSessions.splice(en.s.extraIdx, 1); if (!w.extraSessions.length) delete w.extraSessions; }
    else if (en.src === "skip") { delete w.byDay[en.day].skip; tidyByDay(w, en.day); }   // 되살리기
    else if (en.src === "hol") cur.holidays.splice(en.i, 1);
    else if (en.src === "evt") cur.events.splice(en.i, 1);
  }
  function calAdd(cur, f) {
    const pick = (o) => { Object.keys(o).forEach((k) => (o[k] === "" || o[k] === false) && delete o[k]); return o; };
    if (f.kind === "holiday") { (cur.holidays = cur.holidays || []).push({ date: f.date, name: f.name }); cur.holidays.sort(byDate); return; }
    if (f.kind === "event") {
      (cur.events = cur.events || []).push(pick({ id: S.uid(), date: f.date, title: f.title, time: f.time, place: f.place, details: f.details, url: f.url }));
      cur.events.sort(byDate);
      return;
    }
    const w = cur.weeks.find((x) => String(x.week) === String(f.week));
    const exam = f.kind === "exam";
    const reg = !f.online && A.regularDates(w).find((r) => r.key === f.date);
    if (reg) {
      // 정규 수업 날짜 → 그 요일 내용만 바꿈 (기본값과 같은 칸은 저장하지 않아요)
      const def = { short: w.short || w.topic, topic: w.topic, time: w.time || reg.cd.time || "", place: w.place || reg.cd.place || "", details: w.details || "" };
      const o = {};
      Object.keys(def).forEach((k) => { if (f[k] && f[k] !== def[k]) o[k] = f[k]; });
      if (exam !== (w.type === "exam")) o.exam = exam;
      w.byDay = w.byDay || {};
      w.byDay[reg.day] = o;
      tidyByDay(w, reg.day);
    } else {
      const cd = A.CUR.classDays[0] || {};
      (w.extraSessions = w.extraSessions || []).push(pick({
        date: f.date, time: f.time || (f.online ? "" : cd.time || ""), place: f.place || (f.online ? "온라인" : cd.place || ""),
        online: !!f.online, exam, short: f.short || (exam ? "시험" : f.online ? "온라인 보강" : "보강"),
        topic: f.topic || w.topic, details: f.details, url: f.url
      }));
      w.extraSessions.sort(byDate);
    }
  }
  function calendar(main, editIdx) {
    const entries = calEntries();
    const ed = editIdx != null ? entries[editIdx] : null;
    const f = calForm(ed);
    const weeks = A.CUR.weeks;
    const field = (kinds, html) => `<div class="cal-f" data-kinds="${kinds}">${html}</div>`;
    const inp = (name, label, val, attrs = "") => `<label class="ed-field"><span class="ed-label">${label}</span><input name="${name}" value="${esc(val)}" ${attrs}></label>`;
    const row = (en, i) => {
      let pill, title, sub = "", btns = `<button type="button" class="adm-btn ghost sm" data-edit="${i}">수정</button><button type="button" class="adm-btn danger sm" data-del="${i}">삭제</button>`;
      if (en.src === "hol") {
        pill = `<span class="adm-pill gray">${en.h.name.includes("휴강") ? "휴강" : "공휴일"}</span>`;
        title = esc(en.h.name);
        sub = en.off.length ? en.off.map((s) => `${s.w.week}주차 ${s.day}요일 수업 쉼`).join(" · ") : "수업 없는 날";
      } else if (en.src === "evt") {
        pill = `<span class="adm-pill amber">📌 일정</span>`;
        title = esc(en.e.title);
        sub = [en.e.time, en.e.place].filter(Boolean).map(esc).join(" · ");
      } else if (en.src === "skip") {
        pill = `<span class="adm-pill gray">숨김</span>`;
        title = `${en.w.week}주차 ${esc(en.day)}요일 수업 <small class="cal-strike">달력에서 지운 수업</small>`;
        btns = `<button type="button" class="adm-btn sm" data-del="${i}">↩ 되살리기</button>`;
      } else {
        const s = en.s;
        pill = s.exam ? `<span class="adm-pill red">📝 시험</span>` : s.online ? `<span class="adm-pill">💻 온라인</span>` : `<span class="adm-pill green">${en.src === "extra" ? "보강·추가" : "수업"}</span>`;
        title = `${s.w.week}주차 · ${esc(s.short)}`;
        sub = `${esc(s.time)} · ${esc(s.place)}${s.topic && s.topic !== s.short ? ` — ${esc(s.topic)}` : ""}`;
      }
      const d = A.parseDate(en.key);
      return `<li class="${editIdx === i ? "editing" : ""} ${en.src === "skip" ? "muted" : ""}">
        <span class="cal-date">${d.getMonth() + 1}.${d.getDate()}<small>${"일월화수목금토"[d.getDay()]}</small></span>
        <div class="cal-body">${pill} <b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</div>
        <span class="adm-row-btns">${btns}</span></li>`;
    };
    // 월별로 묶어 보여주기
    const groups = [];
    entries.forEach((en, i) => {
      const m = en.key.slice(0, 7);
      if (!groups.length || groups[groups.length - 1].m !== m) groups.push({ m, items: [] });
      groups[groups.length - 1].items.push(row(en, i));
    });

    main.innerHTML = `
      ${panelHead("수업 달력", "커리큘럼의 <b>월간 수업달력</b>에 보이는 일정을 추가·수정·삭제해요. 저장하면 바로 사이트에 반영돼요.")}
      ${localNote()}
      <form class="adm-card adm-form" id="calForm" novalidate>
        <h3>${ed ? "✏️ 일정 수정" : "➕ 일정 추가"}</h3>
        <div class="cal-kinds" role="radiogroup">${CAL_KINDS.map(([k, l]) => `<label><input type="radio" name="kind" value="${k}" ${f.kind === k ? "checked" : ""}><span>${l}</span></label>`).join("")}</div>
        <div class="adm-grid3">
          ${inp("date", "날짜 *", f.date, 'type="date" required')}
          ${field("class exam", `<label class="ed-field"><span class="ed-label">주차 *</span><select name="week">
            <option value="">주차 선택</option>
            ${weeks.map((w) => `<option value="${w.week}" ${String(w.week) === String(f.week) ? "selected" : ""}>${w.week}주차 · ${esc(w.short || w.topic)}</option>`).join("")}
          </select></label>`)}
          ${field("class", `<label class="ed-field check cal-online"><input type="checkbox" name="online" ${f.online ? "checked" : ""}><span class="ed-label">💻 온라인 수업</span></label>`)}
          ${field("holiday", inp("name", "이름 * (예: 개교기념일, 임시 휴강)", f.name))}
          ${field("event", inp("title", "일정 제목 * (예: 박물관 답사)", f.title))}
          ${field("class exam", inp("short", "달력에 보일 짧은 제목", f.short, 'placeholder="예: 보강, 중간고사"'))}
          ${field("class exam event", inp("time", "시간", f.time, `placeholder="${esc((A.CUR.classDays[0] || {}).time || "13:30 ~ 14:45")}"`))}
          ${field("class exam event", inp("place", "장소", f.place, `placeholder="${esc((A.CUR.classDays[0] || {}).place || "")}"`))}
        </div>
        ${field("class exam", inp("topic", "학습 주제", f.topic, 'placeholder="비우면 그 주차 주제"'))}
        ${field("class exam event", `<label class="ed-field"><span class="ed-label">학습내용 · 설명</span><textarea name="details" rows="3">${esc(f.details)}</textarea></label>`)}
        ${field("class event", inp("url", "링크 (온라인 수업 주소 등, 선택)", f.url, 'placeholder="https://"'))}
        <p class="adm-sub cal-hint" id="calHint"></p>
        <div class="adm-row-end">
          ${ed ? `<button type="button" class="adm-btn ghost" id="calCancel">취소</button>` : ""}
          <button type="submit" class="adm-btn primary">${ed ? "수정 저장" : "달력에 추가"}</button>
        </div>
      </form>
      <div class="adm-card">
        <h3>📅 전체 일정 (${entries.filter((e) => e.src !== "skip").length})</h3>
        ${groups.length ? groups.map((g) => `<h4 class="cal-month-title">${g.m.slice(0, 4)}년 ${Number(g.m.slice(5))}월</h4><ul class="adm-list cal-list">${g.items.join("")}</ul>`).join("") : "<p class='adm-empty'>아직 일정이 없어요. ⭐ 첫 수업일을 먼저 정해 주세요.</p>"}
      </div>`;
    bindCommon(main);

    const form = $("#calForm", main);
    const hint = $("#calHint", main);
    const kindOf = () => form.kind.value;
    const sync = () => {
      const k = kindOf();
      $$(".cal-f", form).forEach((el) => (el.hidden = !el.dataset.kinds.split(" ").includes(k)));
      const w = weeks.find((x) => String(x.week) === form.week.value);
      const reg = w && form.date.value && !form.online.checked && A.regularDates(w).find((r) => r.key === form.date.value);
      hint.textContent = k === "holiday" ? "수업 요일과 겹치면 그날 수업이 '휴강'으로 표시돼요. 휴강을 지우면 수업이 다시 보여요."
        : k === "event" ? "📌 수업이 아닌 일정이에요. 출석부에는 들어가지 않아요."
        : reg ? `${w.week}주차 정규 수업일(${reg.day}요일)이에요 — 그날 수업 내용이 바뀌어요.`
        : w && form.date.value ? `${w.week}주차에 정규 요일 밖의 수업(보강·추가 수업)으로 들어가요.` : "";
    };
    // 날짜를 고르면 주차를 자동으로 맞춰 줌
    form.date.addEventListener("change", () => {
      const n = A.weekOfDate(form.date.value);
      if (n && weeks.some((w) => w.week === n)) form.week.value = n;
      sync();
    });
    $$("input[name=kind], select[name=week], input[name=online]", form).forEach((el) => el.addEventListener("change", sync));
    sync();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form).entries());
      v.online = form.online.checked && v.kind === "class";
      Object.keys(v).forEach((k) => typeof v[k] === "string" && (v[k] = v[k].trim()));
      if (!A.parseDate(v.date)) { toast("날짜를 골라 주세요", "err"); return; }
      if ((v.kind === "class" || v.kind === "exam") && !v.week) { toast("주차를 골라 주세요", "err"); return; }
      if (v.kind === "holiday" && !v.name) { toast("휴강·공휴일 이름을 적어 주세요", "err"); return; }
      if (v.kind === "event" && !v.title) { toast("일정 제목을 적어 주세요", "err"); return; }
      if (v.kind === "holiday" && (A.CUR.holidays || []).some((h, i) => h.date === v.date && !(ed && ed.src === "hol" && ed.i === i))) { toast("이 날짜에는 이미 휴강·공휴일이 있어요", "err"); return; }
      // 새로 추가하는 수업이 이미 있는 정규 수업과 겹치면 확인
      if (!ed && (v.kind === "class" || v.kind === "exam") && !v.online) {
        const s = A.allSessions.find((x) => x.key === v.date && !x.extra && String(x.w.week) === String(v.week));
        if (s && !(await ask(`${s.w.week}주차 ${s.day}요일 수업(${s.short})이 이미 있어요. 이 내용으로 바꿀까요?`, "바꾸기"))) return;
      }
      const cfg = clone(window.SITE_CONFIG);
      // 정규 수업을 '휴강'으로 바꾸면 수업은 그대로 두고 휴강만 얹어요 (휴강을 지우면 수업이 돌아옴)
      if (ed && !(ed.src === "reg" && v.kind === "holiday")) calRemove(cfg.curriculum, ed);
      calAdd(cfg.curriculum, v);
      ss.set(SS.tab, "calendar");
      saveSiteConfig(cfg, ed ? "일정을 수정했어요" : "달력에 일정을 추가했어요");
    });
    if (ed) $("#calCancel", main).addEventListener("click", () => calendar(main));
    $$("[data-edit]", main).forEach((b) => b.addEventListener("click", () => { calendar(main, Number(b.dataset.edit)); $("#admMain").scrollTop = 0; }));
    $$("[data-del]", main).forEach((b) => b.addEventListener("click", async () => {
      const en = entries[Number(b.dataset.del)];
      const d = A.dateLabel(A.parseDate(en.key));
      const msg = en.src === "skip" ? null
        : en.src === "reg" ? `${d} ${en.w.week}주차 수업을 달력에서 지울까요?\n(목록 아래에 '숨김'으로 남아 언제든 되살릴 수 있어요)`
        : en.src === "hol" ? `${d} '${en.h.name}'을(를) 지울까요?${en.off.length ? "\n이 날 쉬던 수업이 다시 달력에 보여요." : ""}`
        : `${d} '${en.src === "evt" ? en.e.title : en.s.short}' 일정을 지울까요?`;
      if (msg && !(await ask(msg, "지우기"))) return;
      const cfg = clone(window.SITE_CONFIG);
      calRemove(cfg.curriculum, en);
      ss.set(SS.tab, "calendar");
      saveSiteConfig(cfg, en.src === "skip" ? "수업을 되살렸어요" : "일정을 지웠어요");
    }));
  }

  /* ========== 3-2. 설문 (만들기·수정·삭제·결과) ==========
   *  설문 내용은 config.js 의 surveys.items, 학생 응답은 surveyResponses 에 저장돼요.
   *  응답은 질문마다 a_<질문id> 한 칸 (여러 개 고르기는 줄바꿈으로 묶음) */
  const Q_TYPES = [["single", "하나 고르기"], ["multi", "여러 개 고르기"], ["scale", "1~5점 척도"], ["short", "짧은 답"], ["long", "긴 답"]];
  const MAX_Q = 20;   // 구글 시트 저장 칸 수 제한 때문에 질문은 20개까지
  let svPending = null, svDraft = null;
  const svItems = () => (((window.SITE_CONFIG.surveys || {}).items) || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const svNewQ = (type = "single") => ({ id: S.uid(), type, text: "", options: type === "single" || type === "multi" ? ["", ""] : [], required: true });
  const svBlank = () => ({ id: "", createdAt: "", title: "", description: "", deadline: "", status: "open", collectId: true, questions: [svNewQ()] });
  const svResponses = (id) => D.surveyResponses.filter((r) => r.surveyId === id);
  function saveSurveys(items, msg) {
    const cfg = clone(window.SITE_CONFIG);
    cfg.surveys = Object.assign({ title: "설문" }, cfg.surveys || {}, { items });
    ss.set(SS.tab, "survey");
    saveSiteConfig(cfg, msg);
  }
  async function deleteSurvey(sv) {
    const n = svResponses(sv.id).length;
    if (!(await ask(`'${sv.title}' 설문을 삭제할까요?${n ? `\n받은 응답 ${n}개도 함께 지워져요.` : ""}`, "삭제"))) return;
    if (n) { D.surveyResponses = D.surveyResponses.filter((r) => r.surveyId !== sv.id); if (!(await save("surveyResponses"))) return; }
    saveSurveys(((window.SITE_CONFIG.surveys || {}).items || []).filter((x) => x.id !== sv.id), "설문을 삭제했어요");
  }

  function survey(main, opts) {
    opts = opts || svPending || {};
    svPending = null;
    const items = svItems();
    const editing = opts.action === "new" || opts.action === "edit";
    if (opts.action === "new") svDraft = svBlank();
    else if (opts.action === "edit") { const sv = items.find((x) => x.id === opts.id); svDraft = sv ? clone(sv) : null; }
    else svDraft = null;
    const result = opts.action === "result" && items.find((x) => x.id === opts.id);
    const stPill = (sv) => { const st = A.surveyState(sv); return `<span class="adm-pill ${st.open ? "green" : "gray"}">${st.label}</span>`; };

    main.innerHTML = `
      ${panelHead("설문", "참여하기 섹션 아래 <b>설문 히스토리</b>에 보이는 설문을 만들고 고쳐요. 학생은 <b>열기</b>를 눌러 응답해요.",
        editing ? "" : `<button type="button" class="adm-btn primary" id="svNew">＋ 새 설문 만들기</button>`)}
      ${localNote()}
      ${S.mode === "local" ? `<div class="adm-note">💻 이 브라우저 저장 방식에서는 <b>이 기기에서 받은 응답만</b> 보여요. 학생들의 응답을 모으려면 구글 시트를 연결하세요.</div>` : ""}
      ${editing && svDraft ? `<form class="adm-card adm-form" id="svForm" novalidate></form>` : ""}
      ${result ? svResultHtml(result) : ""}
      <div class="adm-card">
        <h3>🗳️ 설문 히스토리 (${items.length})</h3>
        ${items.length ? `<div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>생성일시</th><th>설문 주제</th><th>상태</th><th>마감일</th><th>응답</th><th>열기</th><th>수정</th><th>삭제</th></tr></thead>
          <tbody>${items.map((sv) => `<tr class="${(opts.id === sv.id && (editing || result)) ? "on" : ""}">
            <td class="nowrap">${A.fmtDT(sv.createdAt)}</td>
            <td class="wrap"><b>${esc(sv.title)}</b><br><small>질문 ${(sv.questions || []).length}개${sv.collectId ? "" : " · 익명"}</small></td>
            <td>${stPill(sv)}</td>
            <td class="nowrap">${esc(sv.deadline || "-")}</td>
            <td><b>${svResponses(sv.id).length}</b></td>
            <td><button type="button" class="adm-btn ghost sm" data-res="${esc(sv.id)}">결과 보기</button></td>
            <td><button type="button" class="adm-btn ghost sm" data-edit="${esc(sv.id)}">수정</button></td>
            <td><button type="button" class="adm-btn danger sm" data-del="${esc(sv.id)}">삭제</button></td>
          </tr>`).join("")}</tbody>
        </table></div>` : `<p class="adm-empty">아직 만든 설문이 없어요. <b>＋ 새 설문 만들기</b>를 눌러 보세요.</p>`}
      </div>`;
    bindCommon(main);
    const nb = $("#svNew", main);
    if (nb) nb.addEventListener("click", () => survey(main, { action: "new" }));
    $$("[data-res]", main).forEach((b) => b.addEventListener("click", () => { survey(main, { action: "result", id: b.dataset.res }); main.scrollTop = 0; }));
    $$("[data-edit]", main).forEach((b) => b.addEventListener("click", () => { survey(main, { action: "edit", id: b.dataset.edit }); main.scrollTop = 0; }));
    $$("[data-del]", main).forEach((b) => b.addEventListener("click", () => deleteSurvey(items.find((x) => x.id === b.dataset.del))));
    if (result) bindSvResult(main, result);
    if (editing && svDraft) drawSvForm(main);
    // 사이트의 '삭제' 버튼으로 들어온 경우
    if (opts.action === "del") { const sv = items.find((x) => x.id === opts.id); if (sv) setTimeout(() => deleteSurvey(sv), 50); }
  }

  function drawSvForm(main) {
    const form = $("#svForm", main);
    const d = svDraft, isNew = !d.id;
    const nRes = isNew ? 0 : svResponses(d.id).length;
    const typeSel = (q) => `<select data-qf="type">${Q_TYPES.map(([k, l]) => `<option value="${k}" ${q.type === k ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    form.innerHTML = `
      <h3>${isNew ? "🗳️ 새 설문 만들기" : "✏️ 설문 수정"}</h3>
      ${nRes ? `<div class="adm-note">이미 받은 응답이 <b>${nRes}개</b> 있어요. 질문을 지우거나 보기를 바꾸면 그 부분의 결과가 달라질 수 있어요.</div>` : ""}
      <label class="ed-field"><span class="ed-label">설문 주제 *</span><input data-f="title" value="${esc(d.title)}" placeholder="예: 3주차 수업 만족도 조사"></label>
      <label class="ed-field"><span class="ed-label">설명 (선택)</span><textarea data-f="description" rows="2" placeholder="설문 목적, 소요 시간 등">${esc(d.description)}</textarea></label>
      <div class="adm-grid3">
        <label class="ed-field"><span class="ed-label">마감일 (선택)</span><input type="date" data-f="deadline" value="${esc(d.deadline)}"></label>
        <label class="ed-field"><span class="ed-label">상태</span><select data-f="status"><option value="open" ${d.status !== "closed" ? "selected" : ""}>진행 중 (응답 받기)</option><option value="closed" ${d.status === "closed" ? "selected" : ""}>마감 (응답 안 받기)</option></select></label>
        <label class="ed-field check sv-anon"><input type="checkbox" data-f="collectId" ${d.collectId ? "checked" : ""}><span class="ed-label">학번·이름 받기 (끄면 익명)</span></label>
      </div>
      <div class="sv-qhead"><h4>질문 (${d.questions.length})</h4><small>최대 ${MAX_Q}개</small></div>
      <div class="sv-qs">${d.questions.map((q, i) => `
        <div class="sv-q" data-i="${i}">
          <div class="sv-q-top">
            <b class="sv-qn">Q${i + 1}</b>
            ${typeSel(q)}
            <label class="sv-req"><input type="checkbox" data-qf="required" ${q.required ? "checked" : ""}> 필수</label>
            <span class="ed-ctrls">
              <button type="button" class="ed-mini" data-qmv="-1" title="위로" ${i === 0 ? "disabled" : ""}>↑</button>
              <button type="button" class="ed-mini" data-qmv="1" title="아래로" ${i === d.questions.length - 1 ? "disabled" : ""}>↓</button>
              <button type="button" class="ed-mini" data-qdup title="복사">⧉</button>
              <button type="button" class="ed-mini danger" data-qdel title="삭제" ${d.questions.length === 1 ? "disabled" : ""}>🗑</button>
            </span>
          </div>
          <input class="sv-qtext" data-qf="text" value="${esc(q.text)}" placeholder="질문 내용을 적어 주세요">
          ${q.type === "single" || q.type === "multi" ? `<div class="sv-opts">
            ${q.options.map((o, j) => `<div class="sv-optrow"><span>${q.type === "single" ? "○" : "☐"}</span><input data-opt="${j}" value="${esc(o)}" placeholder="보기 ${j + 1}"><button type="button" class="ed-mini danger" data-optdel="${j}" title="보기 삭제" ${q.options.length <= 2 ? "disabled" : ""}>✕</button></div>`).join("")}
            <button type="button" class="ed-mini" data-optadd>＋ 보기 추가</button>
          </div>` : q.type === "scale" ? `<p class="adm-sub">1 전혀 아니다 · 2 아니다 · 3 보통이다 · 4 그렇다 · 5 매우 그렇다</p>`
            : `<p class="adm-sub">${q.type === "long" ? "여러 줄로 자유롭게 적는 칸" : "한 줄로 짧게 적는 칸"}</p>`}
        </div>`).join("")}
      </div>
      <button type="button" class="ed-add" id="svAddQ" ${d.questions.length >= MAX_Q ? "disabled" : ""}>＋ 질문 추가</button>
      <div class="adm-row-end">
        <button type="button" class="adm-btn ghost" id="svCancel">취소</button>
        <button type="submit" class="adm-btn primary">${isNew ? "💾 설문 만들기" : "💾 수정 저장"}</button>
      </div>`;

    const qOf = (el) => d.questions[Number(el.closest(".sv-q").dataset.i)];
    const redraw = () => { const y = $("#admMain").scrollTop; drawSvForm(main); $("#admMain").scrollTop = y; };
    $$("[data-f]", form).forEach((el) => el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", () => {
      d[el.dataset.f] = el.type === "checkbox" ? el.checked : el.value;
    }));
    $$("[data-qf]", form).forEach((el) => el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", () => {
      const q = qOf(el);
      if (el.dataset.qf === "type") {
        q.type = el.value;
        if ((q.type === "single" || q.type === "multi") && q.options.length < 2) q.options = q.options.concat(["", ""]).slice(0, Math.max(2, q.options.length));
        redraw();
      } else q[el.dataset.qf] = el.type === "checkbox" ? el.checked : el.value;
    }));
    $$("[data-opt]", form).forEach((el) => el.addEventListener("input", () => (qOf(el).options[Number(el.dataset.opt)] = el.value)));
    $$("[data-optadd]", form).forEach((b) => b.addEventListener("click", () => { qOf(b).options.push(""); redraw(); }));
    $$("[data-optdel]", form).forEach((b) => b.addEventListener("click", () => { qOf(b).options.splice(Number(b.dataset.optdel), 1); redraw(); }));
    $$("[data-qmv]", form).forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.closest(".sv-q").dataset.i), j = i + Number(b.dataset.qmv);
      [d.questions[i], d.questions[j]] = [d.questions[j], d.questions[i]];
      redraw();
    }));
    $$("[data-qdup]", form).forEach((b) => b.addEventListener("click", () => {
      if (d.questions.length >= MAX_Q) { toast(`질문은 ${MAX_Q}개까지 만들 수 있어요`, "err"); return; }
      const i = Number(b.closest(".sv-q").dataset.i);
      d.questions.splice(i + 1, 0, Object.assign(clone(d.questions[i]), { id: S.uid() }));
      redraw();
    }));
    $$("[data-qdel]", form).forEach((b) => b.addEventListener("click", async () => {
      const i = Number(b.closest(".sv-q").dataset.i);
      if (d.questions[i].text && !(await ask(`Q${i + 1} 질문을 지울까요?`, "지우기"))) return;
      d.questions.splice(i, 1);
      redraw();
    }));
    $("#svAddQ", form).addEventListener("click", () => {
      const last = d.questions[d.questions.length - 1];
      d.questions.push(svNewQ(last ? last.type : "single"));
      redraw();
      const qs = $$(".sv-qtext", form); qs[qs.length - 1].focus();
    });
    $("#svCancel", form).addEventListener("click", () => survey(main));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      d.title = String(d.title).trim();
      if (!d.title) { toast("설문 주제를 적어 주세요", "err"); $("[data-f=title]", form).focus(); return; }
      const qs = d.questions.map((q) => Object.assign({}, q, { text: String(q.text).trim(), options: (q.type === "single" || q.type === "multi") ? q.options.map((o) => String(o).trim()).filter(Boolean) : [] }));
      const bad = qs.findIndex((q) => !q.text || ((q.type === "single" || q.type === "multi") && q.options.length < 2));
      if (bad >= 0) { toast(`Q${bad + 1}: ${qs[bad].text ? "보기를 2개 이상 적어 주세요" : "질문 내용을 적어 주세요"}`, "err"); $$(".sv-q", form)[bad].scrollIntoView({ block: "center" }); return; }
      const now = new Date().toISOString();
      const item = Object.assign({}, d, {
        id: d.id || S.uid(), createdAt: d.createdAt || now, description: String(d.description).trim(),
        questions: qs.map((q) => { const o = { id: q.id, type: q.type, text: q.text, required: !!q.required }; if (q.options.length) o.options = q.options; return o; })
      });
      if (!isNew) item.updatedAt = now;
      const list = clone(((window.SITE_CONFIG.surveys || {}).items) || []);
      const at = list.findIndex((x) => x.id === item.id);
      if (at >= 0) list[at] = item; else list.push(item);
      saveSurveys(list, isNew ? "설문을 만들었어요. 참여하기에 보여요" : "설문을 수정했어요");
    });
  }

  // 결과: 고르기·척도는 막대로, 글 답은 목록으로 + 엑셀(CSV)
  function svResultHtml(sv) {
    const rs = svResponses(sv.id).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const n = rs.length;
    const bar = (label, c, total) => { const p = total ? Math.round((c / total) * 100) : 0; return `<div class="sv-bar"><span class="sv-bar-l">${esc(label)}</span><span class="sv-bar-t"><i style="width:${p}%"></i></span><span class="sv-bar-n">${c}명 · ${p}%</span></div>`; };
    const vals = (q) => rs.map((r) => r["a_" + q.id]).filter((v) => v !== undefined && v !== "");
    const block = (q, i) => {
      const v = vals(q);
      let body;
      if (q.type === "single" || q.type === "multi") {
        const picked = v.flatMap((x) => String(x).split("\n"));
        const opts = (q.options || []).concat([...new Set(picked)].filter((x) => !(q.options || []).includes(x)));   // 지금은 없는 옛 보기도 표시
        body = opts.map((o) => bar(o, picked.filter((x) => x === o).length, q.type === "multi" ? v.length : v.length)).join("");
      } else if (q.type === "scale") {
        const nums = v.map(Number).filter((x) => x >= 1 && x <= 5);
        const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "-";
        body = `<p class="sv-avg">평균 <b>${avg}</b> / 5</p>` + [5, 4, 3, 2, 1].map((k) => bar(`${k} ${A.SCALE[k - 1]}`, nums.filter((x) => x === k).length, nums.length)).join("");
      } else {
        body = v.length ? `<ul class="sv-texts">${rs.filter((r) => r["a_" + q.id]).map((r) => `<li>${esc(r["a_" + q.id])}${sv.collectId && r.name ? `<small>— ${esc(r.name)}</small>` : ""}</li>`).join("")}</ul>` : `<p class="adm-sub">아직 답이 없어요.</p>`;
      }
      return `<div class="sv-res-q"><h4>Q${i + 1}. ${esc(q.text)} <small>응답 ${v.length}</small></h4>${body}</div>`;
    };
    return `
      <div class="adm-card sv-result">
        <div class="adm-tablebar">
          <h3>📊 ${esc(sv.title)} — 결과 (응답 ${n}개)</h3>
          <span class="adm-row-btns">
            ${n ? `<button type="button" class="adm-btn ghost sm" id="svCsv">⬇️ 엑셀(CSV)</button>` : ""}
            <button type="button" class="adm-btn ghost sm" id="svResClose">닫기</button>
          </span>
        </div>
        <p class="adm-sub">만든 날 ${A.fmtDT(sv.createdAt)}${sv.deadline ? ` · 마감 ${esc(sv.deadline)}` : ""}${sv.collectId ? "" : " · 익명 설문"}</p>
        ${n ? (sv.questions || []).map(block).join("") : `<p class="adm-empty">아직 받은 응답이 없어요.</p>`}
        ${n && sv.collectId ? `<details class="sv-who"><summary>응답한 학생 (${n}명)</summary>
          <div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>응답 일시</th><th>학번</th><th>이름</th><th></th></tr></thead>
          <tbody>${rs.map((r) => `<tr><td class="nowrap">${A.fmtDT(r.createdAt)}</td><td>${esc(r.sid)}</td><td>${esc(r.name)}</td><td><button type="button" class="adm-btn danger sm" data-rdel="${esc(r.id)}">응답 삭제</button></td></tr>`).join("")}</tbody></table></div>
        </details>` : ""}
      </div>`;
  }
  function bindSvResult(main, sv) {
    $("#svResClose", main).addEventListener("click", () => survey(main));
    const csv = $("#svCsv", main);
    if (csv) csv.addEventListener("click", () => {
      const qs = sv.questions || [];
      const rs = svResponses(sv.id);
      const head = ["응답 일시"].concat(sv.collectId ? ["학번", "이름"] : [], qs.map((q, i) => `Q${i + 1}. ${q.text}`));
      const rows = rs.map((r) => [new Date(r.createdAt).toLocaleString("ko-KR")].concat(sv.collectId ? [r.sid, r.name] : [], qs.map((q) => String(r["a_" + q.id] || "").split("\n").join(", "))));
      downloadCSV(`설문_${sv.title.replace(/[\\/:*?"<>|]/g, "")}`, [head].concat(rows));
    });
    $$("[data-rdel]", main).forEach((b) => b.addEventListener("click", async () => {
      const r = D.surveyResponses.find((x) => x.id === b.dataset.rdel);
      if (!r || !(await ask(`${r.name || "이"} 학생의 응답을 삭제할까요?`, "삭제"))) return;
      D.surveyResponses = D.surveyResponses.filter((x) => x !== r);
      if (await save("surveyResponses")) { toast("응답을 삭제했어요"); survey(main, { action: "result", id: sv.id }); }
    }));
  }

  /* ========== 4. 수강생 명단 ========== */
  const ROSTER_COLS = [["sid", "학번"], ["name", "이름"], ["dept", "학과"], ["year", "학년"], ["email", "이메일"], ["phone", "연락처"], ["memo", "메모"]];
  const sortRoster = () => D.roster.sort((a, b) => String(a.sid).localeCompare(String(b.sid)));
  function upsertStudent(st) {
    st.sid = String(st.sid || "").trim();
    if (!st.sid || !String(st.name || "").trim()) return false;
    const i = D.roster.findIndex((x) => x.sid === st.sid);
    if (i >= 0) D.roster[i] = Object.assign(D.roster[i], st); else D.roster.push(Object.assign({ id: S.uid() }, st));
    return true;
  }
  function roster(main, editSid) {
    sortRoster();
    const ed = editSid ? D.roster.find((x) => x.sid === editSid) : null;
    main.innerHTML = `
      ${panelHead("수강생 명단", "학생을 한 명씩 추가하거나, 엑셀에서 복사해 한꺼번에 붙여넣을 수 있어요.",
        `<button type="button" class="adm-btn ghost" id="rsCsv">⬇️ 엑셀(CSV) 내려받기</button>`)}
      <form class="adm-card adm-form" id="rsForm">
        <h3>${ed ? "✏️ 학생 정보 수정" : "➕ 학생 추가"}</h3>
        <div class="adm-grid3">
          ${ROSTER_COLS.map(([k, l]) => `<label class="ed-field"><span class="ed-label">${l}${k === "sid" || k === "name" ? " *" : ""}</span><input name="${k}" value="${esc(ed ? ed[k] : "")}" ${k === "sid" || k === "name" ? "required" : ""} ${k === "sid" && ed ? "readonly" : ""}></label>`).join("")}
        </div>
        <div class="adm-row-end">
          ${ed ? `<button type="button" class="adm-btn ghost" id="rsCancel">취소</button>` : ""}
          <button type="submit" class="adm-btn primary">${ed ? "수정 저장" : "추가"}</button>
        </div>
      </form>
      <details class="adm-card adm-paste">
        <summary>📋 엑셀에서 여러 명 한꺼번에 붙여넣기</summary>
        <p>엑셀에서 <b>학번 · 이름 · 학과 · 학년 · 이메일 · 연락처</b> 순서의 칸을 복사해 아래에 붙여넣으세요. 첫 줄 제목은 자동으로 건너뛰고, 같은 학번은 새 정보로 바뀝니다.</p>
        <textarea id="rsPaste" rows="5" placeholder="2023123456	홍길동	일어일문학과	3	hong@korea.ac.kr	010-0000-0000"></textarea>
        <div class="adm-row-end"><button type="button" class="adm-btn primary" id="rsPasteBtn">명단에 넣기</button></div>
      </details>
      <div class="adm-card">
        <div class="adm-tablebar"><h3>명단 (${D.roster.length}명)</h3><input type="search" id="rsSearch" placeholder="이름·학번 검색"></div>
        ${D.roster.length ? `<div class="adm-table-wrap"><table class="adm-table" id="rsTable">
          <thead><tr><th>#</th>${ROSTER_COLS.map(([, l]) => `<th>${l}</th>`).join("")}<th></th></tr></thead>
          <tbody>${D.roster.map((s, i) => `<tr data-q="${esc((s.sid + " " + s.name + " " + (s.dept || "")).toLowerCase())}">
            <td>${i + 1}</td>${ROSTER_COLS.map(([k]) => `<td>${esc(s[k])}</td>`).join("")}
            <td class="nowrap"><button type="button" class="adm-btn ghost sm" data-edit="${esc(s.sid)}">수정</button><button type="button" class="adm-btn danger sm" data-del="${esc(s.sid)}">삭제</button></td></tr>`).join("")}</tbody>
        </table></div>` : "<p class='adm-empty'>아직 등록된 학생이 없어요.</p>"}
      </div>`;
    $("#rsForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const st = Object.fromEntries(new FormData(e.target).entries());
      if (!ed && D.roster.some((x) => x.sid === st.sid.trim()) && !(await ask("같은 학번이 이미 있어요. 새 정보로 바꿀까요?", "바꾸기"))) return;
      upsertStudent(st);
      if (await save("roster")) { toast(ed ? "수정했어요" : `${st.name} 학생을 추가했어요`); roster(main); }
    });
    if (ed) $("#rsCancel").addEventListener("click", () => roster(main));
    $("#rsPasteBtn").addEventListener("click", async () => {
      const lines = $("#rsPaste").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let n = 0;
      lines.forEach((line, i) => {
        const c = line.split(line.includes("\t") ? "\t" : ",").map((x) => x.trim().replace(/^"|"$/g, ""));
        if (i === 0 && /학번|sid/i.test(c[0])) return;
        if (upsertStudent({ sid: c[0], name: c[1], dept: c[2] || "", year: c[3] || "", email: c[4] || "", phone: c[5] || "" })) n++;
      });
      if (!n) { toast("넣을 수 있는 줄이 없어요. 학번과 이름이 필요해요", "err"); return; }
      if (await save("roster")) { toast(`${n}명을 명단에 넣었어요`); roster(main); }
    });
    $("#rsCsv").addEventListener("click", () => downloadCSV("수강생명단", [ROSTER_COLS.map(([, l]) => l)].concat(D.roster.map((s) => ROSTER_COLS.map(([k]) => s[k])))));
    const q = $("#rsSearch");
    if (q) q.addEventListener("input", () => $$("#rsTable tbody tr").forEach((tr) => (tr.hidden = !tr.dataset.q.includes(q.value.trim().toLowerCase()))));
    $$("[data-edit]", main).forEach((b) => b.addEventListener("click", () => roster(main, b.dataset.edit)));
    $$("[data-del]", main).forEach((b) => b.addEventListener("click", async () => {
      const s = D.roster.find((x) => x.sid === b.dataset.del);
      if (!s || !(await ask(`${s.name}(${s.sid}) 학생을 명단에서 삭제할까요?\n출석·과제 기록은 남아 있어요.`, "삭제"))) return;
      D.roster = D.roster.filter((x) => x !== s);
      if (await save("roster")) { toast("삭제했어요"); roster(main); }
    }));
  }

  /* ========== 5. 수강신청 내역 ========== */
  const APPLY_COLS = [["createdAt", "신청일시"], ["status", "상태"], ["sid", "학번"], ["name", "이름"], ["dept", "학과"], ["year", "학년"], ["email", "이메일"], ["phone", "연락처"], ["reason", "신청 동기"]];
  const when = (iso) => { const d = new Date(iso); return isNaN(d) ? esc(iso) : d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }); };
  function apply(main, filter = "전체") {
    const list = D.enrollments.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const shown = filter === "전체" ? list : list.filter((e) => (e.status || "대기") === filter);
    const count = (s) => list.filter((e) => (e.status || "대기") === s).length;
    main.innerHTML = `
      ${panelHead("수강신청 내역", "첫 화면 '수강신청' 버튼으로 들어온 신청이에요. <b>승인</b>하면 수강생 명단에 자동으로 추가돼요.",
        `<button type="button" class="adm-btn ghost" id="apCsv">⬇️ 엑셀(CSV) 내려받기</button>`)}
      ${S.mode === "local" ? `<div class="adm-note">💻 이 브라우저 저장 방식에서는 <b>이 기기에서 접수된 신청만</b> 보여요. 학생들의 신청을 모으려면 구글 시트를 연결하세요.</div>` : ""}
      <div class="adm-filter">${["전체", "대기", "승인", "반려"].map((s) => `<button type="button" data-f="${s}" class="${s === filter ? "on" : ""}">${s} <b>${s === "전체" ? list.length : count(s)}</b></button>`).join("")}</div>
      <div class="adm-card">
        ${shown.length ? `<div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>신청일시</th><th>상태</th><th>학번</th><th>이름</th><th>학과</th><th>학년</th><th>이메일</th><th>연락처</th><th>신청 동기</th><th></th></tr></thead>
          <tbody>${shown.map((e) => `<tr>
            <td class="nowrap">${when(e.createdAt)}</td>
            <td><span class="adm-pill ${{ 승인: "green", 반려: "gray" }[e.status] || "amber"}">${esc(e.status || "대기")}</span></td>
            <td>${esc(e.sid)}</td><td>${esc(e.name)}</td><td>${esc(e.dept)}</td><td>${esc(e.year)}</td><td>${esc(e.email)}</td><td>${esc(e.phone)}</td>
            <td class="wrap">${esc(e.reason)}</td>
            <td class="nowrap">
              ${(e.status || "대기") !== "승인" ? `<button type="button" class="adm-btn sm" data-ok="${esc(e.id)}">승인</button>` : ""}
              ${(e.status || "대기") === "대기" ? `<button type="button" class="adm-btn ghost sm" data-no="${esc(e.id)}">반려</button>` : ""}
              <button type="button" class="adm-btn danger sm" data-del="${esc(e.id)}">삭제</button>
            </td></tr>`).join("")}</tbody>
        </table></div>` : "<p class='adm-empty'>해당하는 신청이 없어요.</p>"}
      </div>`;
    $$("[data-f]", main).forEach((b) => b.addEventListener("click", () => apply(main, b.dataset.f)));
    $("#apCsv").addEventListener("click", () => downloadCSV("수강신청내역", [APPLY_COLS.map(([, l]) => l)].concat(list.map((e) => APPLY_COLS.map(([k]) => (k === "createdAt" ? new Date(e[k]).toLocaleString("ko-KR") : k === "status" ? e[k] || "대기" : e[k]))))));
    const find = (id) => D.enrollments.find((x) => x.id === id);
    $$("[data-ok]", main).forEach((b) => b.addEventListener("click", async () => {
      const e = find(b.dataset.ok);
      e.status = "승인";
      upsertStudent({ sid: e.sid, name: e.name, dept: e.dept, year: e.year, email: e.email, phone: e.phone });
      if ((await save("enrollments")) && (await save("roster"))) { toast(`${e.name} 학생을 승인하고 명단에 추가했어요`); apply(main, filter); }
    }));
    $$("[data-no]", main).forEach((b) => b.addEventListener("click", async () => {
      find(b.dataset.no).status = "반려";
      if (await save("enrollments")) { toast("반려로 표시했어요"); apply(main, filter); }
    }));
    $$("[data-del]", main).forEach((b) => b.addEventListener("click", async () => {
      const e = find(b.dataset.del);
      if (!(await ask(`${e.name} 학생의 신청 기록을 삭제할까요?`, "삭제"))) return;
      D.enrollments = D.enrollments.filter((x) => x !== e);
      if (await save("enrollments")) { toast("삭제했어요"); apply(main, filter); }
    }));
  }

  /* ========== 6. 출석 ========== */
  const ATT = ["출석", "지각", "결석", "공결"];
  const sessionLabel = (s) => `${s.w.week}주차 · ${A.dateLabel(s.date)}${s.online ? " 온라인" : ""}${s.exam ? " 시험" : ""}`;
  function attend(main, key) {
    const sessions = (A.allSessions || []).filter((s) => !s.holiday);
    const today = todayStr();
    if (!key) { const past = sessions.filter((s) => s.key <= today); key = (past[past.length - 1] || sessions[0] || {}).key; }
    const sel = sessions.find((s) => s.key === key);
    sortRoster();
    const rec = D.attendance[key] || {};
    const tally = (sid) => {
      const t = { 출석: 0, 지각: 0, 결석: 0, 공결: 0 }; let n = 0;
      sessions.forEach((s) => { const v = (D.attendance[s.key] || {})[sid]; if (v) { t[v]++; n++; } });
      return Object.assign(t, { n, rate: n ? Math.round(((t.출석 + t.지각 + t.공결) / n) * 100) : null });
    };
    main.innerHTML = `
      ${panelHead("출석", "수업을 고르고 학생마다 출석 상태를 누르세요. 누르는 즉시 저장돼요.",
        `<button type="button" class="adm-btn ghost" id="atCsv">⬇️ 출석부 엑셀(CSV) 내려받기</button>`)}
      ${!D.roster.length ? `<div class="adm-note">먼저 <button type="button" class="link-btn" data-go="roster">수강생 명단</button>을 등록하세요.</div>` : ""}
      <div class="adm-card">
        <div class="adm-tablebar">
          <label class="ed-field inline"><span class="ed-label">수업</span>
            <select id="atSel">${sessions.map((s) => `<option value="${s.key}" ${s.key === key ? "selected" : ""}>${esc(sessionLabel(s))}${s.key === today ? " (오늘)" : ""}</option>`).join("")}</select>
          </label>
          ${D.roster.length ? `<button type="button" class="adm-btn sm" id="atAll">모두 출석</button>` : ""}
        </div>
        ${sel ? `<p class="adm-sub">${esc(sel.topic)} · ${esc(sel.time)} · ${esc(sel.place)}</p>` : ""}
        ${D.roster.length ? `<ul class="att-list">${D.roster.map((s) => `
          <li><span class="att-name"><b>${esc(s.name)}</b><small>${esc(s.sid)}</small></span>
            <span class="att-btns" data-sid="${esc(s.sid)}">${ATT.map((a) => `<button type="button" class="att-${a} ${rec[s.sid] === a ? "on" : ""}" data-v="${a}">${a}</button>`).join("")}</span></li>`).join("")}</ul>` : ""}
      </div>
      ${D.roster.length ? `<div class="adm-card">
        <h3>📊 학생별 출석 현황</h3>
        <p class="adm-sub">출석률 = (출석 + 지각 + 공결) ÷ 기록된 수업 수</p>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>학번</th><th>이름</th><th>출석</th><th>지각</th><th>결석</th><th>공결</th><th>기록</th><th>출석률</th></tr></thead>
          <tbody>${D.roster.map((s) => { const t = tally(s.sid); return `<tr><td>${esc(s.sid)}</td><td>${esc(s.name)}</td><td>${t.출석}</td><td>${t.지각}</td><td class="${t.결석 >= 4 ? "warn" : ""}">${t.결석}</td><td>${t.공결}</td><td>${t.n}/${sessions.length}</td><td><b>${t.rate === null ? "-" : t.rate + "%"}</b></td></tr>`; }).join("")}</tbody>
        </table></div></div>` : ""}`;
    bindCommon(main);
    $("#atSel").addEventListener("change", (e) => attend(main, e.target.value));
    const set = async (sid, v) => {
      D.attendance[key] = D.attendance[key] || {};
      if (v) D.attendance[key][sid] = v; else delete D.attendance[key][sid];
      return save("attendance");
    };
    $$(".att-btns", main).forEach((g) => $$("button", g).forEach((b) => b.addEventListener("click", async () => {
      const off = b.classList.contains("on");
      if (await set(g.dataset.sid, off ? null : b.dataset.v)) attend(main, key);
    })));
    const all = $("#atAll");
    if (all) all.addEventListener("click", async () => {
      D.attendance[key] = D.attendance[key] || {};
      D.roster.forEach((s) => { if (!D.attendance[key][s.sid]) D.attendance[key][s.sid] = "출석"; });
      if (await save("attendance")) { toast("기록이 없는 학생을 모두 출석으로 표시했어요"); attend(main, key); }
    });
    $("#atCsv").addEventListener("click", () => {
      const head = ["학번", "이름", ...sessions.map((s) => sessionLabel(s)), "출석", "지각", "결석", "공결", "출석률(%)"];
      const rows = D.roster.map((s) => { const t = tally(s.sid); return [s.sid, s.name, ...sessions.map((x) => (D.attendance[x.key] || {})[s.sid] || ""), t.출석, t.지각, t.결석, t.공결, t.rate === null ? "" : t.rate]; });
      downloadCSV("출석부", [head].concat(rows));
    });
  }

  /* ========== 7. 과제 ========== */
  const STATUS = ["미제출", "제출", "늦게 제출", "면제"];
  function assignList() {
    return (A.CUR.weeks || []).filter((w) => w.assignment && w.assignment.title).map((w) => ({ key: "w" + w.week, week: w.week, title: w.assignment.title, due: w.assignment.due }));
  }
  function assign(main, key) {
    const list = assignList();
    sortRoster();
    if (!list.length) {
      main.innerHTML = `${panelHead("과제", "")}<div class="adm-card"><p class="adm-empty">등록된 과제가 없어요. <button type="button" class="link-btn" id="goCur">사이트·섹션 편집 → 커리큘럼 · 일정</button>에서 주차를 열고 <b>＋ 과제</b>를 추가하세요.</p></div>`;
      $("#goCur").addEventListener("click", () => { draftKey = "curriculum"; show("content"); });
      return;
    }
    key = key || list[0].key;
    const cur = list.find((a) => a.key === key) || list[0];
    const subs = D.submissions.filter((s) => String(s.week) === String(cur.week));
    const g = D.grades[cur.key] || {};
    const subOf = (sid) => subs.filter((s) => String(s.sid).trim() === String(sid)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    const statusOf = (sid) => (g[sid] && g[sid].status) || (subOf(sid) ? "제출" : "미제출");
    const outsiders = subs.filter((s) => !D.roster.some((r) => r.sid === String(s.sid).trim()));
    const done = D.roster.filter((s) => ["제출", "늦게 제출", "면제"].includes(statusOf(s.sid))).length;
    main.innerHTML = `
      ${panelHead("과제", "학생이 사이트에서 제출한 과제가 자동으로 표시돼요. 상태·점수·메모는 바로 저장돼요.",
        `<button type="button" class="adm-btn ghost" id="asCsv">⬇️ 과제 현황 엑셀(CSV)</button>`)}
      <div class="adm-filter">${list.map((a) => `<button type="button" data-k="${a.key}" class="${a.key === cur.key ? "on" : ""}">${a.week}주차 · ${esc(a.title)}</button>`).join("")}</div>
      <div class="adm-card">
        <div class="adm-tablebar"><h3>${cur.week}주차 · ${esc(cur.title)}</h3><span class="adm-pill">${done}/${D.roster.length}명 완료${cur.due ? ` · 기한 ${esc(cur.due)}` : ""}</span></div>
        ${D.roster.length ? `<div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>학번</th><th>이름</th><th>제출물</th><th>상태</th><th>점수</th><th>메모</th></tr></thead>
          <tbody>${D.roster.map((s) => { const sub = subOf(s.sid), gr = g[s.sid] || {}; return `<tr data-sid="${esc(s.sid)}">
            <td>${esc(s.sid)}</td><td>${esc(s.name)}</td>
            <td class="wrap">${sub ? `<a href="${esc(sub.link)}" target="_blank" rel="noopener">열기 ↗</a><small> ${when(sub.createdAt)}</small>${sub.note ? `<br><small>${esc(sub.note)}</small>` : ""}` : "<small>-</small>"}</td>
            <td><select data-f="status">${STATUS.map((x) => `<option ${x === statusOf(s.sid) ? "selected" : ""}>${x}</option>`).join("")}</select></td>
            <td><input data-f="score" type="number" min="0" step="0.5" value="${esc(gr.score ?? "")}" class="w-num"></td>
            <td><input data-f="memo" type="text" value="${esc(gr.memo ?? "")}"></td></tr>`; }).join("")}</tbody>
        </table></div>` : `<p class="adm-empty">먼저 <button type="button" class="link-btn" data-go="roster">수강생 명단</button>을 등록하세요.</p>`}
      </div>
      ${outsiders.length ? `<div class="adm-card"><h3>⚠️ 명단에 없는 학번의 제출 (${outsiders.length})</h3><ul class="adm-list">${outsiders.map((s) => `<li><div><b>${esc(s.name)} (${esc(s.sid)})</b><small>${when(s.createdAt)}</small><p><a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.link)}</a></p></div></li>`).join("")}</ul></div>` : ""}`;
    bindCommon(main);
    $$("[data-k]", main).forEach((b) => b.addEventListener("click", () => assign(main, b.dataset.k)));
    $$("tr[data-sid] [data-f]", main).forEach((inp) => inp.addEventListener("change", async () => {
      const sid = inp.closest("tr").dataset.sid;
      D.grades[cur.key] = D.grades[cur.key] || {};
      const row = D.grades[cur.key][sid] = D.grades[cur.key][sid] || {};
      row[inp.dataset.f] = inp.dataset.f === "score" && inp.value !== "" ? Number(inp.value) : inp.value;
      if (inp.dataset.f !== "status" && !row.status) row.status = statusOf(sid);
      if (await save("grades")) toast("저장했어요");
    }));
    $("#asCsv").addEventListener("click", () => {
      const head = ["학번", "이름"];
      list.forEach((a) => head.push(`${a.week}주차 ${a.title} 상태`, "점수", "제출 링크", "메모"));
      const rows = D.roster.map((s) => {
        const r = [s.sid, s.name];
        list.forEach((a) => {
          const gr = (D.grades[a.key] || {})[s.sid] || {};
          const sub = D.submissions.filter((x) => String(x.week) === String(a.week) && String(x.sid).trim() === s.sid).sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)))[0];
          r.push(gr.status || (sub ? "제출" : "미제출"), gr.score ?? "", sub ? sub.link : "", gr.memo || "");
        });
        return r;
      });
      downloadCSV("과제현황", [head].concat(rows));
    });
  }

  /* ========== 8. 설정 ========== */
  function settings(main) {
    main.innerHTML = `
      ${panelHead("설정", "")}
      <form class="adm-card adm-form" id="pwForm" autocomplete="off">
        <h3>🔑 비밀번호 변경</h3>
        <div class="adm-grid3">
          <label class="ed-field"><span class="ed-label">현재 비밀번호</span><input type="password" name="cur" required autocomplete="current-password"></label>
          <label class="ed-field"><span class="ed-label">새 비밀번호 (8자 이상)</span><input type="password" name="pw1" minlength="8" required autocomplete="new-password"></label>
          <label class="ed-field"><span class="ed-label">새 비밀번호 확인</span><input type="password" name="pw2" minlength="8" required autocomplete="new-password"></label>
        </div>
        <p class="adm-sub">비밀번호는 그대로 저장되지 않고, 되돌릴 수 없는 해시값으로만 저장돼요.${S.mode === "local" ? " 변경 후 <b>config.js 내려받기</b>로 서버 파일을 바꿔야 다른 기기에서도 새 비밀번호가 적용돼요." : ""}</p>
        <div class="adm-row-end"><button type="submit" class="adm-btn primary">비밀번호 바꾸기</button></div>
      </form>
      <div class="adm-card">
        <h3>💾 저장 방식</h3>
        <p>현재: <b>${S.mode === "gas" ? "☁️ 구글 시트 (모든 기기·학생과 공유)" : "💻 이 브라우저에만 저장"}</b></p>
        <p class="adm-sub">${S.mode === "gas" ? "수강신청·과제 제출·명단·출석이 구글 시트에 저장됩니다." : "학생들의 수강신청·과제 제출을 모으려면 「사용안내.md」의 '구글 시트 연결'을 따라 config.js 의 backend 를 바꾸세요."}</p>
      </div>
      <div class="adm-card">
        <h3>🌐 사이트 내용 수정본</h3>
        <p class="adm-sub">${S.usingOverride ? `화면에서 고친 수정본을 사용 중이에요 (저장: ${esc(new Date(S.overrideSavedAt).toLocaleString("ko-KR"))}).` : "아직 화면에서 고친 내용이 없어요. config.js 파일 내용 그대로예요."}</p>
        <div class="adm-quick">
          <button type="button" class="adm-btn" data-export-config>⬇️ config.js 내려받기 (배포용)</button>
          ${S.usingOverride ? `<button type="button" class="adm-btn danger" id="resetCfg">↩️ 수정본 지우고 config.js 파일 내용으로 되돌리기</button>` : ""}
        </div>
      </div>
      <div class="adm-card">
        <h3>🗂️ 데이터 백업 · 복원</h3>
        <p class="adm-sub">명단·수강신청·출석·과제 기록을 파일 하나로 저장하거나, 저장한 파일로 되살릴 수 있어요. 학기 중 정기적으로 백업하세요.</p>
        <div class="adm-quick">
          <button type="button" class="adm-btn" id="bkDown">💾 백업 파일 내려받기</button>
          <label class="adm-btn ghost file-btn">📂 백업 파일로 복원<input type="file" id="bkUp" accept=".json,application/json" hidden></label>
        </div>
      </div>`;
    bindCommon(main);
    $("#pwForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      const cfgA = window.SITE_CONFIG.admin;
      if (S.hashPassword(f.cur, cfgA.salt, cfgA.iterations) !== cfgA.passwordHash) { toast("현재 비밀번호가 맞지 않아요", "err"); return; }
      if (f.pw1 !== f.pw2) { toast("새 비밀번호 두 칸이 서로 달라요", "err"); return; }
      if (f.pw1.length < 8) { toast("8자 이상으로 정해 주세요", "err"); return; }
      const salt = S.randomHex(16), iterations = cfgA.iterations || 1000;
      const hash = S.hashPassword(f.pw1, salt, iterations);
      try {
        await S.setPassword(salt, hash, auth);
        if (S.mode === "gas") { auth = f.pw1; ss.set(SS.auth, auth); }
        const cfg = clone(window.SITE_CONFIG);
        cfg.admin = { salt, passwordHash: hash, iterations };
        ss.set(SS.tab, "settings");
        await saveSiteConfig(cfg, "비밀번호를 바꿨어요" + (S.mode === "local" ? " — config.js 를 내려받아 서버에도 반영하세요" : ""));
      } catch (ex) { toast("바꾸지 못했어요: " + ex.message, "err"); }
    });
    const rc = $("#resetCfg");
    if (rc) rc.addEventListener("click", async () => {
      if (!(await ask("화면에서 고친 내용(공지 포함)을 모두 지우고 config.js 파일 내용으로 되돌릴까요?", "되돌리기"))) return;
      try { await S.resetConfig(auth); ss.set(SS.tab, "settings"); toast("되돌렸어요"); setTimeout(() => location.reload(), 600); }
      catch (ex) { toast("실패: " + ex.message, "err"); }
    });
    $("#bkDown").addEventListener("click", backupAll);
    $("#bkUp").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data || data.app !== "kuj-site") throw new Error("이 사이트의 백업 파일이 아니에요");
        if (!(await ask(`${new Date(data.savedAt).toLocaleString("ko-KR")} 백업으로 되돌릴까요?\n지금 데이터는 백업 내용으로 바뀝니다.`, "되돌리기"))) return;
        for (const k of DATA_KEYS) if (k in data.data) { D[k] = data.data[k]; await S.set(k, D[k], auth); }
        toast("복원했어요");
      } catch (ex) { toast("복원하지 못했어요: " + ex.message, "err"); }
      e.target.value = "";
    });
  }
  function backupAll() {
    const data = { app: "kuj-site", savedAt: new Date().toISOString(), data: {} };
    DATA_KEYS.forEach((k) => (data.data[k] = D[k]));
    download(`수업데이터_백업_${todayStr()}.json`, JSON.stringify(data, null, 2), "application/json");
    toast("백업 파일을 내려받았어요");
  }

  /* ---------- 시작 ---------- */
  function init() {
    if (A) return;
    A = window.SiteApp;
    addLockButton();
    // 저장 후 새로고침했을 때 관리자 화면을 이어서 열기
    if (ss.get(SS.auth) && ss.get(SS.tab)) openAdmin(ss.get(SS.tab));
  }
  if (window.SiteApp) init(); else document.addEventListener("site:ready", init);
  // 참여하기의 설문 히스토리 표 → 새 설문·수정·삭제 버튼 (로그인이 안 되어 있으면 로그인 먼저)
  function surveyFromSite(action, id) {
    svPending = { action, id };
    if (ss.get(SS.auth)) openAdmin("survey"); else { loginNext = "survey"; openLogin(); }
  }
  window.SiteAdmin = { toCSV, openLogin, survey: surveyFromSite };   // 점검용 · 사이트 연결
})();
