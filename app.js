/* ==========================================================
 *  화면 그리기 스크립트 — 내용 수정은 config.js 에서 하세요.
 * ========================================================== */
// store.js 가 저장된 수정본(관리자 화면에서 고친 내용)을 불러온 뒤 화면을 그립니다
(window.SiteStore ? window.SiteStore.ready : Promise.resolve()).then(function () {
  const C = window.SITE_CONFIG;
  if (!C) { document.body.innerHTML = "<p style='padding:40px'>config.js 를 불러오지 못했습니다. 파일 문법(쉼표, 따옴표)을 확인해 주세요.</p>"; return; }

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nl2br = (v) => esc(v).replace(/\n/g, "<br>");
  const head = (s) => `
    <div class="section-head reveal">
      <span class="eyebrow">${esc(s.eyebrow)}</span>
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.subtitle)}</p>
    </div>`;

  /* ===== 1단계: 전체 틀 · 테마 ===== */
  function applyTheme() {
    const t = C.theme || {};
    const map = { pink: "--pink", pinkDeep: "--pink-deep", lavender: "--lavender", purple: "--purple", cream: "--cream", ink: "--ink" };
    Object.entries(map).forEach(([k, v]) => t[k] && document.documentElement.style.setProperty(v, t[k]));
    document.title = C.site.title;
  }

  function renderHeader() {
    $("#brandIcon").textContent = C.site.logoIcon;
    $("#brandText").textContent = C.site.logoText;
    $("#brandSub").textContent = C.site.logoSub;
    $("#nav").innerHTML = C.nav.map((n) => `<a href="#${esc(n.id)}" data-id="${esc(n.id)}">${esc(n.label)}</a>`).join("");

    const toggle = $("#menuToggle"), nav = $("#nav");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false); }
    });
  }

  function renderHero() {
    const h = C.hero;
    const isExternal = (href) => /^https?:\/\//.test(href);
    $("#hero").innerHTML = `
      <div class="hero-deco" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="hero-main reveal">
        <div class="badge-row">
          ${h.badgeImages && h.badgeImages.left ? `<img class="badge-art left" src="${esc(h.badgeImages.left)}" alt="" aria-hidden="true">` : ""}
          <span class="hero-badge">🌸 ${esc(h.badge)}</span>
          ${h.badgeImages && h.badgeImages.right ? `<img class="badge-art right ${h.badgeImages.mirrorRight ? "mirror" : ""}" src="${esc(h.badgeImages.right)}" alt="" aria-hidden="true">` : ""}
        </div>
        <p class="jp">${esc(h.titleJp)}</p>
        <h1>${nl2br(h.title)}</h1>
        <p class="lead">${esc(h.description)}</p>
        <div class="hero-actions">
          ${h.buttons.map((b) => `<a class="btn ${esc(b.style)}" href="${esc(b.href)}"${isExternal(b.href) ? ' target="_blank" rel="noopener"' : ""}>${esc(b.label)}</a>`).join("")}
        </div>
      </div>
      <div class="hero-info">
        ${h.info.map((i) => (i.auto ? { ...i, ...scheduleSummary() } : i)).map((i) => `
          <div class="card info-card reveal">
            <span class="info-icon">${esc(i.icon)}</span>
            <small>${esc(i.label)}</small>
            <strong>${esc(i.value)}</strong>
            ${i.sub ? `<span class="info-sub">${esc(i.sub)}</span>` : ""}
          </div>`).join("")}
      </div>`;
  }

  function renderAbout() {
    const a = C.about;
    $("#about").innerHTML = `
      ${head(a)}
      <div class="grid about-main">
        <div class="card reveal"><h3>${esc(a.overviewTitle)}</h3><p>${esc(a.overview)}</p></div>
        <div class="card goal-card reveal"><h3>${esc(a.goalTitle)}</h3><blockquote>${esc(a.goal)}</blockquote></div>
      </div>
      <div class="grid grid-4">
        ${a.highlights.map((f) => `
          <div class="card hover feature reveal">
            <div class="icon">${esc(f.icon)}</div>
            <h4>${esc(f.title)}</h4><p>${esc(f.desc)}</p>
          </div>`).join("")}
      </div>`;
  }

  /* ===== 2단계: 강의 소개 ===== */
  function renderCourse() {
    const c = C.course;
    $("#course").innerHTML = `
      ${head(c)}
      <div class="era-tabs reveal" role="tablist">
        <button class="on" data-era="all">전체</button>
        ${c.eras.map((e) => `<button data-era="${esc(e.key)}">${esc(e.icon)} ${esc(e.name)}</button>`).join("")}
      </div>
      <div class="grid era-grid">
        ${c.eras.map((e) => `
          <article class="card hover era-card reveal" data-era="${esc(e.key)}" tabindex="0" role="button" aria-label="${esc(e.name)} 자세히 보기">
            <div class="era-icon">${esc(e.icon)}</div>
            <span class="era-jp">${esc(e.nameJp)}</span>
            <h3>${esc(e.name)}</h3>
            <span class="period">${esc(e.period)} · ${e.weeks.map((w) => w + "주").join(", ")}차</span>
            <p>${esc(e.summary)}</p>
            <div class="chips">${e.keywords.map((k) => `<span class="chip">${esc(k)}</span>`).join("")}</div>
            <span class="more">자세히 보기 →</span>
          </article>`).join("")}
      </div>`;

    $$(".era-tabs button").forEach((btn) => btn.addEventListener("click", () => {
      $$(".era-tabs button").forEach((b) => b.classList.toggle("on", b === btn));
      const key = btn.dataset.era;
      $$(".era-card").forEach((card) => card.classList.toggle("hidden", key !== "all" && card.dataset.era !== key));
    }));
    $$(".era-card").forEach((card) => {
      const open = () => openEra(card.dataset.era);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
    });
  }

  function openEra(key) {
    const e = C.course.eras.find((x) => x.key === key);
    if (!e) return;
    const weeks = C.curriculum.weeks.filter((w) => w.era === key || e.weeks.includes(w.week));
    openModal(`
      <span class="chip pink">${esc(e.icon)} ${esc(e.period)}</span>
      <h3 id="modalTitle">${esc(e.name)} <small style="font-family:var(--font-jp);font-size:1rem;color:var(--pink-deep)">${esc(e.nameJp)}</small></h3>
      <p>${esc(e.summary)}</p>
      <h5>핵심 키워드</h5>
      <div class="chips" style="display:flex;gap:6px;flex-wrap:wrap">${e.keywords.map((k) => `<span class="chip">${esc(k)}</span>`).join("")}</div>
      <h5>감상 작품 (예시)</h5>
      <ul>${e.works.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
      <h5>관련 수업 주차</h5>
      <div class="modal-weeks">${weeks.map((w) => `<div><b>${w.week}주차</b>${esc(w.topic)}${classDate(w) ? ` <small style="color:var(--ink-soft)">· ${dateLabel(classDate(w))}</small>` : ""}</div>`).join("")}</div>`);
  }

  /* ===== 3단계: 커리큘럼 · 월간 수업달력 ===== */
  const DAY = 86400000;
  const WD = ["일", "월", "화", "수", "목", "금", "토"];
  const parseDate = (s) => { const d = s ? new Date(s + "T00:00:00") : null; return d && !isNaN(d) ? d : null; };
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dateLabel = (d) => `${d.getMonth() + 1}.${d.getDate()} (${WD[d.getDay()]})`;
  const CUR = C.curriculum;
  const firstClass = parseDate(CUR.firstClassDate);
  const classDays = (CUR.classDays || [{ day: "화" }]).map((cd) => ({ ...cd, dow: WD.indexOf(cd.day) }));
  const holidays = {};
  (CUR.holidays || []).forEach((h) => (holidays[h.date] = h.name));
  // 수업이 쉬는 날의 표시: 이름에 '휴강'이 있으면 '휴강', 공휴일이면 그 이름(예: 추석 연휴)
  const offLabel = (name) => (name.includes("휴강") ? "휴강" : name);

  // 각 주차의 정규 수업 날짜 = 첫 수업일이 속한 주의 월요일 + (주차-1)×7일 + 요일
  const monday0 = firstClass && new Date(firstClass.getTime() - ((firstClass.getDay() + 6) % 7) * DAY);
  function regularDates(w) {
    if (!firstClass) return [];
    const base = monday0.getTime() + (w.week - 1) * 7 * DAY;
    return classDays
      .map((cd) => { const date = new Date(base + ((cd.dow + 6) % 7) * DAY); return { cd, day: cd.day, date, key: ymd(date) }; })
      .filter((r) => r.date >= firstClass);
  }
  // 날짜가 몇 주차에 들어가는지 (관리자 화면에서 주차 자동 선택용)
  const weekOfDate = (key) => { const d = parseDate(key); return d && firstClass ? Math.floor(Math.round((d - monday0) / DAY) / 7) + 1 : null; };

  function weekSessions(w) {
    const regular = regularDates(w)
      .map(({ cd, date, key }) => {
        const o = (w.byDay && w.byDay[cd.day]) || {};   // 요일별 내용(있으면)
        return {
          w, date, key, day: cd.day,
          time: o.time || w.time || cd.time || "-", place: o.place || w.place || cd.place || "-",
          holiday: holidays[key],
          topic: o.topic || w.topic, short: o.short || w.short || w.topic, details: o.details || w.details || "",
          exam: o.exam !== undefined ? o.exam : w.type === "exam", custom: !!(w.byDay || w.extraSessions)
        };
      })
      .filter((s) => !((s.w.byDay || {})[s.day] || {}).skip);   // skip: true 인 요일은 수업 없음
    // 정규 요일 외에 따로 잡힌 수업 (예: 온라인 보강수업, 보강, 시험)
    const extra = (w.extraSessions || []).map((e, extraIdx) => {
      const date = parseDate(e.date);
      return date && {
        w, date, key: ymd(date), day: WD[date.getDay()],
        time: e.time || "-", place: e.place || (e.online ? "온라인" : "-"),
        topic: e.topic || w.topic, short: e.short || (e.exam ? "시험" : e.online ? "온라인 보강" : "보강"), details: e.details || w.details || "",
        exam: !!e.exam, online: !!e.online, url: e.url || "", custom: true, extra: true, extraIdx
      };
    }).filter(Boolean);
    return regular.concat(extra).sort((a, b) => a.date - b.date);
  }
  const allSessions = CUR.weeks.flatMap(weekSessions);
  const sessionsOn = (key) => allSessions.filter((s) => s.key === key);
  // 수업이 아닌 기타 일정 (특강·답사·과제 마감 등) — 관리자 화면 '수업 달력'에서 추가
  const events = (CUR.events || []).filter((e) => parseDate(e.date)).sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || "").localeCompare(String(b.time || "")));
  const eventsOn = (key) => events.filter((e) => e.date === key);
  const classDate = (w) => (weekSessions(w)[0] || {}).date;  // 시대 카드 팝업에서 사용

  // 기준 수업: 오늘 수업이 있으면 오늘, 아니면 다음 수업
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = allSessions.filter((s) => !s.holiday).find((s) => s.date >= today) || null;
  const termStarted = allSessions.length && today >= allSessions[0].date;
  const curWeek = upcoming && termStarted ? upcoming.w.week : null;
  // 참고 그림: 위키미디어 파일 이름 → 그림 주소·출처, 위키백과 문서 제목 → 링크
  function artInfo(im, width = 640) {
    const f = im.file ? encodeURIComponent(String(im.file).replace(/ /g, "_")) : "";
    return {
      thumb: im.image || (f ? `https://commons.wikimedia.org/wiki/Special:FilePath/${f}?width=${width}` : ""),
      source: im.source || (f ? `https://commons.wikimedia.org/wiki/File:${f}` : ""),
      wiki: im.wiki ? (/^https?:/.test(im.wiki) ? im.wiki : `https://ja.wikipedia.org/wiki/${encodeURIComponent(im.wiki)}`) : ""
    };
  }
  function openArt(week, i) {
    const w = CUR.weeks.find((x) => String(x.week) === String(week));
    const list = (w && w.images) || [];
    const show = (k) => {
      const im = list[k], a = artInfo(im, 1600);
      openModal(`
        <div class="art-view">
          <img src="${esc(a.thumb)}" alt="${esc(im.title)}">
          <h3 id="modalTitle">${esc(im.title)}</h3>
          <p class="muted">${w.week}주차 · ${esc(w.short || w.topic)} · ${k + 1} / ${list.length}</p>
          <div class="art-view-links">
            ${a.wiki ? `<a class="btn ghost" href="${esc(a.wiki)}" target="_blank" rel="noopener">위키백과에서 보기 ↗</a>` : ""}
            ${a.source ? `<a class="btn ghost" href="${esc(a.source)}" target="_blank" rel="noopener">그림 출처 (위키미디어) ↗</a>` : ""}
          </div>
          ${list.length > 1 ? `<div class="art-nav"><button type="button" class="btn ghost" data-k="${(k - 1 + list.length) % list.length}">‹ 이전 그림</button><button type="button" class="btn ghost" data-k="${(k + 1) % list.length}">다음 그림 ›</button></div>` : ""}
        </div>`);
      $$("#modalBody .art-nav [data-k]").forEach((b) => b.addEventListener("click", () => show(Number(b.dataset.k))));
    };
    if (list[i]) show(i);
  }
  const videoUrl = (v) => v.url || (v.search ? "https://www.youtube.com/results?search_query=" + encodeURIComponent(v.search) : "#");
  const eraName = (k) => (C.course.eras.find((e) => e.key === k) || {}).name;
  // 제목 옆 표시: 과제 / 온라인 보강수업
  const weekTags = (w) =>
    (w.assignment ? `<span class="tag tag-assign">📝 과제</span>` : "") +
    (w.online ? `<span class="tag tag-online">💻 온라인 보강수업</span>` : "");

  function renderCalendar() {
    if (!allSessions.length) return "";
    const months = [];
    allSessions.map((s) => s.date).concat(events.map((e) => parseDate(e.date)))
      .forEach((date) => { const k = date.getFullYear() * 12 + date.getMonth(); if (!months.includes(k)) months.push(k); });
    months.sort((a, b) => a - b);
    const classDow = classDays.map((c) => c.dow);
    const selectedKey = upcoming ? upcoming.key : allSessions[0].key;
    const selDate = parseDate(selectedKey);
    const startIdx = Math.max(0, months.indexOf(selDate.getFullYear() * 12 + selDate.getMonth()));

    const monthHtml = (k, idx) => {
      const y = Math.floor(k / 12), m = k % 12;
      const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
      let cells = "";
      for (let i = 0; i < first.getDay(); i++) cells += `<div class="cal-cell empty"></div>`;
      for (let day = 1; day <= days; day++) {
        const date = new Date(y, m, day), key = ymd(date);
        const ss = sessionsOn(key);
        const s = ss[0];
        const cls = ["cal-cell", date.getDay() === 0 ? "sun" : "", date.getDay() === 6 ? "sat" : "",
          classDow.includes(date.getDay()) ? "class-dow" : "", key === ymd(today) ? "today" : "", key === selectedKey ? "selected" : ""];
        let inner = `<span class="cal-day">${day}</span>`;
        if (s && s.holiday) {
          cls.push("holiday");
          inner += `<span class="cal-badge">${esc(offLabel(s.holiday))}</span>`;
        } else if (s && s.online) {
          cls.push("has-class", "online-class");
          inner += `<span class="cal-badge">💻 ${s.w.week}주차</span><span class="cal-topic">${esc(s.short)}</span>`;
        } else if (s) {
          cls.push("has-class", s.exam ? "exam" : "", s.w.week === curWeek ? "current" : "");
          inner += `<span class="cal-badge">${s.exam ? "📝 " : ""}${s.w.week}주차</span><span class="cal-topic">${esc(s.short)}</span>`;
        } else if (holidays[key]) {
          inner += `<span class="cal-topic hol">${esc(holidays[key])}</span>`;
        }
        const ev = eventsOn(key);
        if (ev.length) {
          cls.push("has-event");
          inner += s ? `<span class="cal-evt-dot" aria-hidden="true">📌</span>` : `<span class="cal-topic evt">📌 ${esc(ev[0].title)}${ev.length > 1 ? ` 외 ${ev.length - 1}` : ""}</span>`;
        }
        cells += `<button class="${cls.join(" ")}" data-date="${key}" aria-label="${date.getMonth() + 1}월 ${day}일${s ? " " + s.w.week + "주차 수업" : ""}${ev.length ? " 일정 " + ev.length + "개" : ""}">${inner}</button>`;
      }
      return `<div class="cal-month ${idx === startIdx ? "on" : ""}">
          <div class="cal-grid">
            ${WD.map((w, i) => `<div class="cal-wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""} ${classDow.includes(i) ? "class-dow" : ""}">${w}</div>`).join("")}
            ${cells}
          </div>
        </div>`;
    };
    const label = (k) => `${Math.floor(k / 12)}년 ${(k % 12) + 1}월`;
    const dayNames = classDays.map((c) => c.day).join("·");
    return `
      <div class="card calendar reveal" data-labels='${JSON.stringify(months.map(label))}' data-selected="${selectedKey}">
        <div class="cal-head">
          <h3>📅 ${esc(CUR.calendarTitle || "월간 수업달력")}</h3>
          <div class="cal-nav">
            <button class="cal-prev" aria-label="이전 달">‹</button>
            <strong class="cal-label">${label(months[startIdx])}</strong>
            <button class="cal-next" aria-label="다음 달">›</button>
          </div>
        </div>
        <div class="cal-tabs">${months.map((k, i) => `<button data-idx="${i}" class="${i === startIdx ? "on" : ""}">${(k % 12) + 1}월</button>`).join("")}</div>
        <div class="cal-wrap">
          <div class="cal-main">
            ${months.map(monthHtml).join("")}
            <div class="cal-legend">
              <span><i class="lg-class"></i>수업일 (${esc(dayNames)})</span><span><i class="lg-exam"></i>시험</span><span><i class="lg-online"></i>온라인 보강</span><span><i class="lg-hol"></i>휴강·공휴일</span>${events.length ? `<span>📌 기타 일정</span>` : ""}<span><i class="lg-today"></i>오늘</span>
            </div>
          </div>
          <aside class="cal-detail" aria-live="polite"></aside>
        </div>
      </div>`;
  }

  // 날짜를 눌렀을 때 옆(모바일은 아래)에 보이는 '그날 수업' 패널
  function dayDetail(key) {
    const d = parseDate(key);
    const ss = sessionsOn(key);
    const headDate = `<div class="cd-date"><span>${d.getFullYear()}년</span><strong>${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})</strong></div>`;
    const evHtml = eventsOn(key).map((e) => `
        <div class="cd-card event">
          <span class="cd-week">📌 일정</span>
          <h4>${esc(e.title)}</h4>
          ${e.time || e.place ? `<dl class="cd-info">
            ${e.time ? `<div><dt>⏰ 시간</dt><dd>${esc(e.time)}</dd></div>` : ""}
            ${e.place ? `<div><dt>📍 장소</dt><dd>${esc(e.place)}</dd></div>` : ""}
          </dl>` : ""}
          ${e.details ? `<p class="cd-evt-text">${nl2br(e.details)}</p>` : ""}
          ${e.url ? `<a class="btn ghost cd-jump" href="${esc(e.url)}" target="_blank" rel="noopener">관련 링크 열기 ↗</a>` : ""}
        </div>`).join("");
    if (!ss.length) {
      const next = allSessions.filter((s) => !s.holiday).find((s) => s.date > d);
      return `${headDate}
        ${evHtml || `<div class="cd-empty"><span>🌸</span><p>${holidays[key] ? esc(holidays[key]) + " — " : ""}이 날은 수업이 없어요.</p></div>`}
        ${next ? `<button class="btn ghost cd-jump" data-date="${next.key}">다음 수업 보기 · ${dateLabel(next.date)} →</button>` : ""}`;
    }
    return headDate + evHtml + ss.map((s) => {
      const w = s.w;
      const idx = weekSessions(w).findIndex((x) => x.key === s.key) + 1;
      const total = weekSessions(w).length;
      if (s.holiday) {
        const makeup = weekSessions(w).find((x) => x.online);
        return `
        <div class="cd-card holiday">
          <span class="cd-week">${w.week}주차 · ${esc(s.day)}요일</span>
          <h4>${esc(offLabel(s.holiday))}</h4>
          <p class="muted">이 날은 수업이 없습니다.${makeup ? "" : " 보강 일정은 별도로 공지됩니다."}</p>
          ${makeup ? `<button class="btn ghost cd-jump" data-date="${makeup.key}">💻 보강: ${dateLabel(makeup.date)} ${esc(makeup.time)} 온라인 수업 →</button>` : ""}
        </div>`;
      }
      return `
        <div class="cd-card ${s.exam ? "exam" : ""} ${s.online ? "online" : ""}">
          <span class="cd-week">${w.week}주차${total > 1 ? ` · ${idx}/${total}회차` : ""}</span>${s.exam ? ` <span class="tag tag-exam">📝 시험</span>` : ""}${s.online ? ` <span class="tag tag-online">💻 온라인 보강수업</span>` : ""}
          <h4>${esc(s.topic)} ${s.online ? "" : weekTags(w)}</h4>
          <dl class="cd-info">
            <div><dt>⏰ 시간</dt><dd>${esc(s.day)} ${esc(s.time)}</dd></div>
            <div><dt>📍 장소</dt><dd>${esc(s.place)}</dd></div>
          </dl>
          <div class="cd-learn">
            <h5>📖 학습내용</h5>
            <p>${esc(s.details || s.topic)}</p>
          </div>
          ${s.online && s.url ? `<a class="btn ghost cd-jump" href="${esc(s.url)}" target="_blank" rel="noopener">💻 온라인 수업 들어가기 ↗</a>` : ""}
          <button class="btn primary cd-more" data-week="${w.week}">커리큘럼에서 자세히 보기 →</button>
        </div>`;
    }).join("");
  }

  function openWeek(n) {
    const item = document.getElementById("week-" + n);
    if (!item) return;
    item.open = true;
    item.scrollIntoView({ behavior: "smooth", block: "start" });
    item.classList.add("flash");
    setTimeout(() => item.classList.remove("flash"), 1600);
  }

  function setupCalendar() {
    const cal = $(".calendar");
    if (!cal) return;
    const labels = JSON.parse(cal.dataset.labels);
    const months = $$(".cal-month", cal), tabs = $$(".cal-tabs button", cal);
    const detail = $(".cal-detail", cal);
    let idx = months.findIndex((m) => m.classList.contains("on"));
    const show = (i) => {
      idx = Math.max(0, Math.min(months.length - 1, i));
      months.forEach((m, j) => m.classList.toggle("on", j === idx));
      tabs.forEach((t, j) => t.classList.toggle("on", j === idx));
      $(".cal-label", cal).textContent = labels[idx];
      $(".cal-prev", cal).disabled = idx === 0;
      $(".cal-next", cal).disabled = idx === months.length - 1;
    };
    const select = (key, scrollMobile) => {
      $$(".cal-cell.selected", cal).forEach((c) => c.classList.remove("selected"));
      const cell = $(`.cal-cell[data-date="${key}"]`, cal);
      if (cell) {
        cell.classList.add("selected");
        show(months.indexOf(cell.closest(".cal-month")));
      }
      detail.innerHTML = dayDetail(key);
      detail.classList.remove("pop"); void detail.offsetWidth; detail.classList.add("pop");
      $$(".cd-more", detail).forEach((b) => b.addEventListener("click", () => openWeek(b.dataset.week)));
      $$(".cd-jump", detail).forEach((b) => b.addEventListener("click", () => select(b.dataset.date, true)));
      // 모바일에서는 달력 아래 패널이 보이도록 살짝 스크롤
      if (scrollMobile && window.matchMedia("(max-width: 900px)").matches) detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    show(idx);
    select(cal.dataset.selected, false);
    $(".cal-prev", cal).addEventListener("click", () => show(idx - 1));
    $(".cal-next", cal).addEventListener("click", () => show(idx + 1));
    tabs.forEach((t, j) => t.addEventListener("click", () => show(j)));
    $$("button.cal-cell", cal).forEach((b) => b.addEventListener("click", () => select(b.dataset.date, true)));
  }

  function renderCurriculum() {
    const c = CUR;
    const total = c.weeks.length;
    const inTerm = curWeek !== null;
    let progressText = "", pct = 0;
    if (inTerm) {
      progressText = `다음 수업은 <b>${curWeek}주차</b> · ${dateLabel(upcoming.date)} ${esc(upcoming.time)}`;
      pct = Math.round(((curWeek - 0.5) / total) * 100);
    }
    const listTitle = (c.listTitle || "주차별 강의 ({n}주)").replace("{n}", total);

    $("#curriculum").innerHTML = `
      ${head({ ...c, title: String(c.title).replace("{n}", total) })}
      <div class="phase-bar reveal">
        ${c.phases.map((p) => `
          <div class="phase ${inTerm && p.weeks.includes(curWeek) ? "current" : ""}">
            <div class="p-icon">${esc(p.icon)}</div>
            <strong>${esc(p.title)}</strong>
            <small>${esc(p.jp)}</small>
            <span class="p-weeks">${p.weeks[0]}${p.weeks.length > 1 ? "–" + p.weeks[p.weeks.length - 1] : ""}주차</span>
          </div>`).join("")}
      </div>
      ${progressText ? `
      <div class="card progress-card reveal">
        <span class="now">${progressText}</span>
        <div class="progress-track"><span style="width:0" data-w="${pct}%"></span></div>
        <small>첫 수업 ${esc(c.firstClassDate)} 기준</small>
      </div>` : ""}
      ${renderCalendar()}
      <h3 class="list-title reveal">📚 ${esc(listTitle)}</h3>
      <div class="timeline">
        ${c.weeks.map((w) => {
          const ss = weekSessions(w);
          const state = !inTerm ? "" : w.week < curWeek ? "past" : w.week === curWeek ? "current" : "";
          const videos = w.videos || [];
          const images = w.images || [];
          return `
          <details class="week card ${w.type === "exam" ? "exam" : ""} ${state} reveal" id="week-${w.week}" ${state === "current" ? "open" : ""}>
            <summary>
              <div class="wk">${w.week}<small>주차</small></div>
              <div class="wk-main">
                <h4>${esc(w.topic)} ${weekTags(w)} ${state === "current" ? '<span class="badge-now">다음 수업</span>' : ""}</h4>
                <div class="meta">
                  ${w.era ? `<span class="chip pink">${esc(eraName(w.era))}</span>` : ""}
                  ${w.activity ? `<span class="chip">${esc(w.activity)}</span>` : ""}
                </div>
              </div>
              <span class="date">${ss.map((s) => `${s.date.getMonth() + 1}.${s.date.getDate()}(${s.day})${s.holiday ? " " + offLabel(s.holiday) : s.online ? " 온라인" : s.custom && s.exam ? " 시험" : ""}`).join(" · ")}</span>
              <span class="toggle" aria-hidden="true"></span>
            </summary>
            <div class="week-body">
              <div class="session-table">
                <div class="st-head"><span>📅 날짜</span><span>⏰ 시간</span><span>📍 장소</span></div>
                ${ss.map((s) => `
                  <div class="st-row ${s.holiday ? "holiday" : ""} ${s.exam && !s.holiday ? "exam" : ""} ${s.online ? "online" : ""}">
                    <span data-label="📅 날짜">${s.date.getFullYear()}. ${dateLabel(s.date)}${s.exam && !s.holiday ? ' <b class="tag tag-exam">📝 시험</b>' : ""}${s.online ? ' <b class="tag tag-online">💻 온라인</b>' : ""}</span>
                    <span data-label="⏰ 시간">${s.holiday ? esc(offLabel(s.holiday)) : esc(s.time)}</span>
                    <span data-label="📍 장소">${s.holiday ? "-" : esc(s.place)}</span>
                    ${s.custom && !s.holiday ? `<span class="st-note" data-label="📖 내용">${esc(s.topic)}</span>` : ""}
                  </div>`).join("")}
              </div>
              <div class="week-block">
                <h5>📖 학습내용</h5>
                <p class="wk-topic">${esc(w.topic)}</p>
                ${w.details ? `<p>${esc(w.details)}</p>` : ""}
                <div class="meta">
                  ${w.material ? `<span>📎 ${esc(w.material)}</span>` : ""}
                  ${w.era ? `<button class="chip pink era-link" data-era="${esc(w.era)}">시대 카드 보기: ${esc(eraName(w.era))} →</button>` : ""}
                </div>
              </div>
              ${w.assignment ? `
              <div class="week-block extra assign">
                <h5>📝 과제</h5>
                <p class="wk-topic">${esc(w.assignment.title)}</p>
                ${w.assignment.desc ? `<p>${esc(w.assignment.desc)}</p>` : ""}
                ${w.assignment.due ? `<p class="due">⏳ 제출 기한: ${esc(w.assignment.due)}</p>` : ""}
                <button class="btn primary submit-assign" data-week="${w.week}">📤 과제 제출하기</button>
              </div>` : ""}
              ${w.online ? `
              <div class="week-block extra online">
                <h5>💻 온라인 보강수업</h5>
                <p class="wk-topic">${esc(w.online.title)}</p>
                ${w.online.desc ? `<p>${esc(w.online.desc)}</p>` : ""}
                ${w.online.period ? `<p class="due">🗓️ 일시:${esc(w.online.period)}</p>` : ""}
                ${w.online.url ? `<a class="btn primary online-btn" href="${esc(w.online.url)}" target="_blank" rel="noopener">보강수업 들어가기 ↗</a>` : `<p class="muted">수업 링크는 추후 공지됩니다.</p>`}
              </div>` : ""}
              ${images.length ? `
              <div class="week-block">
                <h5>🖼️ 참고 그림</h5>
                <div class="art-grid">
                  ${images.map((im, i) => { const a = artInfo(im); return `
                    <figure class="art">
                      <button type="button" class="art-thumb" data-week="${w.week}" data-i="${i}" aria-label="${esc(im.title)} 크게 보기">
                        <img src="${esc(a.thumb)}" alt="${esc(im.title)}" loading="lazy">
                        <span class="art-zoom">🔍</span>
                      </button>
                      <figcaption>
                        <b>${esc(im.title)}</b>
                        <span class="art-links">
                          ${a.wiki ? `<a href="${esc(a.wiki)}" target="_blank" rel="noopener">위키백과 ↗</a>` : ""}
                          ${a.source ? `<a href="${esc(a.source)}" target="_blank" rel="noopener">그림 출처 ↗</a>` : ""}
                        </span>
                      </figcaption>
                    </figure>`; }).join("")}
                </div>
                <p class="art-credit">그림: 위키미디어 공용(Wikimedia Commons) · 퍼블릭 도메인 · 누르면 크게 볼 수 있어요</p>
              </div>` : ""}
              ${videos.length ? `
              <div class="week-block">
                <h5>🎬 참고영상</h5>
                <ul class="video-list">
                  ${videos.map((v) => `<li><a href="${esc(videoUrl(v))}" target="_blank" rel="noopener">
                      <span class="play">▶</span>
                      <span class="v-text"><b>${esc(v.title)}</b><small>${v.url ? "영상 링크" : "유튜브 검색"} · 새 창에서 열기</small></span>
                      <span class="ext">↗</span>
                    </a></li>`).join("")}
                </ul>
              </div>` : ""}
            </div>
          </details>`;
        }).join("")}
      </div>`;

    $$("#curriculum .era-link").forEach((b) => b.addEventListener("click", () => openEra(b.dataset.era)));
    $$("#curriculum .art-thumb").forEach((b) => b.addEventListener("click", () => openArt(b.dataset.week, Number(b.dataset.i))));
    setupCalendar();
  }

  // 첫 화면 '일정' 카드를 수업 날짜로 자동 채우기 (config 에서 auto: true 인 항목)
  function scheduleSummary() {
    if (!allSessions.length) return null;
    const a = allSessions[0].date, b = allSessions[allSessions.length - 1].date;
    const pad = (n) => String(n).padStart(2, "0");
    return {
      value: `${a.getFullYear()}.${pad(a.getMonth() + 1)}.${pad(a.getDate())} ~ ${pad(b.getMonth() + 1)}.${pad(b.getDate())}`,
      sub: `${CUR.weeks.length}주 과정 · 매주 ${classDays.map((c) => c.day).join("·")}`
    };
  }

  /* ===== 4단계: 수강안내 · FAQ · 교수자 ===== */
  function donut(items) {
    const colors = ["var(--pink-deep)", "var(--purple)", "var(--pink)", "var(--lavender)"];
    const total = items.reduce((s, i) => s + Number(i.value), 0) || 1;
    const r = 70, circ = 2 * Math.PI * r;
    let offset = 0;
    const arcs = items.map((it, idx) => {
      const len = (it.value / total) * circ;
      const seg = `<circle r="${r}" cx="90" cy="90" fill="none" stroke="${colors[idx % colors.length]}" stroke-width="26"
        stroke-dasharray="${Math.max(len - 3, 0)} ${circ}" stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)"><title>${esc(it.label)} ${it.value}%</title></circle>`;
      offset += len;
      return seg;
    }).join("");
    const svg = `<svg class="donut" viewBox="0 0 180 180" role="img" aria-label="평가 비율">${arcs}
      <text x="90" y="86" text-anchor="middle" font-size="14" fill="var(--ink-soft)">합계</text>
      <text x="90" y="110" text-anchor="middle" font-size="24" font-weight="700" fill="var(--purple)">${total}</text></svg>`;
    const legend = `<ul class="legend">${items.map((it, idx) => `<li><i style="background:${colors[idx % colors.length]}"></i>${esc(it.label)}<b>${esc(it.value)}%</b></li>`).join("")}</ul>`;
    return `<div class="donut-wrap">${svg}${legend}</div>`;
  }

  function renderGuide() {
    const g = C.guide;
    $("#guide").innerHTML = `
      ${head(g)}
      <div class="grid guide-top">
        <div class="card reveal">
          <h3>평가 방법</h3>
          ${donut(g.evaluation)}
          ${g.evaluationNote ? `<p class="eval-note">${esc(g.evaluationNote)}</p>` : ""}
        </div>
        <div class="grid guide-cards">
          ${g.cards.map((c) => `
            <div class="card hover reveal">
              <h4>${esc(c.icon)} ${esc(c.title)}</h4>
              <ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
            </div>`).join("")}
        </div>
      </div>
      <div class="card books reveal">
        <h3>📚 ${esc(g.booksTitle)}</h3>
        <table>
          <thead><tr><th>도서명</th><th>저자</th><th>출판사</th><th>출판년도</th></tr></thead>
          <tbody>${g.books.map((b) => `<tr><td>${esc(b.title)}</td><td>${esc(b.author)}</td><td>${esc(b.publisher)}</td><td>${esc(b.year)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
      <div class="card apply-card reveal" id="apply-form"></div>`;
  }

  function renderFaq() {
    const f = C.faq;
    $("#faq").innerHTML = `
      ${head(f)}
      <div class="faq-list">
        ${f.items.map((it, i) => `
          <details class="card faq-item reveal" ${i === 0 ? "open" : ""}>
            <summary>${esc(it.q)}</summary>
            <div class="answer">${nl2br(it.a)}</div>
          </details>`).join("")}
      </div>`;
    // 하나를 열면 나머지는 닫기
    $$(".faq-item").forEach((d) => d.addEventListener("toggle", () => {
      if (d.open) $$(".faq-item").forEach((o) => o !== d && (o.open = false));
    }));
  }

  // 교수자 수상·저서·논문·일반논문: 한 줄씩 — 오른쪽 화살표(›)를 누르면 펼쳐서 자세히 보기
  const profAcc = (title, items, row) => (items && items.length ? `
    <details class="prof-acc">
      <summary><span class="pa-title">${title}</span><span class="prof-count">${items.length}</span><span class="pa-arrow" aria-hidden="true">›</span></summary>
      <ul class="prof-list">${items.map(row).join("")}</ul>
    </details>` : "");

  /* 푸터: 수강준비물 · 교수자 · 연락처 */
  function renderFooter() {
    const f = C.footer, p = f.professor;
    const link = (label, v) =>
      label === "이메일" ? `<a href="mailto:${esc(v)}">${esc(v)}</a>`
      : label === "전화" ? `<a href="tel:${esc(v.replace(/[^0-9+]/g, ""))}">${esc(v)}</a>`
      : esc(v);
    const contacts = f.contact.items.filter((c) => c.value);
    $("#professors").innerHTML = `
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="card footer-card reveal">
            <h3>🎒 ${esc(f.prep.title)}</h3>
            <ul class="prep-list">
              ${f.prep.items.map((i) => `<li><span>${esc(i.icon)}</span>${esc(i.text)}</li>`).join("")}
            </ul>
          </div>
          <div class="card footer-card prof reveal">
            <div class="prof-row">
              <div class="avatar">${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)} 사진">` : esc((p.name || "?").trim().charAt(0))}</div>
              <div class="prof-id">
                <small class="prof-kicker">${esc(p.title)}</small>
                <strong class="prof-name">${esc(p.name)} <span>${esc(p.position)}</span></strong>
                ${p.field ? `<span class="chip">${esc(p.field)}</span>` : ""}
              </div>
            </div>
            ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ""}
            ${p.history && p.history.length ? `<ul class="history-mini">
              ${p.history.map((h) => `<li><b>${esc(h.label)}</b><span>${esc(h.text)}</span></li>`).join("")}
            </ul>` : ""}
            ${(() => {
              const T = p.listTitles || {};
              const pub = (b) => `<li><time>${esc(b.when)}</time><span>${b.type ? `<em class="pub-type ${b.type === "단독" ? "solo" : ""}">${esc(b.type)}</em>` : ""}<strong>${esc(b.title)}</strong> <small>${esc(b.publisher)}</small>${b.note ? ` <small class="pub-note">${esc(b.note)}</small>` : ""}</span></li>`;
              const paper = (r) => `<li><time>${esc(r.when)}</time><span><strong>${esc(r.title)}</strong> <small>${esc(r.journal)}</small>${r.note ? ` <small class="pub-note">${esc(r.note)}</small>` : ""}</span></li>`;
              return `<div class="prof-acc-group">
                ${profAcc(T.awards || "🏆 수상", p.awards, (a) => `<li><time>${esc(a.when)}</time><span>${esc(a.text)}</span></li>`)}
                ${profAcc(T.papers || "📝 학술논문", p.papers, paper)}
                ${profAcc(T.articles || "📄 일반논문", p.articles, paper)}
                ${profAcc(T.publications || "📚 저서", p.publications, pub)}
              </div>`;
            })()}
          </div>
          <div class="card footer-card reveal">
            <h3>📮 ${esc(f.contact.title)}</h3>
            ${contacts.length ? `<ul class="contact-list">
              ${contacts.map((c) => `<li><span>${esc(c.icon)}</span><div><small>${esc(c.label)}</small>${link(c.label, c.value)}</div></li>`).join("")}
            </ul>` : `<p class="bio">연락처를 config.js 에 입력해 주세요.</p>`}
          </div>
        </div>
        <div class="footer-bottom">
          <strong>${esc(C.site.logoIcon)} ${esc(f.bottomText)}</strong>
          <p>${esc(f.copyright)}</p>
        </div>
      </div>`;
  }

  /* ===== 공통 동작 ===== */
  function openModal(html) {
    $("#modalBody").innerHTML = html;
    $("#modal").classList.add("open");
    $("#modal").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $(".modal-close").focus();
  }
  function closeModal() {
    $("#modal").classList.remove("open");
    $("#modal").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  $$("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

  function setupScroll() {
    const topbar = $("#topbar"), toTop = $("#toTop");
    const links = $$("#nav a");
    // 메뉴에 없는 섹션은 바로 위 메뉴 항목에 속하도록 (예: 강의소개 → 프로그램 소개)
    const order = [$("#hero"), ...$$("main > section.section"), $("#professors")].map((s) => s.id);
    const navIds = C.nav.map((n) => n.id);
    const owner = {};
    let last = null;
    order.forEach((id) => { if (navIds.includes(id)) last = id; owner[id] = last; });

    const onScroll = () => {
      const y = window.scrollY;
      topbar.classList.toggle("scrolled", y > 10);
      toTop.classList.toggle("show", y > 600);
      let active = null;
      order.forEach((id) => { const el = document.getElementById(id); if (el.offsetTop - 140 <= y) active = owner[id]; });
      if (window.innerHeight + y >= document.body.scrollHeight - 4) active = navIds[navIds.length - 1];
      links.forEach((a) => a.classList.toggle("active", a.dataset.id === active));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-w]", en.target).forEach((bar) => (bar.style.width = bar.dataset.w));
      io.unobserve(en.target);
    }), { threshold: 0.12 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* 벚꽃잎 흩날림 */
  function petals() {
    const t = C.theme || {};
    const canvas = $("#petals");
    if (!t.petals || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { canvas.remove(); return; }
    const ctx = canvas.getContext("2d");
    const colors = [t.pink || "#f6a5c0", t.lavender || "#c9b6ea", "#ffd6e4"];
    let W, H, list;
    const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
    const make = (initial) => ({
      x: Math.random() * W, y: initial ? Math.random() * H : -20,
      s: 6 + Math.random() * 8, vy: 0.4 + Math.random() * 0.9, vx: -0.3 + Math.random() * 0.8,
      r: Math.random() * Math.PI * 2, vr: -0.02 + Math.random() * 0.04, sw: Math.random() * Math.PI * 2,
      c: colors[Math.floor(Math.random() * colors.length)], a: 0.45 + Math.random() * 0.4
    });
    resize();
    addEventListener("resize", resize);
    const count = innerWidth < 600 ? Math.ceil((t.petalCount || 20) / 2) : (t.petalCount || 20);
    list = Array.from({ length: count }, () => make(true));
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      list.forEach((p, i) => {
        p.sw += 0.02; p.x += p.vx + Math.sin(p.sw) * 0.5; p.y += p.vy; p.r += p.vr;
        if (p.y > H + 20 || p.x < -30 || p.x > W + 30) list[i] = make(false);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.moveTo(0, -p.s);
        ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.7, p.s * 0.6, 0, p.s);
        ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.6, -p.s * 0.9, -p.s * 0.6, 0, -p.s);
        ctx.fill(); ctx.restore();
      });
      requestAnimationFrame(draw);
    })();
  }

  /* ===== 5단계: 공지 · 수강신청 · 과제 제출 ===== */
  const fmtDate = (s) => { const d = parseDate(s); return d ? `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}` : esc(s); };
  function sortedNotices() {
    const items = ((C.notices || {}).items || []).slice();
    return items.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
  }
  function renderNotices() {
    const n = C.notices || {};
    const items = sortedNotices();
    const el = $("#notice");
    if (!items.length) { el.innerHTML = ""; el.hidden = true; return; }
    el.hidden = false;
    const LIMIT = 3;
    el.innerHTML = `
      ${head(n)}
      <div class="notice-list">
        ${items.map((it, i) => `
          <details class="card notice-item reveal ${i >= LIMIT ? "extra" : ""} ${it.important ? "important" : ""}" ${i === 0 ? "open" : ""}>
            <summary>
              ${it.pinned ? '<span class="tag tag-pin">📌 고정</span>' : ""}
              ${it.important ? '<span class="tag tag-imp">중요</span>' : ""}
              <strong>${esc(it.title)}</strong>
              <time>${fmtDate(it.date)}</time>
            </summary>
            <div class="notice-body">${nl2br(it.body)}</div>
          </details>`).join("")}
        ${items.length > LIMIT ? `<button class="btn ghost notice-more">공지 ${items.length - LIMIT}개 더 보기</button>` : ""}
      </div>`;
    const more = $(".notice-more", el);
    if (more) more.addEventListener("click", () => { el.classList.add("show-all"); more.remove(); });
  }

  const field = (name, label, attrs = "", type = "text") =>
    `<label class="f"><span>${label}</span><input name="${name}" type="${type}" ${attrs}></label>`;
  const SID_ATTR = 'required inputmode="numeric" pattern="[0-9]{6,12}" title="숫자 6~12자리"';
  // 양식 보내기: 성공하면 완료 문구로 바꾸고, 버튼을 누르면 onDone (없으면 팝업 닫기)
  async function submitForm(form, key, extra, doneMsg, onDone) {
    const btn = $("button[type=submit]", form);
    const data = Object.fromEntries(new FormData(form).entries());
    btn.disabled = true; btn.textContent = "보내는 중…";
    try {
      await window.SiteStore.submit(key, Object.assign(data, extra));
      const wrap = document.createElement("div");
      wrap.className = "form-done";
      wrap.innerHTML = `🌸<p>${esc(doneMsg)}</p><button type="button" class="btn primary">${onDone ? "확인" : "닫기"}</button>`;
      form.replaceWith(wrap);
      $("button", wrap).addEventListener("click", onDone || closeModal);
    } catch (e) {
      btn.disabled = false; btn.textContent = "다시 보내기";
      $(".form-err", form).textContent = "보내지 못했어요: " + e.message;
    }
  }

  /* --- 맨 위 알림 띠: 수강신청 안내 --- */
  function renderBanner() {
    const b = C.banner || {};
    const el = $("#topBanner");
    let closed = false;
    try { closed = sessionStorage.getItem("kuj-banner-closed") === (b.text || ""); } catch (e) {}
    if (!b.show || !b.text || closed) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `
      <div class="banner-inner">
        <span class="banner-icon" aria-hidden="true">📢</span>
        <p>${esc(b.text)}</p>
        ${b.button ? `<a class="banner-btn" href="${esc(b.href || "#apply")}">${esc(b.button)} →</a>` : ""}
        <button type="button" class="banner-x" aria-label="알림 닫기">×</button>
      </div>`;
    $(".banner-x", el).addEventListener("click", () => {
      el.hidden = true;
      try { sessionStorage.setItem("kuj-banner-closed", b.text || ""); } catch (e) {}
    });
  }

  /* --- 수강안내 안의 수강신청서 --- */
  function renderApplyForm() {
    const a = C.apply || {};
    const box = $("#apply-form");
    if (!box) return;
    box.innerHTML = `
      <div class="apply-head">
        <h3>📝 ${esc(a.title || "수강신청서")}</h3>
        ${a.period ? `<span class="chip pink">${esc(a.period)}</span>` : ""}
      </div>
      <p class="muted">${esc(a.intro || "")}</p>
      <form class="pub-form" id="applyForm">
        <div class="f-grid">
          ${field("sid", "학번 *", SID_ATTR)}
          ${field("name", "이름 *", "required")}
          ${field("dept", "학과 *", "required")}
          <label class="f"><span>학년 *</span><select name="year" required><option value="">선택</option><option>1</option><option>2</option><option>3</option><option>4</option><option>기타</option></select></label>
          ${field("email", "이메일 *", "required", "email")}
          ${field("phone", "연락처", 'placeholder="010-0000-0000"', "tel")}
        </div>
        <label class="f"><span>신청 동기 (선택)</span><textarea name="reason" rows="3"></textarea></label>
        <label class="consent"><input type="checkbox" name="consent" value="동의" required> ${esc(a.consent || "개인정보 수집에 동의합니다.")}</label>
        <p class="form-err" role="alert"></p>
        <button type="submit" class="btn primary">수강신청서 제출하기</button>
      </form>`;
    $("#applyForm").addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(e.target, "enrollments", { status: "대기" }, a.done || "신청이 접수되었습니다.", renderApplyForm);
    });
  }
  function goApply() {
    const box = $("#apply-form");
    if (!box) return;
    box.scrollIntoView({ behavior: "smooth", block: "start" });
    box.classList.add("flash");
    setTimeout(() => box.classList.remove("flash"), 1600);
    setTimeout(() => { const i = $("#applyForm [name=sid]"); if (i) i.focus({ preventScroll: true }); }, 700);
  }

  function openSubmit(week) {
    const w = CUR.weeks.find((x) => String(x.week) === String(week));
    if (!w || !w.assignment) return;
    openModal(`
      <h3 id="modalTitle">📤 과제 제출</h3>
      <p class="muted">${w.week}주차 · ${esc(w.assignment.title)}${w.assignment.due ? ` · 기한: ${esc(w.assignment.due)}` : ""}</p>
      <form class="pub-form" id="submitForm">
        <div class="f-grid">
          ${field("sid", "학번 *", SID_ATTR)}
          ${field("name", "이름 *", "required")}
        </div>
        ${field("link", "제출 파일 링크 * (구글 드라이브 등 공유 링크)", 'required placeholder="https://"', "url")}
        <label class="f"><span>메모 (선택)</span><textarea name="note" rows="2"></textarea></label>
        <p class="form-err" role="alert"></p>
        <button type="submit" class="btn primary">제출하기</button>
      </form>`);
    $("#submitForm").addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(e.target, "submissions", { week: w.week, assignment: w.assignment.title }, "과제가 제출되었습니다. 수고했어요 🌸");
    });
  }

  /* --- 참여하기 --- */
  const assignments = () => CUR.weeks.filter((w) => w.assignment && w.assignment.title);
  const onlineSessions = () => allSessions.filter((s) => s.online);
  function renderJoin() {
    const j = C.join || {};
    const asg = assignments(), onl = onlineSessions();
    $("#join").innerHTML = `
      ${head(j)}
      <div class="grid join-grid">
        <div class="card hover join-card reveal">
          <div class="join-icon">📝</div>
          <h3>수강신청</h3>
          <p>${esc(j.applyText || "수강안내의 수강신청서를 작성해 제출하세요.")}</p>
          <a class="btn primary" href="#apply">수강신청서 쓰러 가기 →</a>
        </div>
        <div class="card hover join-card reveal">
          <div class="join-icon">📤</div>
          <h3>과제 제출</h3>
          ${asg.length ? `<ul class="join-list">${asg.map((w) => `
            <li><span><b>${w.week}주차</b> ${esc(w.assignment.title)}${w.assignment.due ? `<small>기한: ${esc(w.assignment.due)}</small>` : ""}</span>
              <button type="button" class="btn ghost submit-assign" data-week="${w.week}">제출</button></li>`).join("")}</ul>`
            : `<p class="muted">지금은 제출할 과제가 없어요.</p>`}
        </div>
        <div class="card hover join-card reveal">
          <div class="join-icon">💻</div>
          <h3>온라인 보강수업</h3>
          ${onl.length ? `<ul class="join-list">${onl.map((s) => `
            <li><span><b>${s.w.week}주차</b> ${dateLabel(s.date)} ${esc(s.time)}<small>${esc(s.topic)}</small></span>
              ${s.url ? `<a class="btn ghost" href="${esc(s.url)}" target="_blank" rel="noopener">입장 ↗</a>` : `<span class="chip">링크 추후 공지</span>`}</li>`).join("")}</ul>`
            : `<p class="muted">예정된 온라인 보강수업이 없어요.</p>`}
        </div>
        <div class="card hover join-card reveal">
          <div class="join-icon">🏫</div>
          <h3>내 강의실</h3>
          <p>${esc(j.myroomText || "학번과 이름으로 내 출석·과제·수강신청 현황을 확인할 수 있어요.")}</p>
          <a class="btn ghost" href="#myroom">내 강의실 가기 →</a>
        </div>
      </div>
      ${surveyHistory()}`;
    // 관리자 로그인·로그아웃 뒤 다시 그릴 때는 등장 효과 없이 바로 보이게
    if (joinDrawn) $$("#join .reveal").forEach((el) => el.classList.add("in"));
    joinDrawn = true;
  }
  let joinDrawn = false;

  /* --- 설문 (관리자 화면 → 설문 에서 만들기·수정·삭제) --- */
  const surveys = () => ((C.surveys || {}).items || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  // 상태: 관리자가 '마감'으로 바꿨거나 마감일이 지나면 응답을 받지 않아요
  function surveyState(sv) {
    if (sv.status === "closed") return { open: false, label: "마감" };
    if (sv.deadline && sv.deadline < ymd(new Date())) return { open: false, label: "기한 지남" };
    return { open: true, label: "진행 중" };
  }
  const fmtDT = (iso) => { const d = new Date(iso); return isNaN(d) ? "-" : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  const isAdmin = () => { try { return !!sessionStorage.getItem("kuj-admin-auth"); } catch (e) { return false; } };
  function surveyHistory() {
    const list = surveys(), admin = isAdmin();
    if (!list.length && !admin) return "";
    return `
      <div class="card survey-history reveal">
        <div class="sh-head">
          <div><h3>🗳️ 설문 히스토리</h3><p class="muted">진행 중인 설문은 <b>열기</b>를 눌러 참여할 수 있어요.</p></div>
          ${admin ? `<button type="button" class="btn primary sh-new" data-sv="new">＋ 새 설문</button>` : ""}
        </div>
        ${list.length ? `<div class="sh-wrap"><table class="sh-table">
          <thead><tr><th>생성일시</th><th>설문 주제</th><th>상태</th><th>마감일</th><th>열기</th>${admin ? "<th>수정</th><th>삭제</th>" : ""}</tr></thead>
          <tbody>${list.map((sv) => { const st = surveyState(sv); return `<tr>
            <td data-label="생성일시" class="nowrap">${fmtDT(sv.createdAt)}</td>
            <td data-label="설문 주제"><b>${esc(sv.title)}</b>${sv.description ? `<small>${esc(sv.description)}</small>` : ""}</td>
            <td data-label="상태"><span class="status-pill ${st.open ? "green" : "gray"}">${st.label}</span></td>
            <td data-label="마감일" class="nowrap">${sv.deadline ? fmtDate(sv.deadline) : "-"}</td>
            <td data-label="열기"><button type="button" class="btn ${st.open ? "primary" : "ghost"} sm" data-sv="open" data-id="${esc(sv.id)}">${st.open ? "참여하기" : "열기"}</button></td>
            ${admin ? `<td data-label="수정"><button type="button" class="btn ghost sm" data-sv="edit" data-id="${esc(sv.id)}">수정</button></td>
            <td data-label="삭제"><button type="button" class="btn ghost sm danger" data-sv="del" data-id="${esc(sv.id)}">삭제</button></td>` : ""}
          </tr>`; }).join("")}</tbody>
        </table></div>` : `<p class="muted sh-empty">아직 만든 설문이 없어요. <b>＋ 새 설문</b>으로 첫 설문을 만들어 보세요.</p>`}
      </div>`;
  }
  const SCALE = ["전혀 아니다", "아니다", "보통이다", "그렇다", "매우 그렇다"];
  function openSurvey(id) {
    const sv = surveys().find((x) => x.id === id);
    if (!sv) return;
    const st = surveyState(sv);
    const qHtml = (q, i) => {
      const name = "a_" + q.id, req = q.required ? "required" : "";
      const opts = (q.options || []).filter(Boolean);
      let input;
      if (q.type === "single") input = opts.map((o, j) => `<label class="sv-opt"><input type="radio" name="${name}" value="${esc(o)}" ${j === 0 ? req : ""}><span>${esc(o)}</span></label>`).join("");
      else if (q.type === "multi") input = opts.map((o) => `<label class="sv-opt"><input type="checkbox" name="${name}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("");
      else if (q.type === "scale") input = `<div class="sv-scale">${SCALE.map((l, j) => `<label><input type="radio" name="${name}" value="${j + 1}" ${j === 0 ? req : ""}><span><b>${j + 1}</b><small>${l}</small></span></label>`).join("")}</div>`;
      else if (q.type === "long") input = `<textarea name="${name}" rows="3" ${req}></textarea>`;
      else input = `<input type="text" name="${name}" ${req}>`;
      return `<fieldset class="sv-field" data-q="${esc(q.id)}" data-type="${esc(q.type)}" ${q.required ? "data-req" : ""}>
        <legend>Q${i + 1}. ${esc(q.text)}${q.required ? ' <em class="req">*</em>' : ""}${q.type === "multi" ? " <small>(여러 개 고를 수 있어요)</small>" : ""}</legend>
        ${input}</fieldset>`;
    };
    openModal(`
      <h3 id="modalTitle">🗳️ ${esc(sv.title)}</h3>
      <p class="muted">${sv.deadline ? `마감 ${fmtDate(sv.deadline)} · ` : ""}<span class="status-pill ${st.open ? "green" : "gray"}">${st.label}</span></p>
      ${sv.description ? `<p>${nl2br(sv.description)}</p>` : ""}
      ${st.open ? `
      <form class="pub-form sv-form" id="surveyForm" novalidate>
        ${sv.collectId ? `<div class="f-grid">${field("sid", "학번 *", SID_ATTR)}${field("name", "이름 *", "required")}</div>` : `<p class="muted">🔒 익명 설문이에요. 이름을 적지 않아요.</p>`}
        ${(sv.questions || []).map(qHtml).join("")}
        <p class="form-err" role="alert"></p>
        <button type="submit" class="btn primary">응답 보내기</button>
      </form>` : `<div class="cd-empty"><span>🌸</span><p>응답을 받지 않는 설문이에요. 참여해 주셔서 고마워요.</p></div>`}`);
    const form = $("#surveyForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $(".form-err", form), btn = $("button[type=submit]", form);
      $$(".sv-field.bad", form).forEach((f) => f.classList.remove("bad"));
      // 필수 질문 확인 (여러 개 고르기는 브라우저가 확인하지 못해서 직접)
      const missing = $$(".sv-field[data-req]", form).filter((f) => !$$("input, textarea", f).some((i) => (i.type === "radio" || i.type === "checkbox" ? i.checked : i.value.trim())));
      missing.forEach((f) => f.classList.add("bad"));
      if (!form.checkValidity() || missing.length) {
        err.textContent = missing.length ? `답하지 않은 필수 질문이 ${missing.length}개 있어요.` : "학번(숫자 6~12자리)과 이름을 확인해 주세요.";
        (missing[0] || $(":invalid", form)).scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const data = { surveyId: sv.id, surveyTitle: sv.title };
      if (sv.collectId) { data.sid = form.sid.value.trim(); data.name = form.name.value.trim(); }
      // 답은 질문마다 a_<질문id> 한 칸에 (여러 개 고르기는 줄바꿈으로 묶어서) 저장
      (sv.questions || []).forEach((q) => {
        const vals = new FormData(form).getAll("a_" + q.id).map((v) => String(v).trim()).filter(Boolean);
        if (vals.length) data["a_" + q.id] = vals.join("\n");
      });
      btn.disabled = true; btn.textContent = "보내는 중…";
      try {
        await window.SiteStore.submit("surveyResponses", data);
        const wrap = document.createElement("div");
        wrap.className = "form-done";
        wrap.innerHTML = `🌸<p>응답이 전달되었어요. 참여해 주셔서 고마워요!</p><button type="button" class="btn primary">닫기</button>`;
        form.replaceWith(wrap);
        $("button", wrap).addEventListener("click", closeModal);
      } catch (ex) {
        btn.disabled = false; btn.textContent = "다시 보내기";
        err.textContent = "보내지 못했어요: " + ex.message;
      }
    });
  }
  // 설문 히스토리 표의 버튼: 열기는 여기서, 새 설문·수정·삭제는 관리자 화면(admin.js)으로
  $("#join").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sv]");
    if (!b) return;
    if (b.dataset.sv === "open") openSurvey(b.dataset.id);
    else if (window.SiteAdmin && window.SiteAdmin.survey) window.SiteAdmin.survey(b.dataset.sv, b.dataset.id);
  });

  /* --- 내 강의실: 학번 + 이름으로 내 현황 보기 --- */
  function renderMyRoom() {
    const m = C.myroom || {};
    $("#myroom").innerHTML = `
      ${head(m)}
      <div class="card myroom-login reveal">
        <form id="myroomForm" class="pub-form" autocomplete="off">
          <div class="f-grid">
            ${field("sid", "학번", SID_ATTR)}
            ${field("name", "이름", "required")}
          </div>
          <p class="muted">${esc(m.note || "")}</p>
          <p class="form-err" role="alert"></p>
          <button type="submit" class="btn primary">내 강의실 들어가기</button>
        </form>
      </div>
      <div id="myroomResult"></div>`;
    $("#myroomForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, btn = $("button[type=submit]", f), err = $(".form-err", f);
      btn.disabled = true; btn.textContent = "확인 중…"; err.textContent = "";
      try {
        const r = await window.SiteStore.myRoom(f.sid.value.trim(), f.name.value.trim());
        if (!r || !r.found) { err.textContent = "기록을 찾지 못했어요. 수강신청 때 쓴 학번과 이름을 확인해 주세요."; $("#myroomResult").innerHTML = ""; }
        else showMyRoom(r);
      } catch (ex) { err.textContent = "불러오지 못했어요: " + ex.message; }
      btn.disabled = false; btn.textContent = "내 강의실 들어가기";
    });
  }
  function showMyRoom(r) {
    const m = C.myroom || {};
    const st = r.student || {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sessions = allSessions.filter((s) => !s.holiday);
    const done = sessions.filter((s) => s.date <= today);
    const att = r.attendance || {};
    const t = { 출석: 0, 지각: 0, 결석: 0, 공결: 0 };
    done.forEach((s) => { if (att[s.key]) t[att[s.key]]++; });
    const recorded = t.출석 + t.지각 + t.결석 + t.공결;
    const rate = recorded ? Math.round(((t.출석 + t.지각 + t.공결) / recorded) * 100) : null;
    const status = r.inRoster ? ["수강생 등록 완료", "green"] : r.enrollment ? ({ 승인: ["수강 승인", "green"], 반려: ["신청 반려", "gray"] }[r.enrollment.status] || ["신청 접수 · 확인 중", "amber"]) : ["신청 기록 없음", "gray"];
    const next = sessions.find((s) => s.date >= today);
    const subsOf = (week) => (r.submissions || []).filter((x) => String(x.week) === String(week)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    $("#myroomResult").innerHTML = `
      <div class="grid myroom-grid">
        <div class="card myroom-card reveal in">
          <h3>🙋 ${esc(st.name)} 님</h3>
          <p class="muted">${esc(st.sid)}${st.dept ? " · " + esc(st.dept) : ""}${st.year ? " · " + esc(st.year) + "학년" : ""}</p>
          <span class="status-pill ${status[1]}">${status[0]}</span>
          ${next ? `<div class="myroom-next"><small>다음 수업</small><b>${next.w.week}주차 · ${dateLabel(next.date)} ${esc(next.time)}</b><span>${esc(next.topic)} · ${esc(next.place)}</span></div>` : ""}
        </div>
        <div class="card myroom-card reveal in">
          <h3>✅ 출석</h3>
          <div class="att-sum">
            ${["출석", "지각", "결석", "공결"].map((k) => `<div class="att-${k}"><b>${t[k]}</b><small>${k}</small></div>`).join("")}
          </div>
          <p class="muted">${rate === null ? "아직 기록된 출석이 없어요." : `출석률 <b>${rate}%</b> · 기록된 수업 ${recorded}회 / 지난 수업 ${done.length}회`}</p>
          ${recorded ? `<div class="att-dots">${done.map((s) => `<span class="dot ${att[s.key] ? "d-" + att[s.key] : "d-none"}" title="${s.w.week}주차 ${dateLabel(s.date)} · ${att[s.key] || "기록 없음"}"></span>`).join("")}</div>` : ""}
        </div>
        <div class="card myroom-card reveal in">
          <h3>📤 과제</h3>
          ${assignments().length ? `<ul class="join-list">${assignments().map((w) => {
            const g = (r.grades || {})["w" + w.week] || {}, sub = subsOf(w.week)[0];
            const s = g.status || (sub ? "제출" : "미제출");
            return `<li><span><b>${w.week}주차</b> ${esc(w.assignment.title)}
              <small>${sub ? `제출: ${new Date(sub.createdAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}` : w.assignment.due ? `기한: ${esc(w.assignment.due)}` : ""}${m.showScores && g.score !== undefined && g.score !== "" ? ` · 점수 ${esc(g.score)}` : ""}</small></span>
              ${s === "미제출" ? `<button type="button" class="btn primary submit-assign" data-week="${w.week}">제출하기</button>` : `<span class="status-pill ${s === "면제" ? "gray" : "green"}">${esc(s)}</span>`}</li>`;
          }).join("")}</ul>` : `<p class="muted">등록된 과제가 없어요.</p>`}
        </div>
      </div>`;
    $("#myroomResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // '#apply' 링크 → 수강안내의 수강신청서로 이동, '과제 제출하기' 버튼 → 제출 창
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#apply"]');
    if (a) { e.preventDefault(); goApply(); return; }
    const s = e.target.closest(".submit-assign");
    if (s) { e.preventDefault(); openSubmit(s.dataset.week); }
  });

  // 관리자 화면(admin.js)에서 함께 쓰는 값들
  window.SiteApp = { C, CUR, allSessions, weekSessions, regularDates, weekOfDate, parseDate, dateLabel, ymd, esc, openModal, closeModal, offLabel, surveyState, fmtDT, SCALE, renderJoin };

  applyTheme();
  renderBanner();
  renderHeader();
  renderHero();
  renderNotices();
  renderAbout();
  renderCourse();
  renderCurriculum();
  renderGuide();
  renderApplyForm();
  renderJoin();
  renderMyRoom();
  renderFaq();
  renderFooter();
  setupScroll();
  petals();
  document.dispatchEvent(new CustomEvent("site:ready"));
  if (location.hash === "#apply") setTimeout(goApply, 300);
});
