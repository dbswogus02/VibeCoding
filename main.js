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
 * - 역할 저장: lb_role(student|teacher) — Q&A·쪽지 뱃지
 * - Q&A: 익명 등록, 관련 문제(AI/복습/과제) 연동, localStorage 스레드
 * - 쪽지: 담당 강사 등에게 개인 메시지(localStorage)
 */

(function () {
  "use strict";

  var ACADEMY_STORAGE_KEY = "lb_academy";
  var ROLE_STORAGE_KEY = "lb_role";
  var QA_STORAGE_KEY = "lb_qa_threads_v2";
  var NOTES_STORAGE_KEY = "lb_notes_v1";
  var MESSAGES_STORAGE_KEY = "lb_messages_v1";

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

  /* ---------- 회원가입 폼: 데모 제출 시 완료 페이지로 + 역할·이름 저장 ---------- */
  function initSignupForm() {
    var form = document.querySelector("[data-signup-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var role = (form.querySelector('input[name="role"]:checked') || {}).value || "student";
      var mapped = role === "teacher" ? "teacher" : "student";
      try {
        sessionStorage.setItem(ROLE_STORAGE_KEY, mapped);
      } catch (err) {}
      window.location.href = "signup-complete.html?role=" + encodeURIComponent(role);
    });
  }

  /* ---------- 로그인 제출 시 역할만 저장 (표시 이름은 사용하지 않음) ---------- */
  function initLoginRolePersistence() {
    var stu = document.querySelector('form[data-login-panel="student"]');
    if (stu) {
      stu.addEventListener("submit", function () {
        try {
          sessionStorage.setItem(ROLE_STORAGE_KEY, "student");
        } catch (e) {}
      });
    }

    var teaForm = document.querySelector('form[data-login-panel="teacher"]');
    if (teaForm) {
      teaForm.addEventListener("submit", function () {
        try {
          sessionStorage.setItem(ROLE_STORAGE_KEY, "teacher");
        } catch (err) {}
      });
    }
  }

  function getQaUser() {
    var role = "student";
    try {
      role = sessionStorage.getItem(ROLE_STORAGE_KEY) || "student";
    } catch (e) {}
    if (role !== "teacher") role = "student";
    return { role: role };
  }

  function roleLabel(role) {
    if (role === "teacher") return "강사";
    return "학생";
  }

  /* ---------- Q&A 메시지 표시명(익명 학생 등) ---------- */
  function messageAuthorLabel(m) {
    if (m.role === "teacher") return "강사";
    if (m.anonymous) return "익명";
    return "학생";
  }

  function messageBadgeClass(m) {
    if (m.role === "teacher") return "teacher";
    if (m.anonymous) return "anon";
    return "student";
  }

  function messageBadgeText(m) {
    if (m.role === "teacher") return "강사";
    if (m.anonymous) return "익명";
    return "학생";
  }

  /* ---------- 질문 등록 시 관련 문제 연동 ---------- */
  function buildRelatedProblem(presetVal, noteExtra) {
    var note = (noteExtra || "").trim();
    if (!presetVal || presetVal === "none") return null;
    var suffix = note ? " · " + note : "";
    if (presetVal.indexOf("ai|") === 0) {
      var q = presetVal.slice(3);
      return { kind: "ai_feedback", label: "AI 피드백 · " + q + suffix, href: "feedback.html" };
    }
    if (presetVal.indexOf("review|") === 0) {
      var r = presetVal.slice(7);
      return { kind: "review", label: "복습 문제 · " + r + suffix, href: "review.html" };
    }
    if (presetVal.indexOf("assign|") === 0) {
      var a = presetVal.slice(7);
      return { kind: "assignment", label: "추가 학습 과제 · " + a + suffix, href: "assignment.html" };
    }
    if (presetVal === "material") {
      return { kind: "material", label: "수업 자료" + suffix, href: "materials.html" };
    }
    if (presetVal === "custom") {
      if (!note) return null;
      return { kind: "custom", label: note, href: "" };
    }
    return null;
  }

  function migrateQaThreadsInPlace(arr) {
    var dirty = false;
    if (!Array.isArray(arr)) return false;
    arr.forEach(function (t) {
      (t.messages || []).forEach(function (m) {
        if (m.role === "ta") {
          m.role = "teacher";
          dirty = true;
        }
      });
    });
    return dirty;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadQaThreads() {
    try {
      var raw = localStorage.getItem(QA_STORAGE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) {
          if (migrateQaThreadsInPlace(arr)) saveQaThreads(arr);
          return arr;
        }
      }
      var oldKey = "lb_qa_threads_v1";
      var oldRaw = localStorage.getItem(oldKey);
      if (oldRaw) {
        var oldArr = JSON.parse(oldRaw);
        if (Array.isArray(oldArr) && oldArr.length) {
          migrateQaThreadsInPlace(oldArr);
          saveQaThreads(oldArr);
          try {
            localStorage.removeItem(oldKey);
          } catch (x) {}
          return oldArr;
        }
      }
    } catch (e) {}
    var seed = qaSeedThreads();
    saveQaThreads(seed);
    return seed;
  }

  function qaSeedThreads() {
    return [
      {
        id: "seed-1",
        title: "Flex에서 gap과 margin의 차이는?",
        className: "바이브 코딩 실전반 A",
        relatedProblem: { kind: "review", label: "복습 문제 · 2주차 월요일", href: "review.html" },
        messages: [
          {
            id: "m1",
            role: "student",
            name: "김민수",
            body: "둘 다 간격처럼 보이는데 실무에서는 어떻게 구분해서 쓰면 될까요?",
            at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: "m2",
            role: "teacher",
            name: "박강사",
            body: "gap은 flex·grid 컨테이너 안에서 자식 요소 사이의 균일한 간격을 줄 때 쓰고, margin은 각 박스의 외곽 여백이라 레이아웃 밖으로 밀어낼 때 씁니다.",
            at: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      {
        id: "seed-2",
        title: "과제 제출은 어디서 하나요?",
        className: "바이브 코딩 실전반 A",
        relatedProblem: { kind: "assignment", label: "추가 학습 과제 · 4/9 수", href: "assignment.html" },
        messages: [
          {
            id: "m3",
            role: "student",
            name: "이서연",
            body: "추가 학습 과제 메뉴에서 제출하면 될까요?",
            at: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
          {
            id: "m4",
            role: "teacher",
            name: "강사",
            body: "네, 학생 홈 → 추가 학습 과제에서 제출해 주시면 강사진이 확인합니다.",
            at: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
        ],
      },
    ];
  }

  function saveQaThreads(threads) {
    try {
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(threads));
    } catch (e) {}
  }

  /* ---------- 메시지 알림 시스템 ---------- */
  function saveMessages(messages) {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {}
  }

  function loadMessages() {
    try {
      var raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    return [];
  }

  function addMessage(message) {
    var messages = loadMessages();
    messages.unshift(message);
    saveMessages(messages);
    
    // Show notification badge
    updateMessageBadge();
  }

  function updateMessageBadge() {
    var messages = loadMessages();
    var unreadCount = messages.filter(function(m) {
      return !m.read && m.recipient === getQaUser().id;
    }).length;
    
    var badge = document.querySelector("[data-message-badge]");
    if (badge) {
      badge.textContent = unreadCount > 0 ? `쪽지 (${unreadCount})` : "쪽지";
      badge.style.display = unreadCount > 0 ? "inline-block" : "none";
    }
  }

  /* ---------- Q&A 편집/삭제 기능 ---------- */
  function editThread(id) {
    var threads = loadQaThreads();
    var thread = threads.filter(function (x) {
      return x.id === id;
    })[0];
    if (!thread) return;
    
    // Allow editing of all student posts (not just own posts)
    var user = getQaUser();
    if (user.role !== "student") {
      alert("학생만 편집할 수 있습니다.");
      return;
    }
    
    var newTitle = prompt("질문 제목을 수정하세요:", thread.title);
    var newContent = prompt("질문 내용을 수정하세요:", thread.messages && thread.messages[0] ? thread.messages[0].body : "");
    
    if (newTitle !== null && newTitle.trim() !== "") {
      thread.title = newTitle.trim();
    }
    if (newContent !== null && newContent.trim() !== "") {
      if (thread.messages && thread.messages[0]) {
        thread.messages[0].body = newContent.trim();
      }
    }
    
    saveQaThreads(threads);
    renderThreadList(threads);
    if (currentThreadId === id) {
      var detailTitle = document.querySelector("[data-qa-detail-title]");
      if (detailTitle) detailTitle.textContent = thread.title;
      
      // Update content in detail view if currently viewing this thread
      var firstMessage = document.querySelector(".qa-msg--student");
      if (firstMessage) {
        firstMessage.querySelector(".qa-msg-body").textContent = thread.messages[0].body;
      }
    }
  }

  function deleteThread(id) {
    var threads = loadQaThreads();
    var thread = threads.filter(function (x) {
      return x.id === id;
    })[0];
    if (!thread || thread.author !== getQaUser().id) return;
    
    threads = threads.filter(function (x) {
      return x.id !== id;
    });
    saveQaThreads(threads);
    renderThreadList(threads);
    
    if (currentThreadId === id) {
      // Go back to list view if deleting current thread
      var listView = document.querySelector("[data-qa-list-view]");
      var detailView = document.querySelector("[data-qa-detail-view]");
      if (listView) listView.hidden = false;
      if (detailView) detailView.hidden = true;
      currentThreadId = null;
    }
  }

  /* ---------- Q&A 페이지: 목록·상세·작성·답글·익명·관련 문제 ---------- */
  function initQAForum() {
    var root = document.querySelector("[data-qa-root]");
    if (!root) return;

    var listView = root.querySelector("[data-qa-list-view]");
    var detailView = root.querySelector("[data-qa-detail-view]");
    var threadListEl = root.querySelector("[data-qa-thread-list]");
    var detailTitle = root.querySelector("[data-qa-detail-title]");
    var detailClass = root.querySelector("[data-qa-detail-class]");
    var detailRelated = root.querySelector("[data-qa-detail-related]");
    var msgListEl = root.querySelector("[data-qa-messages]");
    var formNew = root.querySelector("[data-qa-form-new]");
    var formReply = root.querySelector("[data-qa-form-reply]");
    var backBtn = root.querySelector("[data-qa-back-list]");
    var anonNewRow = root.querySelector("[data-qa-anon-new-row]");
    var anonReplyRow = root.querySelector("[data-qa-anon-reply-row]");
    var relatedNoteRow = root.querySelector("[data-qa-related-note-row]");
    var currentThreadId = null;

    var user = getQaUser();
    var homeHref = user.role === "teacher" ? "teacher.html" : "index.html";
    root.querySelectorAll("[data-qa-back-home]").forEach(function (a) {
      a.setAttribute("href", homeHref);
    });

    var badgeEl = root.querySelector("[data-qa-role-badge]");
    if (badgeEl) {
      badgeEl.textContent = roleLabel(user.role);
      badgeEl.className = "role-badge role-badge--" + user.role;
    }

    if (anonNewRow) anonNewRow.hidden = user.role !== "student";
    if (anonReplyRow) anonReplyRow.hidden = user.role !== "student";

    var relSel = formNew && formNew.querySelector("[name=qa_related]");
    if (relSel && relatedNoteRow) {
      relSel.addEventListener("change", function () {
        relatedNoteRow.hidden = relSel.value !== "custom";
      });
      relatedNoteRow.hidden = relSel.value !== "custom";
    }

    renderThreadList(loadQaThreads());

    root.addEventListener("click", function (e) {
      var threadBtn = e.target.closest("[data-thread-id]");
      if (threadBtn) {
        var id = threadBtn.getAttribute("data-thread-id");
        openThread(id);
        return;
      }

      var editBtn = e.target.closest("[data-thread-edit]");
      if (editBtn) {
        var id = editBtn.getAttribute("data-thread-edit");
        editThread(id);
        return;
      }

      var deleteBtn = e.target.closest("[data-thread-delete]");
      if (deleteBtn) {
        var id = deleteBtn.getAttribute("data-thread-delete");
        deleteThread(id);
        return;
      }

      if (e.target.closest("[data-qa-back-list]")) {
        currentThreadId = null;
        if (listView) listView.hidden = false;
        if (detailView) detailView.hidden = true;
        renderThreadList(loadQaThreads());
      }
    });

    function renderThreadList(threads) {
      if (!threadListEl) return;
      threadListEl.innerHTML = "";
      threads.forEach(function (t) {
        var first = t.messages && t.messages[0];
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "qa-thread-item card-reveal";
        btn.setAttribute("data-thread-id", t.id);
        var meta = document.createElement("div");
        meta.className = "qa-thread-meta";
        var metaText = t.className + " · 답글 " + (t.messages ? t.messages.length : 0) + "건";
        if (t.relatedProblem && t.relatedProblem.label) {
          metaText += " · " + t.relatedProblem.label;
        }
        meta.textContent = metaText;
        var h = document.createElement("p");
        h.className = "qa-thread-title";
        h.textContent = t.title;
        var sn = document.createElement("p");
        sn.className = "qa-thread-snippet";
        sn.textContent = first ? first.body : "";
        
        // Add edit/delete buttons for all student posts
        var actions = document.createElement("div");
        actions.className = "qa-thread-actions";
        actions.style.marginTop = "8px";
        actions.style.display = "flex";
        actions.style.gap = "8px";
        
        // Show edit button for all student posts
        var editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-ghost btn-xs";
        editBtn.textContent = "편집";
        editBtn.setAttribute("data-thread-edit", t.id);
        editBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          editThread(t.id);
        });
        
        // Show delete button only for own posts
        if (t.author === getQaUser().id) {
          var deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = "btn btn-ghost btn-xs btn-danger";
          deleteBtn.textContent = "삭제";
          deleteBtn.setAttribute("data-thread-delete", t.id);
          deleteBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            if (confirm("정말 삭제하시겠습니까?")) {
              deleteThread(t.id);
            }
          });
          
          actions.appendChild(deleteBtn);
        }
        
        actions.appendChild(editBtn);
        
        btn.appendChild(meta);
        btn.appendChild(h);
        btn.appendChild(sn);
        btn.appendChild(actions);
        threadListEl.appendChild(btn);
      });
    }

    function formatTime(iso) {
      try {
        var d = new Date(iso);
        return d.toLocaleString("ko-KR", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return "";
      }
    }

    function renderMessages(thread) {
      if (!msgListEl) return;
      msgListEl.innerHTML = "";
      (thread.messages || []).forEach(function (m) {
        var wrap = document.createElement("article");
        var bc = messageBadgeClass(m);
        wrap.className = "qa-msg qa-msg--" + (bc === "anon" ? "student" : bc);
        if (m.anonymous) wrap.classList.add("qa-msg--anonymous");
        var head = document.createElement("div");
        head.className = "qa-msg-head";
        var b = document.createElement("span");
        b.className = "role-badge role-badge--" + bc;
        b.textContent = messageBadgeText(m);
        var nm = document.createElement("span");
        nm.className = "qa-msg-name";
        nm.textContent = messageAuthorLabel(m);
        var tm = document.createElement("span");
        tm.className = "qa-msg-time";
        tm.textContent = formatTime(m.at);
        head.appendChild(b);
        head.appendChild(nm);
        head.appendChild(tm);
        var body = document.createElement("p");
        body.className = "qa-msg-body";
        body.textContent = m.body;
        wrap.appendChild(head);
        wrap.appendChild(body);
        msgListEl.appendChild(wrap);
      });
      msgListEl.scrollTop = msgListEl.scrollHeight;
    }

    function renderDetailRelated(t) {
      if (!detailRelated) return;
      detailRelated.innerHTML = "";
      detailRelated.hidden = true;
      if (!t.relatedProblem || !t.relatedProblem.label) return;
      detailRelated.hidden = false;
      var p = document.createElement("p");
      p.className = "qa-related-banner";
      var strong = document.createElement("strong");
      strong.textContent = "연동된 문제 · ";
      p.appendChild(strong);
      p.appendChild(document.createTextNode(t.relatedProblem.label + " "));
      if (t.relatedProblem.href) {
        var a = document.createElement("a");
        a.href = t.relatedProblem.href;
        a.textContent = "바로가기";
        p.appendChild(a);
      }
      detailRelated.appendChild(p);
    }

    function openThread(id) {
      var threads = loadQaThreads();
      var t = threads.filter(function (x) {
        return x.id === id;
      })[0];
      if (!t) return;
      currentThreadId = id;
      if (listView) listView.hidden = true;
      if (detailView) detailView.hidden = false;
      if (detailTitle) detailTitle.textContent = t.title;
      if (detailClass) detailClass.textContent = t.className;
      renderDetailRelated(t);
      renderMessages(t);
      if (formReply) {
        var hint = formReply.querySelector("[data-qa-reply-hint]");
        if (hint) {
          hint.textContent =
            user.role === "student"
              ? "추가 질문·감사 인사를 남길 수 있습니다. 익명으로 답글을 남길 수도 있습니다."
              : "학생 질문에 답글을 남깁니다.";
        }
        var ca = formReply.querySelector("[name=qa_reply_anonymous]");
        if (ca) ca.checked = false;
      }
    }

    function showList() {
      currentThreadId = null;
      if (listView) listView.hidden = false;
      if (detailView) detailView.hidden = true;
      renderThreadList(loadQaThreads());
    }

    if (threadListEl) {
      threadListEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-thread-id]");
        if (!btn) return;
        openThread(btn.getAttribute("data-thread-id"));
      });
    }

    if (backBtn) backBtn.addEventListener("click", showList);

    if (formNew) {
      formNew.addEventListener("submit", function (e) {
        e.preventDefault();
        var titleIn = formNew.querySelector("[name=qa_title]");
        var bodyIn = formNew.querySelector("[name=qa_body]");
        var title = titleIn && titleIn.value ? titleIn.value.trim() : "";
        var body = bodyIn && bodyIn.value ? bodyIn.value.trim() : "";
        if (!title || !body) return;
        var preset = (formNew.querySelector("[name=qa_related]") || {}).value || "none";
        var note = (formNew.querySelector("[name=qa_related_note]") || {}).value || "";
        if (preset === "custom" && !note.trim()) {
          alert("「기타」를 선택한 경우 보조 설명란에 연동할 문제를 입력해 주세요.");
          return;
        }
        var related = buildRelatedProblem(preset, note);
        var anonCb = formNew.querySelector("[name=qa_anonymous]");
        var wantAnon = user.role === "student" && anonCb && anonCb.checked;
        var threads = loadQaThreads();
        var u = getQaUser();
        threads.unshift({
          id: "t-" + uid(),
          title: title,
          className: "바이브 코딩 실전반 A",
          relatedProblem: related || undefined,
          messages: [
            {
              id: "m-" + uid(),
              role: u.role,
              anonymous: !!(wantAnon && u.role === "student"),
              body: body,
              at: new Date().toISOString(),
            },
          ],
        });
        saveQaThreads(threads);
        
        // Send notification to teacher if student replies
        if (user.role === "student") {
          var teacherMessage = {
            id: "msg-" + uid(),
            sender: getQaUser().id,
            recipient: "teacher",
            subject: "Q&A 답변 알림",
            body: `학생 ${getQaUser().id}이(가) "${title}" 질문에 답변을 달았습니다.`,
            timestamp: new Date().toISOString(),
            read: false
          };
          
          var messages = loadMessages();
          messages.unshift(teacherMessage);
          saveMessages(messages);
          updateMessageBadge();
        }
        if (titleIn) titleIn.value = "";
        if (bodyIn) bodyIn.value = "";
        if (anonCb) anonCb.checked = false;
        var noteIn = formNew.querySelector("[name=qa_related_note]");
        if (noteIn) noteIn.value = "";
        var rel = formNew.querySelector("[name=qa_related]");
        if (rel) rel.value = "none";
        if (relatedNoteRow) relatedNoteRow.hidden = true;
        showList();
      });
    }

    if (formReply) {
      formReply.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!currentThreadId) return;
        var bodyIn = formReply.querySelector("[name=qa_reply]");
        var body = bodyIn && bodyIn.value ? bodyIn.value.trim() : "";
        if (!body) return;
        var threads = loadQaThreads();
        var t = threads.filter(function (x) {
          return x.id === currentThreadId;
        })[0];
        if (!t) return;
        var u = getQaUser();
        var anonRep = formReply.querySelector("[name=qa_reply_anonymous]");
        var wantAnon = u.role === "student" && anonRep && anonRep.checked;
        t.messages = t.messages || [];
        t.messages.push({
          id: "m-" + uid(),
          role: u.role,
          anonymous: !!(wantAnon && u.role === "student"),
          body: body,
          at: new Date().toISOString(),
        });
        saveQaThreads(threads);
        if (bodyIn) bodyIn.value = "";
        if (anonRep) anonRep.checked = false;
        renderMessages(t);
      });
    }

    showList();
  }

  /* ---------- 쪽지함 메시지 목록 표시 ---------- */
  function renderMessageList() {
    var messages = loadMessages();
    var messageListEl = document.querySelector("[data-notes-list]");
    if (!messageListEl) return;
    
    messageListEl.innerHTML = "";
    
    // Group messages by date
    var groupedMessages = {};
    messages.forEach(function(msg) {
      var date = new Date(msg.timestamp).toLocaleDateString('ko-KR');
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].push(msg);
    });
    
    // Render messages
    Object.keys(groupedMessages).sort().reverse().forEach(function(date) {
      var dateGroup = document.createElement("div");
      dateGroup.className = "message-date-group";
      
      var dateHeader = document.createElement("div");
      dateHeader.className = "message-date-header";
      dateHeader.textContent = date;
      dateGroup.appendChild(dateHeader);
      
      groupedMessages[date].forEach(function(msg) {
        var messageEl = document.createElement("div");
        messageEl.className = "message-item";
        
        var senderInfo = document.createElement("div");
        senderInfo.className = "message-sender";
        senderInfo.innerHTML = `
          <span class="message-sender-name">${msg.sender === getQaUser().id ? '나' : '강사'}</span>
          <span class="message-time">${formatTime(msg.timestamp)}</span>
        `;
        
        var contentEl = document.createElement("div");
        contentEl.className = "message-content";
        
        var subjectEl = document.createElement("div");
        subjectEl.className = "message-subject";
        subjectEl.textContent = msg.subject;
        
        var bodyEl = document.createElement("div");
        bodyEl.className = "message-body";
        bodyEl.textContent = msg.body;
        
        contentEl.appendChild(subjectEl);
        contentEl.appendChild(bodyEl);
        
        messageEl.appendChild(senderInfo);
        messageEl.appendChild(contentEl);
        dateGroup.appendChild(messageEl);
      });
      
      messageListEl.appendChild(dateGroup);
    });
  }

  /* ---------- 쪽지함: 개인 메시지(localStorage) ---------- */
  function loadNotes() {
    try {
      var raw = localStorage.getItem(NOTES_STORAGE_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    return [];
  }

  function saveNotes(arr) {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function initNotesMailbox() {
    var root = document.querySelector("[data-notes-root]");
    if (!root) return;

    var listEl = root.querySelector("[data-notes-list]");
    var form = root.querySelector("[data-notes-compose]");
    var user = getQaUser();
    var homeHref = user.role === "teacher" ? "teacher.html" : "index.html";
    root.querySelectorAll("[data-notes-back-home]").forEach(function (a) {
      a.setAttribute("href", homeHref);
    });

    var anonRow = root.querySelector("[data-notes-anon-row]");
    if (anonRow) anonRow.hidden = user.role !== "student";

    function partnerLabel() {
      return user.role === "teacher" ? "학생(수강생)" : "담당 강사·교무";
    }

    function renderNotes() {
      if (!listEl) return;
      var all = loadNotes();
      var filtered = all.filter(function (n) {
        if (user.role === "student") {
          return n.fromRole === "student" || (n.fromRole === "teacher" && n.audience === "student");
        }
        return n.fromRole === "teacher" || (n.fromRole === "student" && n.audience === "staff");
      });
      filtered.sort(function (a, b) {
        return new Date(a.at) - new Date(b.at);
      });
      listEl.innerHTML = "";
      if (!filtered.length) {
        var empty = document.createElement("p");
        empty.className = "page-sub";
        empty.style.margin = "0";
        empty.textContent = "아직 쪽지가 없습니다. 아래에서 첫 쪽지를 보내 보세요.";
        listEl.appendChild(empty);
        return;
      }
      filtered.forEach(function (n) {
        var row = document.createElement("article");
        row.className = "notes-msg card-reveal";
        if (n.fromRole === user.role) row.classList.add("notes-msg--mine");
        var head = document.createElement("div");
        head.className = "notes-msg-head";
        var badge = document.createElement("span");
        var isAnon = n.anonymous && n.fromRole === "student";
        badge.className = "role-badge " + (isAnon ? "role-badge--anon" : n.fromRole === "teacher" ? "role-badge--teacher" : "role-badge--student");
        badge.textContent = isAnon ? "익명" : n.fromRole === "teacher" ? "강사" : "학생";
        var to = document.createElement("span");
        to.className = "notes-msg-to";
        to.textContent = "→ " + n.toLabel;
        var tm = document.createElement("time");
        tm.className = "notes-msg-time";
        tm.textContent = new Date(n.at).toLocaleString("ko-KR");
        head.appendChild(badge);
        head.appendChild(to);
        head.appendChild(tm);
        var body = document.createElement("p");
        body.className = "notes-msg-body";
        body.textContent = n.body;
        row.appendChild(head);
        row.appendChild(body);
        listEl.appendChild(row);
      });
      listEl.scrollTop = listEl.scrollHeight;
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var toSel = form.querySelector("[name=notes_to]");
        var bodyIn = form.querySelector("[name=notes_body]");
        var body = bodyIn && bodyIn.value ? bodyIn.value.trim() : "";
        if (!body) return;
        var toLabel = (toSel && toSel.options[toSel.selectedIndex] && toSel.options[toSel.selectedIndex].text) || partnerLabel();
        var audience = user.role === "student" ? "staff" : "student";
        var anonCb = form.querySelector("[name=notes_anonymous]");
        var all = loadNotes();
        all.push({
          id: "n-" + uid(),
          at: new Date().toISOString(),
          fromRole: user.role,
          anonymous: user.role === "student" && anonCb && anonCb.checked,
          toLabel: toLabel,
          audience: audience,
          body: body,
        });
        saveNotes(all);
        if (bodyIn) bodyIn.value = "";
        if (anonCb) anonCb.checked = false;
        renderNotes();
      });
    }

    renderNotes();
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

  /* ---------- 과제 제출 기능 ---------- */
  function initAssignmentSubmission() {
    var submitBtn = document.querySelector("[data-assignment-submit]");
    if (!submitBtn) return;

    submitBtn.addEventListener("click", function () {
      var wizard = submitBtn.closest("[data-flow-wizard]");
      if (!wizard) return;

      var selectedDateEl = wizard.querySelector("[data-selected-date]");
      var selectedQEl = wizard.querySelector("[data-selected-q]");
      var answerTextarea = wizard.querySelector("#ans");

      var selectedDate = selectedDateEl ? selectedDateEl.textContent : "";
      var selectedQ = selectedQEl ? selectedQEl.textContent : "";
      var answer = answerTextarea ? answerTextarea.value.trim() : "";

      if (!selectedDate || selectedDate === "—") {
        alert("날짜를 선택해주세요.");
        return;
      }

      if (!selectedQ || selectedQ === "—") {
        alert("문항을 선택해주세요.");
        return;
      }

      if (!answer) {
        alert("답안을 입력해주세요.");
        return;
      }

      // 제출 데이터 저장 (localStorage 사용)
      try {
        var submissions = JSON.parse(localStorage.getItem("lb_assignments") || "[]");
        submissions.push({
          id: "assign-" + Date.now().toString(36),
          date: selectedDate,
          question: selectedQ,
          answer: answer,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem("lb_assignments", JSON.stringify(submissions));
      } catch (e) {
        console.error("Failed to save submission:", e);
      }

      // 제출 완료 피드백
      alert("답안이 제출되었습니다!\n\n날짜: " + selectedDate + "\n문항: " + selectedQ + "\n답안: " + answer.substring(0, 50) + (answer.length > 50 ? "..." : ""));

      // 폼 초기화 및 첫 화면으로 이동
      if (answerTextarea) answerTextarea.value = "";
      
      // 첫 화면으로 돌아가기
      var panels = wizard.querySelectorAll("[data-flow-step]");
      var dots = wizard.querySelectorAll("[data-flow-dot]");
      
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-flow-step") === "1");
      });
      
      dots.forEach(function (d, i) {
        var stepNum = i + 1;
        d.classList.toggle("is-active", stepNum === 1);
        d.classList.toggle("is-done", false);
      });

      // 선택된 날짜/문항 초기화
      if (selectedDateEl) selectedDateEl.textContent = "—";
      if (selectedQEl) selectedQEl.textContent = "—";
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
    initLoginRolePersistence();
    initQAForum();
    initNotesMailbox();
    initCardReveal();
    initProgressBars();
    initCourseFilter();
    renderMaterialDetail();
    initFlowWizard();
    initModals();
    initAssignmentSubmission();
    initAttendanceDemo();
    initNoticeList();
    initMaterialsWeekView();
  });
})();
