/** @OnlyCurrentDoc  — 이 스프레드시트 하나에만 접근하도록 권한을 좁힙니다 */
/**
 * 🌸 일본회화의 문화학 — 구글 스프레드시트 저장소 (Google Apps Script)
 *
 * 이 코드를 구글 스프레드시트의 [확장 프로그램 → Apps Script] 에 붙여넣고
 * 「사용안내.md」의 '구글 시트 연결' 순서대로 설정하세요.
 *
 * 저장되는 것: 사이트 수정본·공지·설문 / 수강생 명단 / 출석 / 과제 / 수강신청 / 과제 제출 / 설문 응답
 * - 학생(누구나)은 수강신청·과제 제출·설문 응답을 '추가'만 할 수 있습니다.
 * - 나머지 읽기·쓰기는 관리자 비밀번호가 맞을 때만 허용됩니다.
 * - 비밀번호는 시트·코드에 그대로 저장되지 않고 해시값만 '스크립트 속성'에 저장됩니다.
 */

var SHEET_NAME = 'store';          // 데이터를 담는 시트 이름
var CHUNK = 40000;                 // 셀 하나에 담는 최대 글자 수 (구글 시트 한도 50,000자)
var PUBLIC_KEYS = ['enrollments', 'submissions', 'surveyResponses'];
var ADMIN_KEYS = ['roster', 'enrollments', 'attendance', 'grades', 'submissions', 'surveyResponses'];
var MAX_PUBLIC_ITEMS = 2000;       // 학생 제출 최대 개수 (장난 제출 방지)

/** ① 처음 한 번만 실행: config.js 의 admin.salt 와 admin.passwordHash 값을 붙여넣고 실행하세요. */
function setup() {
  var SALT = '여기에_config.js_의_salt_값';
  var HASH = '여기에_config.js_의_passwordHash_값';
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SALT', SALT);
  props.setProperty('ADMIN_HASH', HASH);
  props.setProperty('ITERATIONS', '1000');
  sheet_();
  Logger.log('설정 완료! 이제 [배포 → 새 배포 → 웹 앱] 을 진행하세요.');
}

function doGet() {
  return json_({ ok: true, data: '일본회화의 문화학 저장소가 동작 중입니다.' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var req = JSON.parse(e.postData.contents);
    switch (req.action) {
      case 'getConfig':
        return json_({ ok: true, data: read_('config') });

      case 'submit': {
        if (PUBLIC_KEYS.indexOf(req.key) < 0) throw new Error('허용되지 않은 저장 항목');
        var list = read_(req.key) || [];
        if (list.length >= MAX_PUBLIC_ITEMS) throw new Error('제출 가능한 개수를 넘었습니다');
        var item = clean_(req.item);
        list.push(item);
        write_(req.key, list);
        return json_({ ok: true, data: item });
      }

      case 'myroom':   // 학생 본인 현황 (학번 + 이름이 모두 맞을 때만, 본인 기록만)
        return json_({ ok: true, data: myRoom_(String(req.sid || ''), String(req.name || '')) });

      case 'get':
        auth_(req.auth);
        if (ADMIN_KEYS.indexOf(req.key) < 0) throw new Error('알 수 없는 항목');
        return json_({ ok: true, data: read_(req.key) });

      case 'set':
        auth_(req.auth);
        if (ADMIN_KEYS.indexOf(req.key) < 0) throw new Error('알 수 없는 항목');
        write_(req.key, req.value);
        return json_({ ok: true, data: true });

      case 'saveConfig':
        auth_(req.auth);
        write_('config', req.value);
        return json_({ ok: true, data: true });

      case 'setPassword': {
        auth_(req.auth);
        if (!/^[0-9a-f]{32}$/.test(req.newSalt) || !/^[0-9a-f]{64}$/.test(req.newHash)) throw new Error('잘못된 값');
        var props = PropertiesService.getScriptProperties();
        props.setProperty('SALT', req.newSalt);
        props.setProperty('ADMIN_HASH', req.newHash);
        return json_({ ok: true, data: true });
      }

      default:
        throw new Error('알 수 없는 요청');
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- 비밀번호 확인 (사이트와 같은 방식: salt + 비밀번호 → SHA-256 을 반복) ---------- */
function auth_(pw) {
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty('SALT'), hash = props.getProperty('ADMIN_HASH');
  var n = Number(props.getProperty('ITERATIONS') || 1000);
  if (!salt || !hash) throw new Error('setup() 을 먼저 실행하세요');
  var h = sha256Hex_(salt + String(pw || ''));
  for (var i = 1; i < n; i++) h = sha256Hex_(h);
  if (h !== hash) throw new Error('비밀번호가 맞지 않습니다');
}
function sha256Hex_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] + 256) % 256;
    out += (b < 16 ? '0' : '') + b.toString(16);
  }
  return out;
}

