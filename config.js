/* =====================================================================
 *  🌸 사이트 설정 파일 (config.js)
 *  ---------------------------------------------------------------------
 *  사이트에 보이는 모든 글자·메뉴·강의 내용·일정·FAQ·교수자 정보·색상은
 *  이 파일 하나에서만 고치면 됩니다. 다른 파일은 건드리지 않아도 돼요.
 *
 *  ✏️ 수정 요령
 *   - 글자는 따옴표("...") 안의 내용만 바꾸세요.
 *   - 항목을 늘리려면 { ... }, 블록을 통째로 복사해 붙여넣으세요.
 *   - 블록 끝의 쉼표(,)를 지우지 않도록 주의하세요.
 *   - 저장한 뒤 브라우저를 새로고침하면 바로 반영됩니다.
 *
 *  📄 내용 출처: 「일본회화의 문화학 강의계획안」
 *     [예시] 표시가 붙은 값은 계획안에 없어 임시로 넣은 것입니다.
 * ===================================================================== */

window.SITE_CONFIG = {

  /* ───────── 0. 관리자 · 저장 방식 ─────────
   *  🔒 비밀번호는 여기에 그대로 적지 않고 '해시값'만 저장합니다.
   *     비밀번호 변경은 관리자 화면 → 설정 에서 하세요. (직접 고치지 마세요)
   *
   *  💾 backend.type
   *     "local" : 관리자가 쓰는 이 브라우저에만 저장 (설치 없이 바로 사용)
   *     "gas"   : 구글 스프레드시트에 저장 → 학생 수강신청·과제 제출이 관리자에게 모입니다
   *               설정 방법은 「사용안내.md」의 '구글 시트 연결' 을 보세요. */
  admin: {
    salt: "7f326e23c857d284883cf79e341832a3",
    passwordHash: "1a1f930627d8dafd2c18caac864a699f6f4a3e35908554cdbf6e8fe35707af00",
    iterations: 1000
  },
  backend: {
    type: "local",
    url: ""          // gas 방식일 때 Apps Script 웹앱 주소 (https://script.google.com/macros/s/.../exec)
  },

  /* ───────── 공지사항 (관리자 화면 → 공지 에서 쉽게 올릴 수 있어요) ───────── */
  notices: {
    eyebrow: "NOTICE",
    title: "공지사항",
    subtitle: "수업 관련 새 소식을 확인하세요",
    items: [
      { id: "n1", date: "2026-09-21", title: "9.24(목) 추석 연휴 → 9.23(수) 저녁 온라인 보강",
        body: "9월 24일(목)은 추석 연휴로 수업이 없습니다. 대신 9월 23일(수) 20:00~21:15에 온라인 보강수업을 진행합니다.",
        pinned: true, important: true }
    ]
  },

  /* ───────── 수강신청 양식 ───────── */
  apply: {
    title: "수강신청서",
    period: "2026-2학기 신청 접수 중",
    intro: "아래 정보를 입력하면 담당 교수에게 신청이 전달됩니다.",
    consent: "수강 관리를 위해 학번·이름·학과·연락처를 수집하며, 학기 종료 후 파기합니다. 동의합니다.",
    done: "신청이 접수되었습니다. 확인 후 안내드릴게요 🌸"
  },

  /* ───────── 1. 사이트 기본 정보 ───────── */
  site: {
    title: "일본회화의 문화학 | 고려대학교 일어일문학과",
    logoIcon: "🌸",
    logoText: "일본회화의 문화학",
    logoSub: "고려대학교 일어일문학과"
  },

  /* ───────── 2. 색상 · 분위기 (벚꽃 테마) ───────── */
  theme: {
    pink: "#f6a5c0",        // 벚꽃 분홍
    pinkDeep: "#d9638f",    // 진한 분홍 (버튼·강조)
    lavender: "#c9b6ea",    // 연보라
    purple: "#7b58b8",      // 진한 보라 (제목)
    cream: "#fff8fb",       // 배경
    ink: "#47395a",         // 본문 글자색
    petals: true,           // 벚꽃잎 흩날림 효과 켜기(true)/끄기(false)
    petalCount: 20          // 꽃잎 개수
  },

  /* ───────── 3. 상단 고정 메뉴 ─────────
   *  id 는 바꾸지 말고 label(보이는 이름)만 바꾸세요.
   *  "hero" = 첫 화면(강의소개), "professors"(교수자) = 맨 아래 푸터의 교수자 소개 */
  nav: [
    { id: "hero",       label: "강의소개" },
    { id: "curriculum", label: "커리큘럼" },
    { id: "guide",      label: "수강안내" },
    { id: "join",       label: "참여하기" },
    { id: "myroom",     label: "내 강의실" },
    { id: "faq",        label: "FAQ" },
    { id: "professors", label: "교수자" }
  ],

  /* ───────── 맨 위 알림 띠 ─────────
   *  show: false 로 바꾸면 숨겨집니다. href "#apply" = 수강안내의 수강신청서로 이동 */
  banner: {
    show: true,
    text: "2026년도 2학기 수강신청을 받고 있습니다.",
    button: "수강신청하러 가기",
    href: "#apply"
  },

  /* ───────── 참여하기 ───────── (과제·온라인 보강은 커리큘럼 내용으로 자동 표시) */
  join: {
    eyebrow: "JOIN",
    title: "참여하기",
    subtitle: "수강신청부터 과제 제출, 온라인 보강까지 한곳에서",
    applyText: "수강안내 아래의 수강신청서를 작성해 제출하세요. 확인 후 안내드립니다.",
    myroomText: "학번과 이름으로 내 출석·과제·수강신청 현황을 확인할 수 있어요."
  },

  /* ───────── 설문 ─────────
   *  관리자 화면 → 🗳️ 설문 에서 만들기·수정·삭제하세요. (참여하기 아래 '설문 히스토리'에 보여요)
   *  question type: single(하나 고르기) multi(여러 개) scale(1~5점) short(짧은 답) long(긴 답) */
  surveys: {
    title: "설문",
    items: []
  },

  /* ───────── 내 강의실 ─────────
   *  학생이 학번 + 이름을 입력하면 자신의 수강신청 상태·출석·과제 현황을 봅니다.
   *  showScores: true 로 바꾸면 과제 점수도 보여줍니다. */
  myroom: {
    eyebrow: "MY CLASSROOM",
    title: "내 강의실",
    subtitle: "학번과 이름으로 내 수업 현황을 확인하세요",
    note: "수강신청서에 적은 학번과 이름을 똑같이 입력하세요.",
    showScores: false
  },

  /* ───────── 4. 첫 화면 (강의 소개) ─────────
   *  buttons 의 href 에 수강신청 페이지 주소(https://...)를 넣으면
   *  새 창으로 열립니다. "#..." 는 페이지 안의 섹션으로 이동합니다. */
  hero: {
    badge: "2026-2학기 학부수업",
    // 배지 양옆 그림 — 다른 이미지로 바꾸려면 경로만 바꾸세요. 비워두면("") 숨겨집니다.
    badgeImages: { left: "images/sakura-tree.svg", right: "images/sakura-tree.svg", mirrorRight: true },
    titleJp: "絵を読み、時代を識る。",
    title: "일본회화의 문화학",
    description: "일본 회화의 실제 작품을 시대별로 감상하고, 그림 속에 담긴 사회·풍속·예술을 읽어내며 일본 문화의 흐름을 이해합니다.",
    buttons: [
      { label: "수강신청", href: "#apply", style: "primary" },        // "#apply" = 사이트 안 수강신청 양식
      { label: "커리큘럼 보기", href: "#curriculum", style: "ghost" }
    ],
    // 한눈에 보는 강의 정보
    info: [
      // auto: true → 커리큘럼의 첫 수업일·수업 요일로 기간이 자동 계산됩니다
      { icon: "📅", label: "일정", auto: true },
      { icon: "⏰", label: "시간", value: "화·목 13:30 ~ 14:45", sub: "주 2회 · 75분" },
      { icon: "🖼️", label: "수업방식", value: "강의 + 토론", sub: "PPT 작품 감상 · 의견 나눔" },
      { icon: "🎓", label: "수강대상", value: "일본 문화·미술에 관심 있는 학부생", sub: "「일본문화의 이해」 선수 권장" }
    ]
  },

  /* ───────── 5. 프로그램 소개 ───────── */
  about: {
    eyebrow: "ABOUT",
    title: "프로그램 소개",
    subtitle: "그림 한 장에 담긴 시대를 읽는 수업",
    overviewTitle: "과목 개요",
    overview: "일본 회화의 실제 작품을 시대별로 살펴보고 그 그림에 담긴 내용을 해독, 감상하는 과정을 통해 사회, 풍속, 예술 등 당시 시대의 전반적인 문화의 양상을 살펴본다. 수업은 회화 작품을 PPT로 감상하고 그 작품의 역사적 문화적 배경과 의미를 학습해가는 방식으로 진행한다. 그리고 수업 중간중간에 학생들과 의견 토론의 시간을 갖는다.",
    goalTitle: "학습 목표",
    goal: "회화자료에 투영된 당시 전반적인 문화의 양상을 연관시켜 살펴봄으로써 일본문화에 대한 기초적 지식을 제공한다.",
    highlights: [
      { icon: "🖼️", title: "작품 감상", desc: "시대를 대표하는 실제 회화 작품을 PPT로 함께 감상합니다." },
      { icon: "🔍", title: "그림 해독", desc: "그림 속 인물·풍경·상징을 읽어 그 의미를 해석합니다." },
      { icon: "🏯", title: "시대 배경", desc: "작품이 탄생한 역사적·문화적 배경을 함께 공부합니다." },
      { icon: "💬", title: "의견 토론", desc: "수업 중간중간 감상과 해석을 나누는 토론 시간을 갖습니다." }
    ]
  },

  /* ───────── 6. 시대별 탐구 카드 ─────────
   *  weeks 는 아래 커리큘럼의 주차 번호입니다.
   *  works(감상 작품 예시)는 계획안에 없는 [예시] 항목입니다. */
  course: {
    eyebrow: "ERAS",
    title: "시대별 탐구",
    subtitle: "다섯 시대를 따라 일본 회화를 여행해요 · 카드를 누르면 자세히 볼 수 있어요",
    eras: [
      {
        key: "jodai", name: "상대", nameJp: "上代", period: "~8세기", icon: "🪷",
        weeks: [3, 4, 5],
        summary: "아스카·나라 시대의 불교회화와 고분벽화에서 일본 회화의 출발점을 찾습니다.",
        keywords: ["아스카 시대", "나라 시대", "불교회화", "고분벽화"],
        works: ["호류지 금당벽화", "다카마쓰총 고분벽화", "도리게류조 병풍", "기치조텐 상", "에인가쿄(絵因果経)", "다이마 만다라"]
      },
      {
        key: "heian", name: "헤이안 시대", nameJp: "平安時代", period: "794~1185", icon: "🌸",
        weeks: [6, 7],
        summary: "전기의 밀교 회화에서 후기의 에마키와 정토종 미술까지, 헤이안 회화를 읽어냅니다.",
        keywords: ["밀교 회화", "만다라", "에마키(絵巻)", "정토종 미술"],
        works: ["양계 만다라", "십이천상", "겐지모노가타리 에마키", "일본 4대 에마키", "정토종 내영도"]
      },
      {
        key: "chusei", name: "중세 시대", nameJp: "中世", period: "1185~1573", icon: "🏯",
        weeks: [9, 10],
        summary: "가마쿠라 시대의 초상화와 무로마치 시대 산수화의 흐름을 살펴봅니다.",
        keywords: ["가마쿠라 시대", "초상화", "무로마치 시대", "산수화"],
        works: ["가마쿠라 시대 초상화(니세에)", "전 미나모토노 요리토모 상", "무로마치 수묵 산수화", "셋슈의 산수도"]
      },
      {
        key: "kinsei", name: "근세 시대", nameJp: "近世", period: "1573~1868", icon: "🌊",
        weeks: [11, 12],
        summary: "모모야마·에도 전기의 병풍화와 에도 시대 가노파·도사파·우키요에를 만납니다.",
        keywords: ["병풍화", "가노파", "도사파", "우키요에"],
        works: ["라쿠추라쿠가이 병풍", "모모야마 시대 병풍화", "가노파 회화", "도사파 회화", "우키요에"]
      },
      {
        key: "kingendai", name: "근현대", nameJp: "近現代", period: "1868~", icon: "🎨",
        weeks: [13],
        summary: "서양화의 수용과 일본화의 재탄생, 근대 회화의 고민을 봅니다.",
        keywords: ["서양화 수용", "일본화 운동", "근대성"],
        works: ["구로다 세이키 「호반」", "요코야마 다이칸의 몽롱체", "가부라키 기요카타의 미인화"]
      }
    ]
  },

  /* ───────── 7. 커리큘럼 (주차별 과정) ─────────
   *  ✅ firstClassDate(첫 수업일)만 적으면, 그 주부터 weeks 에 적은 주차 수만큼
   *     classDays(화·목) 수업 날짜가 모두 자동 계산되어 달력과 주차 목록에 표시됩니다.
   *  ✅ holidays 에 적은 날짜와 겹치는 수업은 '휴강'으로 표시됩니다.
   *
   *  주차별로 바꿀 수 있는 항목 (안 적으면 classDays 의 기본값 사용)
   *   - time:   "15:00 ~ 16:15"   (그 주 모든 수업의 시간)
   *   - place:  "서관 101호"       (그 주 모든 수업의 장소)
   *   - details: 학습내용 설명 (달력 옆 '그날 수업'에도 보입니다)
   *   - assignment: 과제가 있는 주 → 제목 옆에 '📝 과제' 표시
   *       { title: "과제 제목", desc: "설명", due: "10.27 (화) 수업 전" }
   *   - online: 온라인 보강수업이 있는 주 → 제목 옆에 '💻 온라인 보강수업' 표시
   *       { title: "보강 제목", desc: "설명", period: "9.24 ~ 9.30", url: "https://..." }
   *       url 을 비워두면 '링크는 추후 공지' 로 표시됩니다.
   *   - images: 참고 그림 (위키미디어 공용의 퍼블릭 도메인 그림)
   *       { title: "보여줄 이름", file: "위키미디어 파일 이름", wiki: "일본어 위키백과 문서 제목" }
   *       · file: commons.wikimedia.org 의 'File:' 뒤 이름 (예: "Takamat1.jpg")
   *       · wiki: 비워두면("") 위키백과 링크 없이 그림 출처만 표시돼요
   *       · 다른 곳의 그림은 file 대신 image: "https://…" 로 주소를 직접 넣어도 됩니다
   *   - videos: 참고영상 (필요할 때만) { title: "영상 제목", url: "https://www.youtube.com/watch?v=..." } */
  curriculum: {
    eyebrow: "CURRICULUM",
    title: "{n}주 과정",                     // {n} 자리에 주차 수가 자동으로 들어갑니다
    subtitle: "날짜를 누르거나 주차를 펼쳐 수업 정보를 확인하세요",
    calendarTitle: "월간 수업달력",
    listTitle: "주차별 강의 ({n}주)",       // {n} 자리에 주차 수가 자동으로 들어갑니다
    firstClassDate: "2026-09-01",            // ⭐ 첫 수업일 — 이것만 바꾸면 전체 일정이 다시 계산돼요
    // 수업 요일과 요일별 시간·장소 (요일: 일 월 화 수 목 금 토)
    classDays: [
      { day: "화", time: "13:30 ~ 14:45", place: "고려대학교 서관 314A" },
      { day: "목", time: "13:30 ~ 14:45", place: "고려대학교 서관 314A" }
    ],
    // 공휴일 · 휴강일 (수업 요일과 겹치면 자동으로 '휴강' 표시)
    holidays: [
      { date: "2026-09-24", name: "추석 연휴" },
      { date: "2026-09-25", name: "추석" },
      { date: "2026-10-03", name: "개천절" },
      { date: "2026-10-09", name: "한글날" },
      { date: "2026-10-20", name: "임시 휴강" },
      { date: "2026-12-25", name: "성탄절" }
    ],
    phases: [
      { title: "들어가기", jp: "序", weeks: [1, 2], icon: "🌱" },
      { title: "상대의 그림", jp: "上代 (飛鳥・奈良)", weeks: [3, 4, 5], icon: "🪷" },
      { title: "헤이안의 그림", jp: "平安 (密教・絵巻)", weeks: [6, 7], icon: "🌸" },
      { title: "중간 점검", jp: "中間", weeks: [8], icon: "📝" },
      { title: "중세의 그림", jp: "中世 (鎌倉・室町)", weeks: [9, 10], icon: "🏯" },
      { title: "근세의 그림", jp: "近世 (桃山・江戸)", weeks: [11, 12], icon: "🌊" },
      { title: "정리와 마무리", jp: "近現代・結び", weeks: [13, 14, 15, 16], icon: "🍒" }
    ],
    // era 는 시대 카드의 key 와 연결됩니다. type: "exam" 은 시험 주간 표시
    // short 는 달력 칸에 들어가는 짧은 제목입니다.
    weeks: [
      { week: 1, short: "강의 소개", topic: "강의 소개 및 일본문화에 대한 전반적 소개", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "16주 수업의 흐름과 평가 방법을 안내하고, 일본문화 전반을 개관합니다." },
      { week: 2, short: "시대적 흐름", topic: "일본회화와 시대적 흐름", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "상대에서 근현대까지 일본 회화사의 큰 흐름을 시대 구분과 함께 살펴봅니다.",
        images: [
          { title: "다카마쓰총 고분벽화 (아스카)", file: "Takamat1.jpg", wiki: "高松塚古墳" },
          { title: "겐지모노가타리에마키 (헤이안)", file: "Genji emaki azumaya.jpg", wiki: "源氏物語絵巻" },
          { title: "셋슈 「추동산수도」 (무로마치)", file: "Autumn and Winter Landscape.jpg", wiki: "秋冬山水図" },
          { title: "호쿠사이 「가나가와 해변의 높은 파도」 (에도)", file: "The Great Wave off Kanagawa.jpg", wiki: "神奈川沖浪裏" }
        ] },
      { week: 3, short: "상대 개관", topic: "일본회화 작품감상 및 시대배경 1) 상대(上代) 개관", era: "jodai", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "4·5주차 아스카·나라 시대 회화를 보기 전에, 불교 전래와 대륙·한반도 문화의 유입 등 상대(上代) 회화의 시대 배경을 살펴본다.",   // [예시] 4·5주차와 겹치지 않게 정리한 내용
        images: [
          { title: "다마무시노즈시(玉虫厨子) · 호류지", file: "Tamamushi Shrine ColorPhoto.jpg", wiki: "玉虫厨子" },
          { title: "덴주코쿠 수장(天寿国繡帳) · 주구지", file: "Tenjyukoku embroidery.jpg", wiki: "天寿国繡帳" }
        ] },
      { week: 4, short: "아스카", topic: "일본회화 작품감상 및 시대배경 2) 상대(上代) — 아스카 시대", era: "jodai", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "상대(上代) 아스카 시대, 일본 불교회화와 호류지 금당벽화, 다카마쓰총 고분벽화 등을 살펴본다.",
        images: [
          { title: "호류지 금당벽화 (비천)", file: "Apsara Horyuji1.JPG", wiki: "法隆寺金堂壁画" },
          { title: "다카마쓰총 고분벽화 (서벽 여인군상)", file: "Takamat1.jpg", wiki: "高松塚古墳" }
        ],
        // 9.24(목) 추석 연휴 → 9.23(수) 저녁 온라인 보강수업
        online: { title: "추석 연휴(9.24) 보강 — 온라인 보강수업",
                  desc: "9월 24일(목) 추석 연휴로 쉬는 수업을 9월 23일(수) 저녁 온라인 수업으로 보강합니다.",
                  period: "2026.9.23 (수) 20:00 ~ 21:15",
                  url: "" },   // 온라인 수업 주소(Zoom 등)를 넣으면 '들어가기' 버튼이 생겨요
        // 정규 요일(화·목) 외에 따로 잡힌 수업 — 달력에 날짜가 표시됩니다
        extraSessions: [
          { date: "2026-09-23", time: "20:00 ~ 21:15", place: "온라인", online: true,
            short: "온라인 보강", topic: "온라인 보강수업 — 상대(上代) 아스카 시대 (추석 연휴 보강)", url: "" }
        ] },
      { week: 5, short: "나라", topic: "일본회화 작품감상 및 시대배경 3) 상대(上代) — 나라 시대", era: "jodai", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "상대 중 나라 시대, 일본 도리게류조 병풍, 기치조텐 상, 에인가쿄, 다이마 만다라 등을 살펴본다.",
        images: [
          { title: "도리게류조 병풍(鳥毛立女屏風) · 쇼소인", file: "鳥毛立女屏風1.jpg", wiki: "" },
          { title: "기치조텐 상(吉祥天像) · 야쿠시지", file: "Kichijōten.jpg", wiki: "吉祥天" },
          { title: "에인가쿄(絵因果経)", file: "E innga kyo.jpg", wiki: "絵因果経" },
          { title: "다이마 만다라(当麻曼荼羅)", file: "Taima Mandala.jpg", wiki: "当麻曼荼羅" }
        ] },
      { week: 6, short: "헤이안 전기", topic: "일본회화 작품감상 및 시대배경 4) 헤이안 전기 — 밀교 회화", era: "heian", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "헤이안 전기에 들어온 일본 불교회화, 특히 밀교 회화로 만다라, 십이천상 등을 중심으로 살펴본다.",
        images: [
          { title: "양계 만다라 중 태장계 · 도지(東寺)", file: "Taizokai Toji.jpg", wiki: "両界曼荼羅" },
          { title: "양계 만다라 중 금강계 · 도지(東寺)", file: "Kongokai Toji.jpg", wiki: "両界曼荼羅" },
          { title: "십이천상 중 제석천 · 나라국립박물관", file: "Juniten Taishakuten (Nara National Museum).jpg", wiki: "十二天" }
        ] },
      { week: 7, short: "헤이안 후기", topic: "일본회화 작품감상 및 시대배경 5) 헤이안 후기 — 에마키와 정토종 미술", era: "heian", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "헤이안 후기 겐지모노가타리에마키를 비롯한 일본 4대 에마키, 정토종 미술을 중심으로 살펴본다.",
        images: [
          { title: "겐지모노가타리에마키 「아즈마야」", file: "Genji emaki azumaya.jpg", wiki: "源氏物語絵巻" },
          { title: "시기산엔기에마키 「날아가는 창고」", file: "Sigisanengi tobikura.jpg", wiki: "信貴山縁起" },
          { title: "반다이나곤에코토바", file: "Ban Dainagon Ekotoba - Crowd Running.jpg", wiki: "伴大納言絵詞" },
          { title: "조주진부쓰기가 (조수인물희화)", file: "Chouju sumo2.jpg", wiki: "鳥獣人物戯画" },
          { title: "아미타성중내영도 · 안라쿠주인 (정토종 미술)", file: "《阿弥陀聖衆来迎図》12世紀後半、安楽寿院、京都.jpg", wiki: "阿弥陀聖衆来迎図" }
        ] },
      // byDay: 같은 주 안에서 요일마다 내용이 다를 때 사용 (exam: true → 그날만 시험 표시)
      { week: 8, short: "중간고사", topic: "중간고사", type: "exam", material: "", activity: "시험",
        details: "1~7주차 학습 내용을 바탕으로 중간고사를 실시합니다. 시험일: 10월 22일(목)",
        byDay: {
          화: { exam: false },   // 10.20(화)은 아래 holidays 에 '휴강'으로 등록되어 있어요
          목: { short: "중간고사", topic: "중간고사", exam: true,
                details: "1~7주차 학습 내용을 바탕으로 중간고사를 실시합니다." }
        } },
      { week: 9, short: "가마쿠라", topic: "일본회화 작품감상 및 시대배경 6) 중세 — 가마쿠라 시대 초상화", era: "chusei", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "중세 가마쿠라 시대 일본 초상화를 중심으로 살펴본다.",
        images: [
          { title: "전 미나모토노 요리토모 상 · 진고지", file: "《伝源頼朝像》13世紀、鎌倉時代、神護寺、京都.jpg", wiki: "" },
          { title: "니세에(似絵) 「즈이신테이키에마키」", file: "Zuishin Teiki handscroll.jpg", wiki: "似絵" }
        ] },
      { week: 10, short: "무로마치", topic: "일본회화 작품감상 및 시대배경 7) 중세 — 무로마치 시대 산수화", era: "chusei", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "중세 무로마치 시대 일본 산수화의 흐름을 중심으로 살펴본다.",
        images: [
          { title: "조세쓰 「표점도(瓢鮎図)」", file: "Hyônen zu by Josetsu.jpg", wiki: "瓢鮎図" },
          { title: "셋슈 「추동산수도(秋冬山水図)」", file: "Autumn and Winter Landscape.jpg", wiki: "秋冬山水図" },
          { title: "셋슈 「아마노하시다테도(天橋立図)」", file: "Sesshu - View of Ama-no-Hashidate.jpg", wiki: "雪舟" }
        ] },
      { week: 11, short: "모모야마·에도 전기", topic: "일본회화 작품감상 및 시대배경 8) 근세 — 모모야마~에도 전기 병풍화", era: "kinsei", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "근세 모모야마 시대부터 에도 시대 전기까지, 라쿠추라쿠가이 병풍 등 병풍화를 중심으로 살펴본다.",
        images: [
          { title: "가노 에이토쿠 「라쿠추라쿠가이도 병풍」 (우에스기본)", file: "Kanō Eitoku - Rakuchū rakugai zu (Uesugi) - right screen.jpg", wiki: "洛中洛外図" },
          { title: "가노 에이토쿠 「가라지시도 병풍」", file: "Kano Eitoku 002.jpg", wiki: "狩野永徳" },
          { title: "하세가와 도하쿠 「송림도 병풍」", file: "Hasegawa Tohaku - Pine Trees (Shōrin-zu byōbu) - right hand screen.jpg", wiki: "長谷川等伯" }
        ] },
      { week: 12, short: "에도", topic: "일본회화 작품감상 및 시대배경 9) 근세 — 에도 시대 가노파·도사파·우키요에", era: "kinsei", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "근세 에도 시대 가노파, 도사파, 우키요에에 대해 살펴본다.",
        images: [
          { title: "가노 단유 「오동나무와 봉황」 (가노파)", file: "Kano Tan'yu - Phoenixes by Paulownia Trees - Google Art Project.jpg", wiki: "狩野探幽" },
          { title: "도사 미쓰오키 「메추라기와 가을꽃」 (도사파)", file: "Tosa Mitsuoki - Quail and Autumn Flowers - 36.100.52 - Metropolitan Museum of Art.jpg", wiki: "土佐光起" },
          { title: "히시카와 모로노부 「뒤돌아보는 미인」 (우키요에)", file: "Hishikawa Moronobu - Beauty Looking Back - Google Art Project.jpg", wiki: "見返り美人図" },
          { title: "호쿠사이 「가나가와 해변의 높은 파도」 (우키요에)", file: "The Great Wave off Kanagawa.jpg", wiki: "神奈川沖浪裏" }
        ] },
      { week: 13, short: "근현대", topic: "일본회화 작품감상 및 시대배경 10) 근현대", era: "kingendai", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "서양화의 수용과 '일본화'의 탄생, 근대 회화의 고민을 살펴봅니다.",
        images: [
          { title: "구로다 세이키 「호반(湖畔)」", file: "Kuroda-seiki-kohan00-6-1b.jpeg", wiki: "黒田清輝" },
          { title: "히시다 슌소 「낙엽(落葉)」", file: "Hishida Shunsō - Fallen Leaves (Eisei Bunko Museum) 2.jpg", wiki: "菱田春草" }
        ] },
      { week: 14, short: "종합 정리 (1)", topic: "일본회화의 이해와 시대와의 상관성 (1)", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "학기 동안 감상한 작품을 돌아보며 회화와 시대의 관계를 정리하고 토론합니다.",
        images: [
          { title: "다와라야 소타쓰 「풍신뇌신도 병풍」", file: "Wind God and Thunder God Screens by Tawaraya Sotatsu low-res.png", wiki: "風神雷神図" }
        ] },
      { week: 15, short: "종합 정리 (2)", topic: "일본회화의 이해와 시대와의 상관성 (2)", material: "PPT, 프린트", activity: "강의 및 토론",
        details: "시대별 회화의 특징을 비교하며 일본 문화의 흐름 속에서 회화가 가진 의미를 종합적으로 정리합니다.",   // [예시]
        images: [
          { title: "오가타 고린 「홍백매도 병풍」", file: "Ogata Kōrin - Red and White Plum Blossoms.jpg", wiki: "紅白梅図" }
        ] },
      // 마지막 주: 12.15(화)에만 기말고사, 목요일은 수업 없음 (skip: true)
      { week: 16, short: "기말고사", topic: "기말고사", type: "exam", material: "", activity: "시험",
        details: "9~15주차 학습 내용을 중심으로 기말고사를 실시합니다. 시험일: 12월 15일(화)",
        byDay: {
          화: { short: "기말고사", topic: "기말고사", exam: true },
          목: { skip: true }
        } }
    ]
  },

  /* ───────── 8. 수강안내 ───────── */
  guide: {
    eyebrow: "GUIDE",
    title: "수강안내",
    subtitle: "수강 전에 꼭 확인해 주세요",
    // 평가 비율 (합계 100) — 도넛 차트로 표시됩니다
    evaluation: [
      { label: "중간고사", value: 40 },
      { label: "기말고사", value: 40 },
      { label: "출석", value: 10 },
      { label: "태도, 참여도", value: 10 }
    ],
    evaluationNote: "평가 방법: 비공개",
    cards: [
      { icon: "🧭", title: "추천 선수과목", items: ["일본문화의 이해 (선수 권장)"] },
      { icon: "📑", title: "수업 자료", items: ["수업 시 PPT 및 프린트 배부"] },
      { icon: "🗣️", title: "수업 방법", items: ["강의", "작품에 대한 의견 토론"] },
      { icon: "✍️", title: "과제 · 보강", items: ["과제·온라인 보강수업이 있는 주는 주차별 강의에 표시돼요"] }
    ],
    booksTitle: "지정도서 및 참고문헌",
    books: [
      { title: "日本美術史（美術出版ライブラリー, 歴史編）", author: "井上洋一[ほか]", publisher: "東京印書館", year: "2014.4" },
      { title: "日本美術史入門", author: "河野元昭", publisher: "平凡社", year: "2014.11" }
    ]
  },

  /* ───────── 9. FAQ ───────── */
  faq: {
    eyebrow: "FAQ",
    title: "자주 묻는 질문",
    subtitle: "질문을 누르면 답변이 펼쳐져요",
    items: [
      { q: "일본 미술을 전혀 몰라도 들을 수 있나요?", a: "네. 1~2주차에 일본문화 전반과 일본회화의 시대적 흐름을 먼저 소개하므로 사전 지식이 없어도 따라올 수 있습니다. 다만 「일본문화의 이해」를 먼저 수강하면 더 도움이 됩니다." },
      { q: "교재를 따로 사야 하나요?", a: "아니요. 수업 시 PPT와 프린트로 진행합니다. 더 깊이 공부하고 싶다면 수강안내의 참고문헌을 활용하세요." },
      { q: "수업은 어떻게 진행되나요?", a: "회화 작품을 PPT로 감상하고, 작품의 역사적·문화적 배경과 의미를 학습합니다. 수업 중간중간 학생들과 의견을 나누는 토론 시간이 있습니다." },
      { q: "성적은 어떻게 평가되나요?", a: "중간고사 40%, 기말고사 40%, 출석 10%, 태도 및 참여도 10%로 평가합니다." },
      { q: "어떤 시대의 그림을 다루나요?", a: "상대(아스카·나라: 호류지 금당벽화, 다카마쓰총 고분벽화, 도리게류조 병풍 등) → 헤이안(밀교 만다라, 겐지모노가타리에마키 등 4대 에마키, 정토종 미술) → 중세(가마쿠라 초상화, 무로마치 산수화) → 근세(라쿠추라쿠가이 병풍, 가노파·도사파, 우키요에) → 근현대 순서로 일본 회화를 차례로 다룹니다." },
      { q: "토론 참여가 부담스러워요.", a: "정답을 맞히는 토론이 아니라 그림을 보고 느낀 점을 자유롭게 나누는 시간입니다. 적극적인 참여는 '태도, 참여도' 평가에 반영됩니다." }
    ]
  },

  /* ───────── 10. 푸터 (수강준비물 · 교수자 · 연락처) ─────────
   *  교수자 photo 에 이미지 경로(예: "images/prof.jpg")를 넣으면 사진이 보이고,
   *  비워두면 이름 첫 글자로 된 동그란 아이콘이 보입니다.
   *  연락처 항목은 비워두면("") 자동으로 숨겨집니다. */
  footer: {
    prep: {
      title: "수강준비물",
      items: [
        { icon: "📒", text: "필기구와 노트 (작품 감상 메모용)" },
        { icon: "📂", text: "배부 프린트를 모아둘 파일 홀더" },
        { icon: "💻", text: "PPT 자료 확인용 노트북 또는 태블릿 (선택)" },
        { icon: "📚", text: "참고문헌: 『日本美術史入門』 등 (선택)" }
      ]
    },
    professor: {
      title: "교수자 소개",
      name: "김수미",
      position: "교수",
      nameJp: "",                         // 일본어 표기를 넣으면 이름 아래에 보입니다
      field: "일본고전문학 · 일본문화학",
      photo: "images/professor.jpg",      // 사진을 바꾸려면 images 폴더의 파일을 교체하세요
      bio: "『겐지모노가타리』와 에마키를 중심으로 일본 고전문학을 그림과 함께 읽습니다.",
      // 약력 — label: 기간, text: 내용 (위에서부터 오래된 순)
      history: [
        { label: "1993", text: "고려대 일어일문학과 졸업" },
        { label: "2007", text: "와세다대학 박사 〈겐지모노가타리 공간론〉" },
        { label: "2007–09", text: "고려대 일본연구센터 HK연구교수" },
        { label: "2009–", text: "고려대 일어일문학과 교수" }
      ],
      // 수상 — when: 시기
      awards: [
        { when: "2020", text: "올해의 우수도서 학술부문 최우수도서 (한국대학출판협회)" },
        { when: "2021", text: "자랑스러운 문과대학인상 · 교육·학계 부문 (고려대 문과대학 교우회)" },
        { when: "2022", text: "올해의 우수도서 (한국대학출판협회)" }
      ],
      // 저서 — type: 단독/공저, note: 비고(수상 등)
      publications: [
        { type: "단독", title: "『源氏物語の空間表現論』", publisher: "武蔵野書院", when: "2008", note: "" },
        { type: "공저", title: "『일본역사를 그림으로 읽다 — 몽고습래에고토바』", publisher: "한국학술정보", when: "2017", note: "" },
        { type: "공저", title: "『동아시아학의 이해』", publisher: "고려대출판문화원", when: "2018", note: "" },
        { type: "단독", title: "『국보 「겐지모노가타리에마키」 — 일본고전문학을 그림으로 읽다』", publisher: "고려대출판문화원", when: "2020", note: "🏆 최우수도서" },
        { type: "공저", title: "『동아시아 지식의 교류』 (일본어판 『東アジアにおける知の往還』)", publisher: "역락 · 勉誠出版", when: "2021", note: "" },
        { type: "공저", title: "『인문고전 세미나 2 — 사랑과 불륜의 문화사』", publisher: "고려대출판문화원", when: "2022", note: "🏆 우수도서" }
      ],
      // 목록 제목 (화살표 › 를 누르면 펼쳐짐) — 항목이 비어 있으면 그 줄은 숨겨집니다
      listTitles: { awards: "🏆 수상", publications: "📚 저서", papers: "📝 논문", articles: "📄 일반논문" },
      // 일반논문 — { title: "제목", journal: "수록처", when: "연도" } 형식으로 추가하세요
      articles: [],
      // 논문 — journal: 학술지·수록처
      papers: [
        { title: "「일본 헤이안 전・중기 문학에 나타난 무녀상 고찰」", journal: "『日本文化學報』 91", when: "2021" },
        { title: "「국보 겐지모노가타리 에마키의 스토리 표현 — 고토바가키와 그림의 배치와 연결성」", journal: "『일본연구』 90 (한국외대)", when: "2021" },
        { title: "「『곤자쿠모노가타리슈』 천축・진단부에 그려진 이방인」", journal: "『일본연구』 57 (중앙대)", when: "2022" },
        { title: "「国宝『源氏物語絵巻』「夕霧」の象徴性を読み解く」", journal: "『平安文学の饗宴』 勉誠出版", when: "2023" }
      ]
    },
    contact: {
      title: "연락처",
      items: [
        { icon: "✉️", label: "이메일", value: "ssumi5620@korea.ac.kr" },   // 비워두면 숨김
        { icon: "📞", label: "전화", value: "" },
        { icon: "🏛️", label: "연구실", value: "서관 217호" },
        { icon: "🕑", label: "면담 시간", value: "" },
        { icon: "📍", label: "주소", value: "서울특별시 성북구 안암로 145 고려대학교" }
      ]
    },
    bottomText: "고려대학교 문과대학 일어일문학과",
    copyright: "© 2026 Department of Japanese Language and Literature, Korea University"
  }
};
