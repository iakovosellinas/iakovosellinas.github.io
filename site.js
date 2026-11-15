/* Iakovos Ellinas · site scripts
   menu, theme, active section, ways-of-working tabs, evidence explorer,
   article filter, contact form, photo fallback, print, reveal on scroll.
   Everything is progressive: without JavaScript all content stays visible. */

/* Mobile navigation menu */
(function () {
  var toggle = document.querySelector(".menu-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.setAttribute("type", "button");

  function setOpen(open) {
    links.classList.toggle("open", open);
    toggle.classList.toggle("active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  toggle.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!links.classList.contains("open"));
  };

  var items = links.querySelectorAll("a");
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener("click", function () { setOpen(false); });
  }

  document.addEventListener("click", function (e) {
    if (!links.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("open")) { setOpen(false); toggle.focus(); }
  });
})();

/* Light / dark mode toggle (choice is remembered on this device) */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  var meta = document.querySelector('meta[name="theme-color"]');
  function apply(t) {
    root.setAttribute("data-theme", t);
    if (btn) {
      btn.setAttribute("aria-label", t === "dark" ? (btn.getAttribute("data-label-light") || "Switch to light mode") : (btn.getAttribute("data-label-dark") || "Switch to dark mode"));
      btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
    }
    if (meta) meta.setAttribute("content", t === "dark" ? "#0e141b" : "#ffffff");
  }
  apply(root.getAttribute("data-theme") || "light");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
})();

/* Highlight the menu item of the section on screen */
(function () {
  if (!("IntersectionObserver" in window)) return;
  var links = document.querySelectorAll('.nav-links a[href^="#"]');
  var map = {};
  for (var i = 0; i < links.length; i++) map[links[i].getAttribute("href").slice(1)] = links[i];
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      for (var k in map) { map[k].classList.remove("is-active"); map[k].removeAttribute("aria-current"); }
      if (map[en.target.id]) { map[en.target.id].classList.add("is-active"); map[en.target.id].setAttribute("aria-current", "true"); }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach(function (sec) { obs.observe(sec); });
})();

/* Small helper: arrow-key movement inside a set of tabs */
function ieTabKeys(tabs, select) {
  tabs.forEach(function (tab, i) {
    tab.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight" || k === "ArrowDown") n = (i + 1) % tabs.length;
      else if (k === "ArrowLeft" || k === "ArrowUp") n = (i - 1 + tabs.length) % tabs.length;
      else if (k === "Home") n = 0;
      else if (k === "End") n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      select(n);
      tabs[n].focus();
    });
  });
}

/* Ways of working: the three cards become tabs */
(function () {
  var box = document.querySelector(".modes");
  if (!box) return;
  var modes = Array.prototype.slice.call(box.querySelectorAll(".mode"));
  if (modes.length < 2) return;
  var bar = document.createElement("div");
  bar.className = "mode-tabs";
  bar.setAttribute("role", "tablist");
  bar.setAttribute("aria-label", box.getAttribute("data-label") || "Ways I work");
  var tabs = [];
  modes.forEach(function (mode, i) {
    var label = (mode.querySelector(".mode-num") || {}).textContent || "";
    var parts = label.split("/");
    var num = parts.length > 1 ? parts[0].trim() : "0" + (i + 1);
    var name = parts.length > 1 ? parts.slice(1).join("/").trim() : label.trim();
    var tab = document.createElement("button");
    tab.type = "button";
    tab.className = "mode-tab";
    tab.id = "mode-tab-" + i;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "mode-panel-" + i);
    var small = document.createElement("small");
    small.textContent = num;
    tab.appendChild(small);
    tab.appendChild(document.createTextNode(name));
    tab.addEventListener("click", function () { select(i); });
    bar.appendChild(tab);
    tabs.push(tab);
    mode.id = "mode-panel-" + i;
    mode.setAttribute("role", "tabpanel");
    mode.setAttribute("aria-labelledby", tab.id);
    mode.setAttribute("tabindex", "0");
  });
  function select(n) {
    tabs.forEach(function (t, i) {
      var on = i === n;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.setAttribute("tabindex", on ? "0" : "-1");
      modes[i].hidden = !on;
    });
  }
  box.parentNode.insertBefore(bar, box);
  box.classList.add("is-tabs");
  select(0);
  ieTabKeys(tabs, select);
})();