/* ---------- 내 강의실 (site 의 store.js 와 같은 규칙) ---------- */
function myRoom_(sid, name) {
  sid = sid.trim(); name = name.replace(/\s/g, '');
  if (!/^[0-9]{6,12}$/.test(sid) || !name) return { found: false };
  var same = function (x) { return String(x.sid || '').trim() === sid && String(x.name || '').replace(/\s/g, '') === name; };
  var roster = read_('roster') || [], enrolls = read_('enrollments') || [], subs = read_('submissions') || [];
  var st = roster.filter(same)[0];
  var en = enrolls.filter(same).sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); })[0];
  var mySubs = subs.filter(same);
  if (!st && !en && !mySubs.length) return { found: false };
  var att = {}, attAll = read_('attendance') || {};
  Object.keys(attAll).forEach(function (k) { if (attAll[k] && attAll[k][sid]) att[k] = attAll[k][sid]; });
  var grades = {}, gAll = read_('grades') || {};
  Object.keys(gAll).forEach(function (k) { if (gAll[k] && gAll[k][sid]) grades[k] = gAll[k][sid]; });
  var base = st || en || mySubs[0];
  return {
    found: true, inRoster: !!st,
    student: { sid: sid, name: base.name, dept: base.dept || '', year: base.year || '' },
    enrollment: en ? { status: en.status || '대기', createdAt: en.createdAt } : null,
    attendance: att, grades: grades,
    submissions: mySubs.map(function (x) { return { week: x.week, assignment: x.assignment, link: x.link, createdAt: x.createdAt }; })
  };
}

/* ---------- 학생 제출값 정리 (긴 글·이상한 값 막기) ---------- */
function clean_(obj) {
  var out = {};
  Object.keys(obj || {}).slice(0, 30).forEach(function (k) {
    var v = obj[k];
    if (typeof v === 'string') out[k] = v.slice(0, 2000);
    else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
  });
  return out;
}

/* ---------- 시트 읽기·쓰기 (A열: 이름, B열부터: JSON 조각) ---------- */
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, 2).setValues([['key', 'json (자동 관리 — 직접 고치지 마세요)']]);
  }
  return sh;
}
function rowOf_(sh, key) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var keys = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) if (keys[i][0] === key) return i + 2;
  return -1;
}
function read_(key) {
  var sh = sheet_();
  var r = rowOf_(sh, key);
  if (r < 0) return null;
  var width = sh.getLastColumn();
  if (width < 2) return null;
  var text = sh.getRange(r, 2, 1, width - 1).getValues()[0].join('');
  return text ? JSON.parse(text) : null;
}
function write_(key, value) {
  var sh = sheet_();
  var text = value === null || value === undefined ? '' : JSON.stringify(value);
  var parts = [];
  for (var i = 0; i < text.length; i += CHUNK) parts.push(text.slice(i, i + CHUNK));
  if (!parts.length) parts.push('');
  var r = rowOf_(sh, key);
  if (r < 0) { r = sh.getLastRow() + 1; sh.getRange(r, 1).setValue(key); }
  var width = Math.max(sh.getLastColumn() - 1, parts.length);
  var row = [];
  for (var j = 0; j < width; j++) row.push(parts[j] || '');
  sh.getRange(r, 2, 1, width).setNumberFormat('@').setValues([row]);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
