/* ==========================================================
 *  데이터 저장소 (store.js)
 *  - 사이트 내용 수정본, 공지, 수강생 명단, 출석, 과제, 수강신청을 저장합니다.
 *  - config.js 의 backend 설정에 따라 두 가지 방식으로 동작합니다.
 *      local : 지금 사용하는 브라우저에만 저장 (설치 없이 바로 사용)
 *      gas   : 구글 스프레드시트(Apps Script)에 저장 → 모든 기기·학생과 공유
 *  이 파일은 고칠 필요가 없습니다.
 * ========================================================== */
(function () {
  const FILE_CONFIG = window.SITE_CONFIG || {};
  const backend = FILE_CONFIG.backend || {};
  const mode = backend.type === "gas" && backend.url ? "gas" : "local";
  const PREFIX = "kuj-site:";

  /* ---------- SHA-256 (비밀번호를 그대로 저장하지 않기 위한 해시) ---------- */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const ror = (x, n) => (x >>> n) | (x << (32 - n));
  function sha256Hex(str) {
    const msg = new TextEncoder().encode(str);
    const len = msg.length;
    const total = ((len + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(total);
    buf.set(msg);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 4, (len * 8) >>> 0);
    dv.setUint32(total - 8, Math.floor((len * 8) / 4294967296));
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const W = new Uint32Array(64);
    for (let i = 0; i < total; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = ror(W[t - 15], 7) ^ ror(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = ror(W[t - 2], 17) ^ ror(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) >>> 0;
        const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H = [H[0] + a, H[1] + b, H[2] + c, H[3] + d, H[4] + e, H[5] + f, H[6] + g, H[7] + h].map((x) => x >>> 0);
    }
    return H.map((x) => x.toString(16).padStart(8, "0")).join("");
  }
  // 소금(salt)을 붙여 여러 번 해시 → 코드에는 결과값만 남고 비밀번호는 보이지 않습니다
  function hashPassword(pw, salt, iterations) {
    let h = sha256Hex(String(salt) + String(pw));
    for (let i = 1; i < (iterations || 1000); i++) h = sha256Hex(h);
    return h;
  }
  const randomHex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

  /* ---------- 저장 방식별 동작 ---------- */
  const lsGet = (k, d) => { try { const v = localStorage.getItem(PREFIX + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => localStorage.setItem(PREFIX + k, JSON.stringify(v));
  const lsDel = (k) => { try { localStorage.removeItem(PREFIX + k); } catch (e) {} };

  async function gas(action, payload) {
    const res = await fetch(backend.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },   // 구글 Apps Script 와 통신하는 방식
      body: JSON.stringify(Object.assign({ action }, payload || {}))
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "서버 오류");
    return json.data;
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const PUBLIC_KEYS = ["enrollments", "submissions", "surveyResponses"];   // 학생이 '추가'만 할 수 있는 데이터

  const Store = {
    mode,
    sha256Hex,
    hashPassword,
    randomHex,
    fileConfig: JSON.parse(JSON.stringify(FILE_CONFIG)),
    usingOverride: false,

    /* 관리자 데이터 (명단·출석·과제·신청내역) — 구글 방식에서는 비밀번호로 확인 */
    async get(key, def, auth) {
      if (mode === "local") return lsGet(key, def);
      const v = await gas("get", { key, auth });
      return v === null || v === undefined ? def : v;
    },
    async set(key, value, auth) {
      if (mode === "local") return lsSet(key, value);
      return gas("set", { key, value, auth });
    },
    /* 학생 제출 (수강신청·과제 제출) — 누구나 추가만 가능 */
    async submit(key, item) {
      if (!PUBLIC_KEYS.includes(key)) throw new Error("허용되지 않은 저장 항목");
      const row = Object.assign({}, item, { id: uid(), createdAt: new Date().toISOString() });
      if (mode === "local") { const list = lsGet(key, []); list.push(row); lsSet(key, list); return row; }
      return gas("submit", { key, item: row });
    },
    /* 사이트 내용(공지 포함) 수정본 저장 */
    async saveConfig(cfg, auth) {
      const clean = JSON.parse(JSON.stringify(cfg));
      delete clean.backend;                         // 서버 주소는 항상 config.js 파일 값을 사용
      if (mode === "local") return lsSet("config", { savedAt: new Date().toISOString(), config: clean });
      return gas("saveConfig", { value: { savedAt: new Date().toISOString(), config: clean }, auth });
    },
    async resetConfig(auth) {
      if (mode === "local") return lsDel("config");
      return gas("saveConfig", { value: null, auth });
    },
    async setPassword(newSalt, newHash, auth) {
      if (mode === "gas") await gas("setPassword", { newSalt, newHash, auth });
    },
    /* 내 강의실: 학번 + 이름이 맞는 학생 본인의 기록만 돌려줍니다 */
    async myRoom(sid, name) {
      if (mode === "gas") return gas("myroom", { sid, name });
      return Store.buildMyRoom(sid, name, (k, d) => lsGet(k, d));
    },
    buildMyRoom(sid, name, read) {
      const same = (x) => String(x.sid || "").trim() === String(sid).trim() && String(x.name || "").replace(/\s/g, "") === String(name).replace(/\s/g, "");
      const roster = read("roster", []), enrolls = read("enrollments", []), subs = read("submissions", []);
      const st = roster.find(same);
      const en = enrolls.filter(same).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
      const mySubs = subs.filter(same);
      if (!st && !en && !mySubs.length) return { found: false };
      const id = String(sid).trim();
      const att = {}, attAll = read("attendance", {});
      Object.keys(attAll).forEach((k) => { if (attAll[k] && attAll[k][id]) att[k] = attAll[k][id]; });
      const grades = {}, gAll = read("grades", {});
      Object.keys(gAll).forEach((k) => { if (gAll[k] && gAll[k][id]) grades[k] = gAll[k][id]; });
      const base = st || en || mySubs[0];
      return {
        found: true,
        inRoster: !!st,
        student: { sid: id, name: base.name, dept: base.dept || "", year: base.year || "" },
        enrollment: en ? { status: en.status || "대기", createdAt: en.createdAt } : null,
        attendance: att,
        grades,
        submissions: mySubs.map((x) => ({ week: x.week, assignment: x.assignment, link: x.link, createdAt: x.createdAt }))
      };
    },
    async verify(auth) {
      if (mode === "gas") await gas("get", { key: "roster", auth });   // 서버에서도 비밀번호 확인
      return true;
    },
    uid
  };

  /* 페이지가 열릴 때 저장된 수정본을 불러와 config 에 덮어씁니다 */
  Store.ready = (async () => {
    try {
      const saved = mode === "local" ? lsGet("config", null) : await gas("getConfig", {});
      if (saved && saved.config) {
        const merged = Object.assign({}, FILE_CONFIG, saved.config, { backend: FILE_CONFIG.backend });
        window.SITE_CONFIG = merged;
        Store.usingOverride = true;
        Store.overrideSavedAt = saved.savedAt;
      }
    } catch (e) {
      console.warn("저장된 사이트 수정본을 불러오지 못했습니다:", e.message);
    }
  })();

  window.SiteStore = Store;
})();