/* Evidence map: the table becomes an explorer (the table stays for print and no-JS) */
(function () {
  var wrap = document.querySelector(".ev-wrap");
  var table = wrap && wrap.querySelector(".ev-table");
  if (!table) return;
  var heads = Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
  var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
  if (!rows.length) return;

  var ex = document.createElement("div");
  ex.className = "ev-explorer";
  var caps = document.createElement("div");
  caps.className = "ev-caps";
  caps.setAttribute("role", "tablist");
  caps.setAttribute("aria-orientation", "vertical");
  caps.setAttribute("aria-label", wrap.getAttribute("data-pick") || "Choose a capability");
  var detail = document.createElement("div");
  detail.className = "ev-detail";
  detail.id = "ev-detail";
  detail.setAttribute("role", "tabpanel");
  detail.setAttribute("tabindex", "0");
  ex.appendChild(caps);
  ex.appendChild(detail);

  var tabs = [];
  rows.forEach(function (row, i) {
    var name = row.querySelector("th").textContent.trim();
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ev-cap";
    b.id = "ev-cap-" + i;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "ev-detail");
    b.textContent = name;
    b.addEventListener("click", function () { select(i); });
    caps.appendChild(b);
    tabs.push(b);
  });

  function select(n) {
    tabs.forEach(function (t, i) {
      var on = i === n;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.setAttribute("tabindex", on ? "0" : "-1");
    });
    detail.setAttribute("aria-labelledby", tabs[n].id);
    var row = rows[n];
    var cells = row.querySelectorAll("td");
    while (detail.firstChild) detail.removeChild(detail.firstChild);
    var h = document.createElement("h4");
    h.textContent = row.querySelector("th").textContent.trim();
    var count = document.createElement("small");
    count.textContent = (n + 1) + " / " + rows.length;
    h.appendChild(count);
    detail.appendChild(h);
    var dl = document.createElement("dl");
    dl.className = "ev-list";
    Array.prototype.forEach.call(cells, function (td, i) {
      var r = document.createElement("div");
      r.className = "ev-row";
      var dt = document.createElement("dt");
      dt.textContent = heads[i + 1] || td.getAttribute("data-label") || "";
      var dd = document.createElement("dd");
      for (var c = td.firstChild; c; c = c.nextSibling) dd.appendChild(c.cloneNode(true));
      if (td.querySelector(".ev-none") && td.textContent.trim().length <= 2) dd.className = "is-none";
      r.appendChild(dt);
      r.appendChild(dd);
      dl.appendChild(r);
    });
    detail.appendChild(dl);
    detail.classList.remove("is-new");
    void detail.offsetWidth;
    detail.classList.add("is-new");
  }

  wrap.parentNode.insertBefore(ex, wrap);
  var sec = wrap.closest ? wrap.closest("section") : null;
  if (sec) sec.classList.add("has-explorer");
  select(0);
  ieTabKeys(tabs, select);
})();

/* Insights: filter by series */
(function () {
  var bar = document.querySelector(".filters");
  if (!bar) return;
  var chips = Array.prototype.slice.call(bar.querySelectorAll(".chip"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".insight[data-series]"));
  if (!chips.length || !cards.length) return;
  chips.forEach(function (chip) {
    var f = chip.getAttribute("data-filter");
    var n = f === "all" ? cards.length : cards.filter(function (c) { return c.getAttribute("data-series") === f; }).length;
    var s = document.createElement("span");
    s.className = "count";
    s.textContent = n;
    chip.appendChild(s);
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      cards.forEach(function (card) { card.hidden = !(f === "all" || card.getAttribute("data-series") === f); });
    });
  });
  bar.hidden = false;
})();

/* Contact form.
   WEB3FORMS_KEY empty -> opens the visitor's email app with the message filled in.
   WEB3FORMS_KEY set   -> sends in the background through Web3Forms, which forwards
                          the message by email and does not store it.
   The access key is public by design (it only allows sending messages to this inbox). */
(function () {
  var WEB3FORMS_KEY = "2ed1af08-d757-439b-9e41-752e39e2eb71";
  var TO = "iakovosellinas01@gmail.com";
  var form = document.getElementById("contact-form");
  if (!form) return;
  var status = form.querySelector(".form-status");
  var M = form.dataset;
  var note = form.querySelector(".w3f-note");
  if (WEB3FORMS_KEY && note) note.hidden = false;
  function say(msg, ok) { status.textContent = msg; status.className = "form-status " + (ok ? "ok" : "err"); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.website.value) return;                       /* bot filled the trap */
    var name = form.name.value.trim(), email = form.email.value.trim(), msg = form.message.value.trim();
    if (!name || !msg || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      say(M.msgInvalid || "Please add your name, a valid email and a message.", false); return;
    }
    var company = form.company.value.trim();
    var subject = (M.msgSubject || "Website contact: ") + name;
    if (!WEB3FORMS_KEY) {
      var body = msg + "\n\n" + name + (company ? ", " + company : "") + "\n" + email;
      window.location.href = "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      say(M.msgMailto || "Your email app should open with the message ready to send.", true);
      return;
    }
    var btn = form.querySelector("button[type=submit]"); btn.disabled = true;
    var data = { access_key: WEB3FORMS_KEY, subject: subject, from_name: name, name: name, email: email,
                 company: company, message: msg, page: location.pathname, botcheck: "" };
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.success) throw 0; form.reset(); say(M.msgSent || "Thank you, your message has been sent. I will reply soon.", true); })
      .catch(function () { say(M.msgError || "Something went wrong. Please try again or reach me on LinkedIn.", false); })
      .then(function () { btn.disabled = false; });
  });
})();

/* Profile photo: show the "IE" initials if profile.jpg is missing */
(function () {
  var img = document.querySelector("img.avatar");
  if (!img) return;
  function fallback() {
    img.style.display = "none";
    var f = img.nextElementSibling;
    if (f) f.style.display = "flex";
  }
  if (img.complete && img.naturalWidth === 0) fallback();
  img.addEventListener("error", fallback);
})();

/* Print: open the research details so they appear on paper */
(function () {
  var opened = [];
  window.addEventListener("beforeprint", function () {
    opened = [];
    document.querySelectorAll("details:not([open])").forEach(function (d) { d.open = true; opened.push(d); });
  });
  window.addEventListener("afterprint", function () {
    opened.forEach(function (d) { d.open = false; });
  });
})();

/* Gentle reveal of content as it scrolls into view.
   Only content below the first screen is affected, and nothing moves
   for visitors who have turned off animations. */
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var items = document.querySelectorAll(".section h2, .mode-tabs, .modes, .pillar, .ev-explorer, .path, .tl-item, .case-card, .showcase, .record, .cert, .testimonial, .insight, .contact-form, .decision");
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.remove("reveal-wait"); obs.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  var vh = window.innerHeight;
  for (var i = 0; i < items.length; i++) {
    if (items[i].getBoundingClientRect().top > vh) { items[i].classList.add("reveal", "reveal-wait"); obs.observe(items[i]); }
  }
})();
