// Admin layer: applies saved text edits for everyone, and (after logging in)
// lets Vinn edit text directly on the page and save it.
(function () {
  "use strict";

  var API = "/api";
  var SELECTOR = "main h1, main h2, main h3, main p, main li, main figcaption, main .card-info";
  var INLINE = { A: 1, B: 1, STRONG: 1, EM: 1, I: 1, BR: 1, CODE: 1, SUB: 1, SUP: 1 };
  var page = location.pathname.replace(/index\.html$/, "") || "/";
  var base = (document.currentScript && document.currentScript.src) || "";
  var cssHref = base.replace(/js\/admin\.js.*$/, "css/admin.css");

  // ---------- helpers ----------
  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  function api(path, opts) {
    opts = opts || {};
    return fetch(API + path, {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: opts.body ? { "content-type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
    }).catch(function () { return { ok: false, status: 0, data: {} }; });
  }

  // Keep only simple inline formatting; everything else becomes plain text.
  function sanitize(html) {
    var tpl = document.createElement("template");
    tpl.innerHTML = html;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) return;
        if (child.nodeType !== 1 || !INLINE[child.tagName]) {
          if (child.nodeType === 1) {
            walk(child);
            while (child.firstChild) node.insertBefore(child.firstChild, child);
          }
          node.removeChild(child);
          return;
        }
        Array.prototype.slice.call(child.attributes).forEach(function (a) {
          var keep = child.tagName === "A" && a.name === "href" && /^(https?:|mailto:|\/|\.{0,2}\/|#)/i.test(a.value);
          if (!keep) child.removeAttribute(a.name);
        });
        if (child.tagName === "A" && child.getAttribute("href") && /^https?:/i.test(child.getAttribute("href"))) {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener");
        }
        walk(child);
      });
    })(tpl.content);
    return tpl.innerHTML;
  }

  // Elements whose content is only text + simple inline tags can be edited.
  function candidates() {
    var all = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
    return all.filter(function (el) {
      var kids = el.querySelectorAll("*");
      for (var i = 0; i < kids.length; i++) if (!INLINE[kids[i].tagName]) return false;
      return norm(el.textContent).length > 0;
    });
  }

  var els = [];
  var original = {}; // index -> html as it was on load (after saved edits applied)
  var saved = {};

  function applyEdits(edits) {
    saved = edits || {};
    Object.keys(saved).forEach(function (i) {
      var el = els[Number(i)], e = saved[i];
      if (!el || !e || typeof e.h !== "string") return;
      // Only apply if the element is still the one that was edited.
      if (norm(el.textContent).indexOf(norm(e.o)) !== 0) return;
      el.innerHTML = sanitize(e.h);
    });
  }

  // Remember the pristine text so a saved edit knows which element it belongs to.
  var pristine = [];
  function init() {
    els = candidates();
    pristine = els.map(function (el) { return norm(el.textContent).slice(0, 40); });
    fetch(API + "/edits?page=" + encodeURIComponent(page))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (edits) { applyEdits(edits); })
      .catch(function () {})
      .then(function () {
        els.forEach(function (el, i) { original[i] = el.innerHTML; });
        loadUI();
      });
  }

  // ---------- UI ----------
  var bar, editing = false;

  function loadUI() {
    api("/me").then(function (res) {
      if (res.ok && res.data.admin) mountBar(true); else mountLock();
    });
  }

  function addCss() {
    if (document.getElementById("admin-css")) return;
    var l = document.createElement("link");
    l.id = "admin-css"; l.rel = "stylesheet"; l.href = cssHref;
    document.head.appendChild(l);
  }

  function notesHref() { return cssHref.replace(/css\/admin\.css.*$/, "notes.html"); }

  function mountLock() {
    addCss();
    var b = document.createElement("button");
    if (document.querySelector(".navbar")) document.documentElement.classList.add("ad-has-nav");
    b.className = "ad-lock"; b.type = "button"; b.setAttribute("aria-label", "Owner login");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    b.addEventListener("click", showLogin);
    document.body.appendChild(b);
  }

  function showLogin() {
    var wrap = document.createElement("div");
    wrap.className = "ad-modal";
    wrap.innerHTML =
      '<form class="ad-box"><h2>Owner login</h2><input type="password" placeholder="Password" autocomplete="current-password" required />' +
      '<p class="ad-err" role="alert"></p><div class="ad-row"><button type="button" class="ad-btn ad-ghost">Cancel</button><button class="ad-btn">Log in</button></div></form>';
    document.body.appendChild(wrap);
    var form = wrap.querySelector("form"), input = form.querySelector("input"), err = form.querySelector(".ad-err");
    input.focus();
    wrap.addEventListener("click", function (e) { if (e.target === wrap) wrap.remove(); });
    form.querySelector(".ad-ghost").addEventListener("click", function () { wrap.remove(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.textContent = "";
      api("/login", { method: "POST", body: { password: input.value } }).then(function (res) {
        if (res.ok) location.reload(); else err.textContent = res.data.error || "Login failed";
      });
    });
  }

  function mountBar() {
    addCss();
    document.querySelectorAll(".ad-lock").forEach(function (n) { n.remove(); });
    bar = document.createElement("div");
    bar.className = "ad-bar";
    bar.innerHTML =
      '<span class="ad-status"></span>' +
      '<button type="button" class="ad-btn" data-a="edit">Edit text</button>' +
      '<button type="button" class="ad-btn ad-go" data-a="save" hidden>Save</button>' +
      '<button type="button" class="ad-btn ad-ghost" data-a="cancel" hidden>Cancel</button>' +
      '<button type="button" class="ad-btn ad-ghost" data-a="reset" hidden>Reset page</button>' +
      '<a class="ad-btn ad-ghost" href="' + notesHref() + '" data-a="notes">Notes</a>' +
      '<button type="button" class="ad-btn ad-ghost" data-a="out">Log out</button>';
    document.body.appendChild(bar);
    bar.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a");
      if (a === "edit") startEdit();
      else if (a === "save") save();
      else if (a === "cancel") stopEdit(true);
      else if (a === "reset") resetPage();
      else if (a === "out") api("/logout", { method: "POST" }).then(function () { location.reload(); });
    });
  }

  function setStatus(msg) { if (bar) bar.querySelector(".ad-status").textContent = msg || ""; }

  function toggleButtons() {
    bar.querySelector('[data-a="edit"]').hidden = editing;
    ["save", "cancel", "reset"].forEach(function (k) { bar.querySelector('[data-a="' + k + '"]').hidden = !editing; });
    bar.querySelector('[data-a="notes"]').hidden = editing;
    bar.querySelector('[data-a="out"]').hidden = editing;
  }

  function blockLinks(e) { if (editing && e.target.closest && e.target.closest("main a")) e.preventDefault(); }

  function onKey(e) {
    if (e.key !== "Enter") return;
    var el = e.target;
    if (!el.isContentEditable) return;
    e.preventDefault();
    if (el.tagName === "P") document.execCommand("insertLineBreak");
  }

  function onPaste(e) {
    if (!e.target.isContentEditable) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  function startEdit() {
    editing = true;
    document.documentElement.classList.add("ad-editing");
    els.forEach(function (el) { el.contentEditable = "true"; el.spellcheck = true; });
    document.addEventListener("click", blockLinks, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("paste", onPaste, true);
    toggleButtons();
    setStatus("Click text to edit. Cmd/Ctrl+B bold, +K link.");
  }

  function stopEdit(revert) {
    editing = false;
    document.documentElement.classList.remove("ad-editing");
    els.forEach(function (el, i) {
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      if (revert) el.innerHTML = original[i];
    });
    document.removeEventListener("click", blockLinks, true);
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("paste", onPaste, true);
    toggleButtons();
  }

  document.addEventListener("keydown", function (e) {
    if (!editing || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
    e.preventDefault();
    var url = prompt("Link URL (leave empty to remove the link):", "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") document.execCommand("unlink");
    else document.execCommand("createLink", false, url.trim());
  });

  function save() {
    var changes = {};
    els.forEach(function (el, i) {
      var html = sanitize(el.innerHTML);
      if (html === sanitize(original[i])) return;
      changes[i] = { o: pristine[i], h: html };
    });
    if (!Object.keys(changes).length) { stopEdit(false); setStatus("Nothing changed."); return; }
    setStatus("Saving…");
    api("/edits", { method: "PUT", body: { page: page, edits: changes } }).then(function (res) {
      if (!res.ok) { setStatus(res.status === 401 ? "Session expired. Log in again." : "Save failed. Your edits are still on the page."); return; }
      els.forEach(function (el, i) { if (changes[i]) { el.innerHTML = changes[i].h; original[i] = changes[i].h; } });
      stopEdit(false);
      setStatus("Saved.");
      setTimeout(function () { setStatus(""); }, 2500);
    });
  }

  function resetPage() {
    if (!confirm("Remove all saved text edits on this page and go back to the original text?")) return;
    api("/edits", { method: "PUT", body: { page: page, edits: null } }).then(function (res) {
      if (res.ok) location.reload(); else setStatus("Reset failed.");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
