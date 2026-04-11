/**
 * Learn Bridge — 공통 스크립트
 * 피그마 보드(동일 주제 PDF 화면구성) 기준 학생 플로우를 지원합니다.
 *
 * - 카드 등장(reveal), 프로그레스 바 애니메이션
 * - 강의(수업) 자료 필터(구 courses 그리드, 사용 시)
 * - 수업 자료 상세: URL ?id=week-day
 * - AI 피드백 / 추가 과제: 3단계 플로우 마법사 + 모달
 * - 출석 체크: 데모 결과 토글
 * - 공지: 목록에서 항목 클릭 시 상세 표시
 * - 수업 자료 주차: ?week= 쿼리 시 요일 목록 표시
 * - 로그인/회원가입: Korea 그룹 학원 선택, 학생·교사 탭, sessionStorage(lb_academy)
 */

(function () {
  "use strict";

  var ACADEMY_STORAGE_KEY = "lb_academy";

  /* ---------- 모든 페이지: 저장된 소속 학원을 라벨·hidden input에 반영 ---------- */
  function restoreAcademyFromStorage() {
    try {
      var saved = sessionStorage.getItem(ACADEMY_STORAGE_KEY);
      if (!saved) return;
      document.querySelectorAll("[data-academy-label]").forEach(function (el) {
        el.textContent = saved;
      });
      document.querySelectorAll("[data-academy-input]").forEach(function (inp) {
        inp.value = saved;
      });
      document.querySelectorAll("[data-home-academy]").forEach(function (el) {
        el.textContent = saved;
      });
    } catch (e) {}
  }

  /* ---------- 로그인: 학생/교사 탭, URL 해시 ---------- */
  function initAuthLogin() {
    var root = document.querySelector("[data-auth-root]");
    if (!root) return;

    function activateRole(role) {
      root.querySelectorAll("[data-role-tab]").forEach(function (t) {
        var on = t.getAttribute("data-role-tab") === role;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      root.querySelectorAll("[data-login-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-login-panel") !== role;
      });
    }

    root.querySelectorAll("[data-role-tab]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        activateRole(tab.getAttribute("data-role-tab"));
      });
    });

    var hash = (window.location.hash || "").replace("#", "");
    if (hash === "teacher" || hash === "instructor") activateRole("teacher");
    else activateRole("student");
  }

  /* ---------- 학원 선택 모달: Korea 그룹 제휴 학원 목록 (피그마「학원 찾기」) ---------- */
  function initAcademyPickButtons() {
    document.addEventListener("click", function (e) {
      var pick = e.target.closest("[data-academy-pick]");
      if (!pick) return;
      var name = pick.getAttribute("data-academy-pick");
      if (!name) return;

      document.querySelectorAll("[data-academy-label]").forEach(function (el) {
        el.textContent = name;
      });
      document.querySelectorAll("[data-academy-input]").forEach(function (inp) {
        inp.value = name;
      });
      document.querySelectorAll("[data-home-academy]").forEach(function (el) {
        el.textContent = name;
      });
      try {
        sessionStorage.setItem(ACADEMY_STORAGE_KEY, name);
      } catch (err) {}

      var modal = pick.closest(".modal-overlay");
      if (modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  /* ---------- 회원가입 폼: 데모 제출 시 완료 페이지로 ---------- */
  function initSignupForm() {
    var form = document.querySelector("[data-signup-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var role = (form.querySelector('input[name="role"]:checked') || {}).value || "student";
      window.location.href = "signup-complete.html?role=" + encodeURIComponent(role);
    });
  }

  /* ---------- IntersectionObserver: 카드가 화면에 보이면 .is-visible 부여 ---------- */
  function initCardReveal() {
    var cards = document.querySelectorAll(".card-reveal");
    if (!cards.length || !("IntersectionObserver" in window)) {
      cards.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
    );
    cards.forEach(function (el) {
      obs.observe(el);
    });
  }

  /* ---------- 프로그레스 바 ---------- */
  function initProgressBars() {
    var fills = document.querySelectorAll(".progress-fill[data-progress]");
    fills.forEach(function (el) {
      var p = parseInt(el.getAttribute("data-progress"), 10);
      if (isNaN(p)) p = 0;
      p = Math.max(0, Math.min(100, p));
      requestAnimationFrame(function () {
        el.style.width = p + "%";
      });
    });
  }

  /* ---------- 강의 목록 칩 필터 (레거시 그리드 페이지용) ---------- */
  function initCourseFilter() {
    var bar = document.querySelector("[data-filter-bar]");
    var grid = document.querySelector("[data-courses-grid]");
    if (!bar || !grid) return;

    var chips = bar.querySelectorAll(".chip[data-category]");
    var cards = grid.querySelectorAll(".course-card-item");

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var cat = chip.getAttribute("data-category");
        chips.forEach(function (c) {
          c.classList.toggle("is-on", c === chip);
        });
        cards.forEach(function (card) {
          var cardCat = card.getAttribute("data-category") || "all";
          var show = cat === "all" || cardCat === cat;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /* ---------- 수업 자료 요일 상세 (detail.html) ---------- */
  var MATERIAL_DB = {
    "3-wed": {
      title: "3주차 · 수요일 수업 자료",
      topic: "JavaScript DOM 조작과 이벤트",
      className: "바이브 코딩 실전반 A",
      desc: "당일 배운 주제: querySelector, addEventListener, 폼 유효성 검사 개요.",
      files: ["03-lecture-slides.pdf", "practice-dom.html", "cheat-sheet.pdf"],
    },
    "2-mon": {
      title: "2주차 · 월요일 수업 자료",
      topic: "HTML 시맨틱 마크업",
      className: "바이브 코딩 실전반 A",
      desc: "header/nav/main/article 시맨틱 태그와 접근성 속성(aria) 기초.",
      files: ["02-notes.pdf", "semantic-example.zip"],
    },
    "1-thu": {
      title: "1주차 · 목요일 수업 자료",
      topic: "개발 환경과 Git 기초",
      className: "바이브 코딩 실전반 A",
      desc: "VS Code, 터미널, git clone / commit / push 흐름.",
      files: ["01-intro.pdf", "git-commands.pdf"],
    },
  };

  function renderMaterialDetail() {
    var root = document.querySelector("[data-material-root]");
    if (!root) return;

    var id = getQueryParam("id") || "3-wed";
    var data = MATERIAL_DB[id];
    if (!data) {
      data = MATERIAL_DB["3-wed"];
      id = "3-wed";
    }

    var setText = function (sel, text) {
      var el = root.querySelector(sel);
      if (el) el.textContent = text;
    };

    setText("[data-field='title']", data.title);
    setText("[data-field='topic']", data.topic);
    setText("[data-field='class']", data.className);
    setText("[data-field='desc']", data.desc);

    var fileList = root.querySelector("[data-file-list]");
    if (fileList) {
      fileList.innerHTML = "";
      data.files.forEach(function (name) {
        var li = document.createElement("li");
        li.className = "curriculum-item";
        li.innerHTML =
          '<span class="curriculum-num">↓</span><div><strong>' +
          name +
          '</strong><br><span style="font-size:0.8rem;color:var(--color-text-muted)">수업 자료 다운로드 (데모)</span></div>';
        fileList.appendChild(li);
      });
    }

    document.title = data.title + " | Learn Bridge";
  }

  /* ---------- 플로우 마법사: Step 1 날짜 → Step2 Qn → Step3 내용 (페이지에 여러 개 있을 수 있음) ---------- */
  function initFlowWizard() {
    document.querySelectorAll("[data-flow-wizard]").forEach(function (root) {
      var panels = root.querySelectorAll("[data-flow-step]");
      var dots = root.querySelectorAll("[data-flow-dot]");
      var selectedDateEls = root.querySelectorAll("[data-selected-date]");
      var selectedQEls = root.querySelectorAll("[data-selected-q]");

      function goStep(n) {
        panels.forEach(function (p) {
          var s = parseInt(p.getAttribute("data-flow-step"), 10);
          p.classList.toggle("is-active", s === n);
        });
        dots.forEach(function (d, i) {
          var stepNum = i + 1;
          d.classList.toggle("is-active", stepNum === n);
          d.classList.toggle("is-done", stepNum < n);
        });
      }

      root.addEventListener("click", function (e) {
        var t = e.target;
        var dateBtn = t.closest("[data-pick-date]");
        if (dateBtn && root.contains(dateBtn)) {
          var label = dateBtn.getAttribute("data-pick-date") || dateBtn.textContent.trim();
          selectedDateEls.forEach(function (el) {
            el.textContent = label;
          });
          goStep(2);
          return;
        }
        var qBtn = t.closest("[data-pick-q]");
        if (qBtn && root.contains(qBtn)) {
          var q = qBtn.getAttribute("data-pick-q") || qBtn.textContent.trim();
          selectedQEls.forEach(function (el) {
            el.textContent = q;
          });
          goStep(3);
          return;
        }
        var back = t.closest("[data-flow-back]");
        if (back && root.contains(back)) {
          var to = parseInt(back.getAttribute("data-flow-back"), 10);
          if (!isNaN(to)) goStep(to);
        }
      });

      goStep(1);
    });
  }

  /* ---------- 모달: 자체 AI / 안내 ---------- */
  function initModals() {
    document.addEventListener("click", function (e) {
      var openBtn = e.target.closest("[data-modal-open]");
      if (openBtn) {
        var id = openBtn.getAttribute("data-modal-open");
        var modal = id && document.getElementById(id);
        if (modal) {
          modal.classList.add("is-open");
          modal.setAttribute("aria-hidden", "false");
        }
        return;
      }
      var closeBtn = e.target.closest("[data-modal-close]");
      if (closeBtn) {
        var modalClose = closeBtn.closest(".modal-overlay");
        if (modalClose) {
          modalClose.classList.remove("is-open");
          modalClose.setAttribute("aria-hidden", "true");
        }
        return;
      }
      var overlay = e.target;
      if (overlay.classList && overlay.classList.contains("modal-overlay")) {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
      }
    });
  }

  /* ---------- 출석 체크방 데모 ---------- */
  function initAttendanceDemo() {
    var root = document.querySelector("[data-attendance-root]");
    if (!root) return;

    var btn = root.querySelector("[data-check-in]");
    var results = root.querySelectorAll("[data-attendance-result]");

    btn.addEventListener("click", function () {
      results.forEach(function (r) {
        r.classList.remove("is-on");
      });
      /* PDF: 수업 시간 내 클릭 시 출석, 지각/결석 분기 — 데모는 랜덤으로 시연 */
      var r = Math.random();
      var key = r < 0.7 ? "ok" : r < 0.9 ? "late" : "absent";
      var el = root.querySelector('[data-attendance-result="' + key + '"]');
      if (el) el.classList.add("is-on");
    });
  }

  /* ---------- 공지사항: 항목 클릭 시 상세 ---------- */
  function initNoticeList() {
    var root = document.querySelector("[data-notice-root]");
    if (!root) return;

    root.addEventListener("click", function (e) {
      var back = e.target.closest("[data-notice-back]");
      if (back) {
        root.querySelectorAll(".notice-list").forEach(function (l) {
          l.style.display = "";
        });
        root.querySelectorAll(".notice-detail").forEach(function (d) {
          d.classList.remove("is-active");
        });
        return;
      }

      var item = e.target.closest("[data-notice-id]");
      if (!item) return;
      e.preventDefault();
      var nid = item.getAttribute("data-notice-id");
      root.querySelectorAll(".notice-list").forEach(function (l) {
        l.style.display = "none";
      });
      root.querySelectorAll(".notice-detail").forEach(function (d) {
        d.classList.remove("is-active");
      });
      var detail = root.querySelector('.notice-detail[data-notice-detail="' + nid + '"]');
      if (detail) detail.classList.add("is-active");
    });
  }

  /* ---------- 수업 자료: 주차 선택 후 요일 목록 ---------- */
  function initMaterialsWeekView() {
    var root = document.querySelector("[data-materials-root]");
    if (!root) return;

    var weekPicker = root.querySelector("[data-week-picker]");
    var dayPanel = root.querySelector("[data-day-panel]");
    var weekTitle = root.querySelector("[data-week-title]");

    var week = getQueryParam("week");
    if (week && dayPanel && weekPicker) {
      weekPicker.style.display = "none";
      dayPanel.style.display = "";
      if (weekTitle) weekTitle.textContent = week + "주차 · 요일별 수업 자료";
      /* 현재 주차 칩 강조 */
      root.querySelectorAll(".week-chip").forEach(function (chip) {
        if (chip.getAttribute("href") && chip.getAttribute("href").indexOf("week=" + week) !== -1) {
          chip.classList.add("is-current");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    restoreAcademyFromStorage();
    initAuthLogin();
    initAcademyPickButtons();
    initSignupForm();
    initCardReveal();
    initProgressBars();
    initCourseFilter();
    renderMaterialDetail();
    initFlowWizard();
    initModals();
    initAttendanceDemo();
    initNoticeList();
    initMaterialsWeekView();
  });
})();
