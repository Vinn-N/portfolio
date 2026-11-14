// Private class-notes index. Data lives behind the Worker login (/api/notes).
(function () {
  "use strict";
  var app = document.getElementById("app");
  var logoutLink = document.getElementById("logout");
  var data = { classes: [] };

  var KINDS = [["lecture", "Lectures"], ["notes", "Notes"], ["pset", "Problem sets"], ["other", "Other"]];
  // From the coursework page; offered once as a quick start.
  var SEED = [
    ["2.001", "Mechanics and Materials I"], ["2.002", "Mechanics and Materials II"], ["2.003", "Dynamics and Control I"],
    ["2.005", "Thermal-Fluids Engineering I"], ["2.006", "Thermal-Fluids Engineering II"], ["2.007", "Design and Manufacturing I"],
    ["2.008", "Design and Manufacturing II"], ["2.009", "Product Engineering Process"], ["2.086", "Numerical Computation"],
    ["2.650", "Intro to Sustainable Energy"], ["2.760", "Global Engineering: Green Machines"],
  ];

  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "text") n.textContent = props[k]; else if (k === "class") n.className = props[k]; else n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function api(path, method, body) {
    return fetch("/api" + path, {
      method: method || "GET", credentials: "same-origin",
      headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, data: d }; }); });
  }
  function byCode(a, b) { return a.code.localeCompare(b.code, undefined, { numeric: true }); }

  var openIds = {};
  function save() {
    return api("/notes", "PUT", data).then(function (r) { if (!r.ok) alert("Save failed. Log in again if your session expired."); });
  }

  function loginView(msg) {
    logoutLink.hidden = true;
    var pw = el("input", { type: "password", placeholder: "Password", autocomplete: "current-password", required: "" });
    var err = el("p", { class: "ow-err", text: msg || "" });
    var form = el("form", { class: "nt-login" }, [pw, err, el("button", { class: "ow-btn", text: "Unlock" })]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      api("/login", "POST", { password: pw.value }).then(function (r) {
        if (r.ok) load(); else err.textContent = r.data.error || "Login failed";
      });
    });
    app.replaceChildren(form);
    pw.focus();
  }

  function render() {
    logoutLink.hidden = false;
    var frag = document.createDocumentFragment();
    var classes = data.classes.slice().sort(byCode);

    if (!classes.length) {
      var seed = el("button", { class: "ow-btn", type: "button", text: "Start with my 2.xxx classes" });
      seed.addEventListener("click", function () {
        data.classes = SEED.map(function (s) { return { id: uid(), code: s[0], name: s[1], items: [] }; });
        save().then(render);
      });
      frag.appendChild(el("p", { class: "nt-empty", text: "No classes yet. Add one below, or start from the list on your coursework page." }));
      frag.appendChild(seed);
    }

    classes.forEach(function (c) { frag.appendChild(classView(c)); });
    frag.appendChild(addClassView());
    app.replaceChildren(frag);
  }

  function classView(c) {
    var d = el("details", { class: "nt-class" });
    if (openIds[c.id]) d.open = true;
    d.addEventListener("toggle", function () { openIds[c.id] = d.open; });
    d.appendChild(el("summary", {}, [
      el("span", { class: "nt-code", text: c.code }), el("span", { class: "nt-name", text: c.name }),
      el("span", { class: "nt-count", text: c.items.length + (c.items.length === 1 ? " item" : " items") }),
    ]));

    var body = el("div", { class: "nt-body" });
    KINDS.forEach(function (k) {
      var items = c.items.filter(function (it) { return it.kind === k[0]; });
      if (!items.length) return;
      body.appendChild(el("div", { class: "nt-kind", text: k[1] }));
      items.forEach(function (it) {
        var x = el("button", { class: "nt-x", type: "button", "aria-label": "Remove " + it.title, text: "×" });
        x.addEventListener("click", function () {
          if (!confirm("Remove “" + it.title + "” from this list? (The file itself stays where it is.)")) return;
          c.items = c.items.filter(function (i) { return i.id !== it.id; });
          save().then(render);
        });
        body.appendChild(el("div", { class: "nt-item" }, [el("a", { href: it.url, target: "_blank", rel: "noopener", text: it.title }), x]));
      });
    });

    var title = el("input", { placeholder: "Title, e.g. Lecture 5: Beam bending", required: "", class: "full" });
    var url = el("input", { type: "url", placeholder: "Link (Google Drive, Dropbox, ...)", required: "", class: "full" });
    var kind = el("select", {}, KINDS.map(function (k) { return el("option", { value: k[0], text: k[1] }); }));
    var form = el("form", { class: "ow-form" }, [title, url, kind, el("button", { class: "ow-btn", text: "Add" })]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      c.items.push({ id: uid(), title: title.value.trim(), url: url.value.trim(), kind: kind.value });
      openIds[c.id] = true;
      save().then(render);
    });
    body.appendChild(form);

    var del = el("button", { class: "ow-btn ow-ghost", type: "button", text: "Delete class", style: "margin-top:12px" });
    del.addEventListener("click", function () {
      if (!confirm("Delete " + c.code + " and its list of links?")) return;
      data.classes = data.classes.filter(function (x) { return x.id !== c.id; });
      save().then(render);
    });
    body.appendChild(del);
    d.appendChild(body);
    return d;
  }

  function addClassView() {
    var code = el("input", { placeholder: "Course number, e.g. 2.004", required: "" });
    var name = el("input", { placeholder: "Class name", required: "" });
    var form = el("form", { class: "ow-form" }, [code, name, el("button", { class: "ow-btn", text: "Add class" })]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var id = uid();
      data.classes.push({ id: id, code: code.value.trim(), name: name.value.trim(), items: [] });
      openIds[id] = true;
      save().then(render);
    });
    return el("details", { class: "nt-add-class" }, [el("summary", { text: "+ Add a class" }), form]);
  }

  function load() {
    api("/notes").then(function (r) {
      if (r.status === 401) return loginView();
      if (!r.ok) return app.replaceChildren(el("p", { class: "ow-err", text: "Could not load. Is the site's backend deployed?" }));
      data = r.data && Array.isArray(r.data.classes) ? r.data : { classes: [] };
      render();
    });
  }

  logoutLink.addEventListener("click", function (e) {
    e.preventDefault();
    api("/logout", "POST").then(function () { loginView(); });
  });
  load();
})();
