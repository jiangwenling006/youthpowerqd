/* ============================================================
   青砺公益 · 青岛工作站 2026—2027 — 交互
   ============================================================ */
(function () {
  "use strict";

  const DATA = window.SITE_DATA || { members: [], stats: {} };
  const MEMBERS = DATA.members || [];
  const STATS = DATA.stats || {};

  const DEPT_LABEL = {
    "执行长团队": "执行长团队",
    "项目部": "项目部",
    "运营部": "运营部",
    "公共关系部": "公共关系部",
    "公共关系部（外联方向）": "公关 · 外联",
    "公共关系部（宣传方向）": "公关 · 宣传",
    "未确定部门": "未确定部门"
  };
  const DEPT_ORDER = ["项目部", "运营部", "公共关系部", "未确定部门"];

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const deptLabel = (d) => DEPT_LABEL[d] || d || "—";
  const placeOf = (m) => m.univCityN || m.city || "";
  const homeOf = (m) => m.city || "";

  /* ---------------------------------------------------------
     数字滚动
     --------------------------------------------------------- */
  function countUp(el, to, dur) {
    if (!el) return;
    if (reduceMotion) { el.textContent = to; return; }
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / (dur || 900));
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------
     进场动画
     --------------------------------------------------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        revealIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  function watchReveal(root) {
    $$(".reveal", root || document).forEach((el, i) => {
      el.style.transitionDelay = (el.dataset.delay || Math.min(i * 40, 240)) + "ms";
      revealIO.observe(el);
    });
  }

  /* ---------------------------------------------------------
     导航
     --------------------------------------------------------- */
  function initNav() {
    const nav = $("#nav");
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     城市分布（家乡 = 条形图；就学城市 = 山东地图 + 院校分布）
     --------------------------------------------------------- */
  /* 统计全部按成员数据现算：手改 data.js 后无需再改代码 */
  function countCities(members) {
    const sd = {}, out = {}, usd = {}, uout = {}, univByCity = {}, schools = {};
    let unknown = 0, uUnknown = 0;
    const SD_CITIES = new Set(((window.SD_MAP || {}).cities || []).map((c) => c.name));

    members.forEach((m) => {
      const city = (m.city || "").trim();
      if (!city) unknown += 1;
      else if (m.province === "山东") sd[city] = (sd[city] || 0) + 1;
      else out[city] = (out[city] || 0) + 1;

      const u = (m.univCityN || "").trim();
      const school = (m.school || "").trim();
      if (!u) uUnknown += 1;
      else if (SD_CITIES.has(u)) {
        usd[u] = (usd[u] || 0) + 1;
        const bucket = univByCity[u] || (univByCity[u] = { schools: {} });
        if (school) bucket.schools[school] = (bucket.schools[school] || 0) + 1;
      } else {
        uout[u] = (uout[u] || 0) + 1;
      }
      if (school) schools[school] = (schools[school] || 0) + 1;
    });

    const toList = (o) => Object.keys(o)
      .map((k) => ({ city: k, count: o[k] }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "zh"));
    const sum = (o) => Object.keys(o).reduce((t, k) => t + o[k], 0);
    const toSchoolList = (o) => Object.keys(o)
      .map((s) => ({ school: s, count: o[s] }))
      .sort((a, b) => b.count - a.count || a.school.localeCompare(b.school, "zh"));

    const citySchools = {};
    Object.keys(univByCity).forEach((c) => { citySchools[c] = toSchoolList(univByCity[c].schools); });

    return {
      cities: toList(sd), outsideCities: toList(out), unknown,
      univCities: toList(usd), univOutside: toList(uout), univUnknown: uUnknown,
      citySchools,
      schools: toSchoolList(schools),
      inShandong: sum(sd), outside: sum(out),
      cityTotal: Object.keys(sd).length + Object.keys(out).length
    };
  }
  const CITY = countCities(MEMBERS);

  const cityView = {
    home: {
      list: () => CITY.cities,
      total: () => CITY.inShandong,
      unknown: () => CITY.unknown,
      outside: () => CITY.outsideCities,
      unknownWord: "位还在填写中"
    },
    univ: {
      list: () => CITY.univCities,
      total: () => CITY.univCities.reduce((s, c) => s + c.count, 0),
      unknown: () => CITY.univUnknown,
      outside: () => CITY.univOutside,
      unknownWord: "位信息待补"
    }
  };
  let cityMode = "home";

  function renderBars(list, unknown) {
    const bars = $("#cityBars");
    const max = Math.max(1, ...list.map((c) => c.count), unknown);
    bars.innerHTML = "";
    const rows = list.map((c) => ({ city: c.city, count: c.count, cold: false }));
    if (unknown) rows.push({ city: "待补", count: unknown, cold: true });

    rows.forEach((row, i) => {
      const rowEl = document.createElement("div");
      rowEl.className = "bar-row";
      rowEl.innerHTML = `
        <span class="bar-city">${row.city}</span>
        <span class="bar-track"><span class="bar-fill${row.cold ? " cold" : ""}"></span></span>
        <span class="bar-num">0</span>`;
      bars.appendChild(rowEl);

      const fill = $(".bar-fill", rowEl);
      const numEl = $(".bar-num", rowEl);
      const pct = Math.max(4, (row.count / max) * 100);
      const run = () => {
        fill.style.width = pct + "%";
        if (reduceMotion) { numEl.textContent = row.count; return; }
        setTimeout(() => countUp(numEl, row.count, 760), 120 + i * 45);
      };
      setTimeout(run, reduceMotion ? 0 : 60 + i * 60);
    });
  }

  function renderSchoolList() {
    const rows = $("#schoolRows");
    const known = CITY.schools.reduce((s, x) => s + x.count, 0);
    if (rows) {
      rows.innerHTML = CITY.schools.map((s) =>
        `<li><span title="${escapeHtml(s.school)}">${escapeHtml(s.school)}</span><b>${s.count}</b></li>`
      ).join("") + (CITY.univUnknown
        ? `<li><span style="color:#B3A794">院校待补</span><b>${MEMBERS.length - known}</b></li>` : "");
    }
    const count = $("#schoolCount");
    if (count) count.textContent = `${CITY.schools.length} 所 · 共 ${known} 人`;
  }

  function showCityPanel(city, stick) {
    const panel = $("#mapPanel");
    const wrap = $("#cityMap");
    if (!panel || !wrap) return;
    const schools = CITY.citySchools[city] || [];
    const total = (CITY.univCities.find((c) => c.city === city) || {}).count || 0;

    const homeCount = (CITY.cities.find((c) => c.city === city) || {}).count || 0;
    panel.classList.add("is-active");
    panel.innerHTML = `<h5>${city}<em>就读 ${total} 位 · 家乡 ${homeCount} 位</em></h5>` +
      (schools.length
        ? `<ul>${schools.map((s) => `<li><span>${escapeHtml(s.school)}</span><b>${s.count}</b></li>`).join("")}</ul>`
        : `<ul><li class="empty">暂无院校信息</li></ul>`);
    if (stick) panel.dataset.stick = "1";

    $$(".map-city", wrap).forEach((p) => {
      p.classList.toggle("is-hot", p.dataset.city === city);
      p.classList.toggle("is-dim", p.dataset.city !== city);
    });
    $$(".map-label", wrap).forEach((t) => t.classList.toggle("is-hot", t.dataset.city === city));
    $$(".map-pin", wrap).forEach((t) => t.classList.toggle("is-hot", t.dataset.city === city));
  }

  function resetPanel() {
    const panel = $("#mapPanel");
    if (!panel) return;
    panel.classList.remove("is-active");
    panel.innerHTML = `<p class="ph">悬停或点击地图上的城市，这里会显示该市的院校构成（只到学校与人头，不涉及具体成员）。</p>`;
  }

  function hideCityPanel() {
    const panel = $("#mapPanel");
    const wrap = $("#cityMap");
    if (!panel || panel.dataset.stick === "1") return;
    resetPanel();
    $$(".map-city", wrap).forEach((p) => p.classList.remove("is-hot", "is-dim"));
    $$(".map-label", wrap).forEach((t) => t.classList.remove("is-hot"));
    $$(".map-pin", wrap).forEach((t) => t.classList.remove("is-hot"));
  }

  function renderMap() {
    const map = window.SD_MAP;
    const canvas = $("#mapCanvas");
    const wrap = $("#cityMap");
    if (!map || !canvas) return;

    const counts = {};
    CITY.univCities.forEach((c) => { counts[c.city] = c.count; });
    const max = Math.max(1, ...Object.values(counts));

    const paths = map.cities.map((c, i) => {
      const n = counts[c.name] || 0;
      const t = (n / max).toFixed(2);
      return `<path class="map-city${n ? " has" : ""}" data-city="${c.name}"
        style="--t:${t};--i:${i}" d="${c.d}"></path>`;
    }).join("");

    const labels = map.cities.map((c) =>
      `<text class="map-label" data-city="${c.name}" x="${c.cx}" y="${c.cy - 15}" text-anchor="middle">${c.name}</text>`
    ).join("");

    const pins = map.cities.filter((c) => counts[c.name]).map((c, i) => `
      <g class="map-pin" data-city="${c.name}" style="--i:${i}"
         transform="translate(${c.cx},${c.cy + 9})" tabindex="0" role="button"
         aria-label="${c.name} ${counts[c.name]} 位">
        <circle r="11"></circle>
        <text y="3.6" text-anchor="middle">${counts[c.name]}</text>
      </g>`).join("");

    canvas.innerHTML =
      `<svg viewBox="0 0 ${map.width} ${map.height}" role="img" aria-label="山东省就学城市分布">
         <g class="map-shapes">${paths}</g>
         <g class="map-labels">${labels}</g>
         <g class="map-pins">${pins}</g>
       </svg>`;

    // 入场动画：逐块淡入
    canvas.classList.remove("in");
    if (!reduceMotion) {
      void canvas.offsetWidth;
      setTimeout(() => canvas.classList.add("in"), 30);
    } else {
      canvas.classList.add("in");
    }

    const panel = $("#mapPanel");
    if (panel) { delete panel.dataset.stick; resetPanel(); }

    $$(".map-city.has, .map-pin", wrap).forEach((el) => {
      const city = el.dataset.city;
      el.addEventListener("mouseenter", () => showCityPanel(city));
      el.addEventListener("mouseleave", hideCityPanel);
      el.addEventListener("click", () => showCityPanel(city, true));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showCityPanel(city, true); }
      });
    });
    wrap.addEventListener("mouseleave", () => {
      const p = $("#mapPanel");
      if (p && p.dataset.stick !== "1") { resetPanel(); }
      $$(".map-city", wrap).forEach((x) => x.classList.remove("is-hot", "is-dim"));
      $$(".map-label", wrap).forEach((x) => x.classList.remove("is-hot"));
      $$(".map-pin", wrap).forEach((x) => x.classList.remove("is-hot"));
    });
  }

  function renderCities(mode) {
    cityMode = mode;
    const cfg = cityView[mode];
    const list = cfg.list();
    const unknown = cfg.unknown();
    const isUniv = mode === "univ";
    const total = cfg.total();

    const mainEl = $("#cityMain");
    if (mainEl) { mainEl.textContent = "0"; countUp(mainEl, total, 900); }
    $("#cityMainLabel").textContent = isUniv
      ? `位成员在山东上学 · ${list.length} 座城市`
      : `位成员来自山东 · ${list.length} 座城市`;

    const schoolKnown = CITY.schools.reduce((s, x) => s + x.count, 0);
    const subEl = $("#citySub");
    if (subEl) {
      const outUniv = CITY.univOutside.reduce((s, c) => s + c.count, 0);
      subEl.textContent = isUniv
        ? `${MEMBERS.length} 位成员里，${schoolKnown} 位已填就读院校（共 ${CITY.schools.length} 所），` +
          `其中 ${total} 位在山东 ${list.length} 座城市就读` +
          (outUniv ? `、${outUniv} 位在省外` : "") + `；只统计到学校，不具体到人。`
        : `${MEMBERS.length} 位成员里，${total} 位来自山东的 ${list.length} 座城市，${CITY.outside} 位从省外赶来` +
          (unknown ? `，${unknown} 位还在填写中。` : "。");
    }

    const top = list.slice(0, 2);
    const note = [];
    if (top.length) {
      note.push(top.map((c) => `${c.city} ${c.count} 位`).join("、") + "，是成员最集中的地方。");
    }
    if (isUniv) {
      note.push(`就读院校共 ${CITY.schools.length} 所，威海、泰安、济南最多。`);
    } else if (CITY.outside) {
      note.push(`另有 ${CITY.outside} 位从省外赶来，跨越 ${CITY.outsideCities.length} 座城市。`);
    }
    if (unknown) {
      const schoolMissing = MEMBERS.length - schoolKnown;
      note.push(isUniv
        ? `还有 ${unknown} 位城市、${schoolMissing} 位院校信息待补。`
        : `还有 ${unknown} ${cfg.unknownWord}，等着被补上。`);
    }
    $("#cityNote").textContent = note.join("");

    const chipsBox = $("#outsideChips");
    chipsBox.innerHTML = "";
    if (isUniv) {
      CITY.univOutside.forEach((c) => {
        const el2 = document.createElement("span");
        el2.className = "chip";
        el2.innerHTML = `省外 · ${c.city}<b>${c.count}</b>`;
        chipsBox.appendChild(el2);
      });
      if (MEMBERS.length - schoolKnown > 0) {
        const el = document.createElement("span");
        el.className = "chip";
        el.innerHTML = `院校待补<b>${MEMBERS.length - schoolKnown}</b>`;
        chipsBox.appendChild(el);
      }
      if (MEMBERS.length - schoolKnown !== unknown) {
        const el2 = document.createElement("span");
        el2.className = "chip";
        el2.innerHTML = `城市待补<b>${unknown}</b>`;
        chipsBox.appendChild(el2);
      }
    } else {
      cfg.outside().forEach((c) => {
        const el = document.createElement("span");
        el.className = "chip";
        el.innerHTML = `${c.city}<b>${c.count}</b>`;
        chipsBox.appendChild(el);
      });
    }

    const noteEl = $("#metricNote");
    if (noteEl) {
      noteEl.innerHTML = isUniv
        ? '口径 ｜ 按 <b>就读院校所在城市</b> 统计，与「家乡」不是同一组数字'
        : '口径 ｜ 按 <b>家庭所在地</b> 统计，与「就学城市」不是同一组数字';
    }

    $("#cityBars").hidden = isUniv;
    $("#cityMap").hidden = !isUniv;
    $("#schoolList").hidden = !isUniv;
    $$(".city-visual").forEach((el) => el.classList.toggle("is-map", isUniv));

    if (isUniv) {
      renderMap();
      renderSchoolList();
      const preset = new URLSearchParams(location.search).get("panel");
      if (preset && CITY.citySchools[preset]) showCityPanel(preset, true);
    } else {
      renderBars(list, unknown);
    }

    $$(".seg-btn", $(".cities .seg")).forEach((b) =>
      b.classList.toggle("is-on", b.dataset.mode === mode));
  }

  function initCities() {
    const section = $("#cities");
    const start = () => {
      const preset = new URLSearchParams(location.search).get("mode");
      renderCities(preset === "univ" ? "univ" : "home");
      $$(".cities .seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.dataset.mode === cityMode) return;
          const visual = $(".city-visual");
          visual.style.opacity = "0.2";
          setTimeout(() => {
            renderCities(btn.dataset.mode);
            visual.style.opacity = "1";
          }, 150);
        });
      });
      const visual = $(".city-visual");
      if (visual) visual.style.transition = "opacity .2s ease";
    };

    if (reduceMotion || !("IntersectionObserver" in window)) { start(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { threshold: 0.15 });
    io.observe(section);
  }

  /* ---------------------------------------------------------
     成员
     --------------------------------------------------------- */
  const state = { dept: "all", type: "all", q: "" };

  function memberMatches(m) {
    if (state.dept !== "all" && m.dept !== state.dept) return false;
    if (state.type !== "all" && m.type !== state.type) return false;
    if (!state.q) return true;
    const hay = [m.name, m.city, m.province, m.univCityN, m.school, m.major,
                 m.role, deptLabel(m.dept), (m.keywords || []).join(" ")]
      .join(" ").toLowerCase();
    return hay.includes(state.q.toLowerCase());
  }

  function cardHTML(m) {
    const hasPhoto = !!m.photo;
    const hasIntro = (m.intro || []).length > 0;
    const keys = (m.keywords || []).slice(0, 3);
    const place = [];
    if (placeOf(m)) place.push(`现居 <b>${placeOf(m)}</b>`);
    if (homeOf(m) && homeOf(m) !== placeOf(m)) place.push(`来自 <b>${homeOf(m)}</b>`);

    return `
      <article class="card${hasPhoto ? "" : " is-empty"}" data-name="${m.name}">
        <div class="photo${hasPhoto ? "" : " empty"}">
          ${hasPhoto
            ? `<img class="bg" src="${m.photo}" alt="" aria-hidden="true" loading="lazy">
               <img class="fg" src="${m.photo}" alt="${m.name}" loading="lazy">`
            : `<div class="ph"><b>待 补</b><span>PHOTO COMING SOON</span></div>`}
          <span class="badge${m.type === "新成员" ? " new" : ""}">${m.type}</span>
        </div>
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-name">${m.name}</h3>
            <span class="card-role">${m.role}</span>
          </div>
          <div class="card-dept">
            <span class="tag">${deptLabel(m.dept)}</span>
            ${m.degree ? `<span class="tag ghost">${m.degree}</span>` : ""}
          </div>
          <p class="card-place">${place.join(" · ") || "信息待补"}</p>
          <div class="card-keys">
            ${keys.length
              ? keys.map((k) => `<span class="key">${k}</span>`).join("")
              : `<span class="key" style="background:#F4EFE6;color:#9C9184">关键词待补</span>`}
          </div>
          <div class="card-foot">
            <button class="more-btn" data-open="${m.name}" ${hasIntro ? "" : "disabled"}>
              ${hasIntro ? "点击查看详情 <i>→</i>" : "敬请期待"}
            </button>
            <span class="card-flag">${hasPhoto ? "NO." + String(m.no).padStart(2, "0") : "TO BE ADDED"}</span>
          </div>
        </div>
      </article>`;
  }

  function renderMembers() {
    const list = MEMBERS.filter(memberMatches)
      .slice()
      .sort((a, b) => (a.photo ? 0 : 1) - (b.photo ? 0 : 1) || a.no - b.no);
    $("#grid").innerHTML = list.map(cardHTML).join("");
    $("#shown").textContent = list.length;
    $("#empty").hidden = list.length > 0;
    $$(".card", $("#grid")).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i * 30, 240) + "ms";
      requestAnimationFrame(() => el.classList.add("in"));
    });
  }

  function initFilters() {
    const box = $("#deptFilter");
    const counts = {};
    MEMBERS.forEach((m) => { counts[m.dept] = (counts[m.dept] || 0) + 1; });

    const chips = [{ key: "all", label: "全部", n: MEMBERS.length }].concat(
      DEPT_ORDER.filter((d) => counts[d]).map((d) => ({ key: d, label: deptLabel(d), n: counts[d] }))
    );
    box.innerHTML = chips.map((c) => `
      <button class="chip${c.key === "all" ? " is-on" : ""}" data-dept="${c.key}">
        ${c.label}<b>${c.n}</b>
      </button>`).join("");

    box.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-dept]");
      if (!btn) return;
      state.dept = btn.dataset.dept;
      $$(".chip", box).forEach((c) => c.classList.toggle("is-on", c === btn));
      renderMembers();
    });

    $$("#typeFilter .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.type = btn.dataset.type;
        $$("#typeFilter .seg-btn").forEach((b) => b.classList.toggle("is-on", b === btn));
        renderMembers();
      });
    });

    let timer;
    $("#search").addEventListener("input", (e) => {
      clearTimeout(timer);
      const v = e.target.value.trim();
      timer = setTimeout(() => { state.q = v; renderMembers(); }, 140);
    });
  }

  /* ---------------------------------------------------------
     详情弹窗
     --------------------------------------------------------- */
  function openMember(name) {
    const m = MEMBERS.find((x) => x.name === name);
    if (!m) return;
    const modal = $("#modal");

    $("#modalName").textContent = m.name;

    const tags = [`<span class="tag">${deptLabel(m.dept)}</span>`,
                  `<span class="tag">${m.role}</span>`];
    if (m.type) tags.push(`<span class="tag ghost">${m.type}</span>`);
    $("#modalTags").innerHTML = tags.join("");

    const meta = [];
    if (placeOf(m)) meta.push(`现居 ${placeOf(m)}`);
    if (homeOf(m) && homeOf(m) !== placeOf(m)) meta.push(`来自 ${homeOf(m)}`);
    if (m.school) meta.push(m.school);
    if (m.major) meta.push(m.major);
    if (m.year) meta.push(`${m.year} 级`);
    if (m.degree) meta.push(m.degree);
    $("#modalMeta").innerHTML = meta.length
      ? meta.map((t) => `<span>${escapeHtml(t)}</span>`).join("<i>/</i>")
      : "<span>信息待补</span>";

    $("#modalKeywords").innerHTML = (m.keywords || [])
      .map((k) => `<span class="key">${k}</span>`).join("");

    const photo = $("#modalPhoto");
    photo.innerHTML = m.photo
      ? `<img class="bg" src="${m.photo}" alt="" aria-hidden="true">
         <img class="fg" src="${m.photo}" alt="${m.name}">`
      : `<div class="ph">待 补</div>`;

    const intro = $("#modalIntro");
    if ((m.intro || []).length) {
      intro.innerHTML = m.intro.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    } else {
      intro.innerHTML = `<p class="wait">这位伙伴的自我介绍还在路上，敬请期待。</p>`;
    }

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal-card", modal).scrollTop = 0;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function closeModal() {
    $("#modal").hidden = true;
    document.body.style.overflow = "";
  }

  function initModal() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open]");
      if (btn) { openMember(btn.dataset.open); return; }
      if (e.target.closest("[data-close]") || e.target.closest("#modalClose")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#modal").hidden) closeModal();
    });
  }

  /* ---------------------------------------------------------
     启动
     --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initCities();
    initFilters();
    renderMembers();
    initModal();
    watchReveal(document);

    // 深链：?open=姓名（或编号）
    const params = new URLSearchParams(location.search);
    const target = params.get("open");
    if (target) {
      const hit = MEMBERS.find((m) => m.name === target || String(m.no) === target);
      if (hit) setTimeout(() => openMember(hit.name), 260);
    }

    // 所有总数都从数据现算：成员数 / 部门数 / 城市数 / 已上传介绍数
    const withIntro = MEMBERS.filter((m) => (m.intro || []).length > 0).length;
    const deptCount = new Set(MEMBERS.map((m) => m.dept).filter(Boolean)).size;
    const totals = [MEMBERS.length, deptCount, CITY.cityTotal, withIntro];

    $$(".hero .stat").forEach((stat, i) => {
      const numEl = $(".num", stat);
      if (numEl && totals[i] != null) {
        numEl.dataset.count = String(totals[i]);
        numEl.textContent = "0";
      }
    });

    const heroTotal = $("#heroTotal");
    if (heroTotal) heroTotal.textContent = MEMBERS.length;
    const totalCount = $("#totalCount");
    if (totalCount) totalCount.textContent = MEMBERS.length;

    const membersSub = $(".members .sec-sub");
    if (membersSub) {
      membersSub.textContent =
        `${withIntro} 位伙伴带来了照片与自我介绍，可以点开看看他们写了什么；` +
        `其余 ${MEMBERS.length - withIntro} 位的「待补」位，留给正在路上的故事。`;
    }

    // 首屏数字
    $$(".hero .num").forEach((el) => {
      const to = Number(el.dataset.count || 0);
      setTimeout(() => countUp(el, to, 1200), 200);
    });
  });
})();
