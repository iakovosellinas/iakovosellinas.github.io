/* Iakovos Ellinas · site scripts (menu, theme, active section, contact form, photo) */
  /* Mobile navigation menu (inline, so it never depends on a cached script.js) */
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
  })();
  /* Light / dark mode toggle (choice is remembered on this device) */
  (function () {
    var root = document.documentElement;
    var btn = document.querySelector(".theme-toggle");
    var meta = document.querySelector('meta[name="theme-color"]');
    function apply(t) {
      root.setAttribute("data-theme", t);
      if (btn) btn.setAttribute("aria-label", t === "dark" ? (btn.getAttribute("data-label-light") || "Switch to light mode") : (btn.getAttribute("data-label-dark") || "Switch to dark mode"));
      if (meta) meta.setAttribute("content", t === "dark" ? "#05080f" : "#06122b");
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
        for (var k in map) map[k].classList.remove("is-active");
        if (map[en.target.id]) map[en.target.id].classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (sec) { obs.observe(sec); });
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

  /* Gentle reveal of content as it scrolls into view.
     Only content below the first screen is affected, and nothing moves
     for visitors who have turned off animations. */
  (function () {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var items = document.querySelectorAll(".section h2, .mode, .pillar, .path, .tl-item, .showcase, .record, .cert, .testimonial, .insight, .contact-form, .research-card");
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
