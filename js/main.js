/* OnTmPay — shared behaviour
   Note: this demo intentionally avoids localStorage/sessionStorage and
   carries the demo "logged in" role via URL query params instead, so the
   whole flow works identically whether opened as a plain file or hosted.

   This file also loads the shared navbar/footer partials (partials/navbar.html
   and partials/footer.html) into any page that has <div id="site-navbar">
   and/or <div id="site-footer"> placeholders, so the nav and footer only
   need to be edited in one place. Requires the site to be served over
   http(s) from its own root — fetch() of local partials will not work if
   you just double-click an HTML file (file:// has no fetch access). */

const ROLES = {
  super: { label: "Super Distributor", short: "SD", floor: 0, wallet: 482300, network: 214 },
  distributor: { label: "Distributor", short: "DT", floor: 1, wallet: 96400, network: 38 },
  retailer: { label: "Retailer", short: "RT", floor: 2, wallet: 8250, network: 0 },
};

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function currentRole() {
  const r = qs("role");
  return ROLES[r] ? r : "retailer";
}

function currentName() {
  return qs("name") || "Demo User";
}

function withRole(href) {
  const role = currentRole();
  const name = encodeURIComponent(currentName());
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}role=${role}&name=${name}`;
}

function fmtINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links || toggle.dataset.bound) return;
  toggle.dataset.bound = "1";
  toggle.addEventListener("click", () => {
    links.style.display = links.style.display === "flex" ? "none" : "flex";
  });
}

function showToast(message, opts = {}) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 12.5l2.5 2.5L16 9"></path>
    </svg>
    <span>${message}</span>`;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), opts.duration || 3800);
}

/* ---------- shared navbar / footer loader ---------- */
function loadPartial(elementId, url) {
  const el = document.getElementById(elementId);
  if (!el) return Promise.resolve(false);
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(res.status + " " + res.statusText);
      return res.text();
    })
    .then((html) => {
      el.outerHTML = html;
      return true;
    })
    .catch((err) => {
      console.error("[OnTmPay] Could not load " + url + " — is this page being served over http(s)? " + err);
      el.innerHTML =
        '<div style="padding:10px;text-align:center;font-size:.78rem;color:#B4423A;background:#FBEAE8;">' +
        "Navigation failed to load. This page must be opened through a local web server " +
        "(e.g. <code>python -m http.server</code>), not double-clicked as a file." +
        "</div>";
      return false;
    });
}

function initDropdowns() {
  document.querySelectorAll(".nav-dropdown-trigger").forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const parent = btn.closest(".nav-dropdown");
      const willOpen = !parent.classList.contains("open");
      document.querySelectorAll(".nav-dropdown.open").forEach((d) => {
        d.classList.remove("open");
        d.querySelector(".nav-dropdown-trigger").setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        parent.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
  if (!document.body.dataset.dropdownOutsideBound) {
    document.body.dataset.dropdownOutsideBound = "1";
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-dropdown")) {
        document.querySelectorAll(".nav-dropdown.open").forEach((d) => {
          d.classList.remove("open");
          d.querySelector(".nav-dropdown-trigger").setAttribute("aria-expanded", "false");
        });
      }
    });
  }
}

/* ---------- per-page initialisation (safe to call more than once) ---------- */
function initPageChrome() {
  initNavToggle();
  initDropdowns();

  document.querySelectorAll("[data-role-label]").forEach((el) => {
    el.textContent = ROLES[currentRole()].label;
  });
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    el.textContent = currentName();
  });
  document.querySelectorAll("[data-wallet-balance]").forEach((el) => {
    el.textContent = fmtINR(ROLES[currentRole()].wallet);
  });
  document.querySelectorAll("a[data-preserve-role]").forEach((a) => {
    if (a.dataset.roleApplied) return;
    a.dataset.roleApplied = "1";
    a.setAttribute("href", withRole(a.getAttribute("href")));
  });
  if (qs("role")) {
    document.querySelectorAll("a[data-login-link]").forEach((a) => {
      a.textContent = "My Dashboard";
      a.classList.remove("btn-outline");
      a.classList.add("btn-primary");
      a.setAttribute("href", withRole(a.dataset.loginLink));
    });
  }

  // Highlight the current page's nav link — works whether the nav is
  // inline in the page or was just injected from partials/navbar.html.
  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll(".nav-links a[data-page]").forEach((a) => {
      a.classList.toggle("active", a.dataset.page === page);
    });
    const servicePages = ["bbps", "education", "insurance", "ferry"];
    document.querySelectorAll(".nav-dropdown-trigger").forEach((btn) => {
      btn.classList.toggle("active", servicePages.includes(page));
    });
  }
}

/* ---------- scroll-reveal animations ---------- */
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  targets.forEach((el) => io.observe(el));
}

/* ---------- animated count-up for stat numbers ---------- */
function initCountUp() {
  const targets = document.querySelectorAll("[data-count-to]");
  if (!targets.length) return;

  function animate(el) {
    const to = parseFloat(el.dataset.countTo);
    const decimals = parseInt(el.dataset.countDecimals || "0", 10);
    const prefix = el.dataset.countPrefix || "";
    const suffix = el.dataset.countSuffix || "";
    const duration = 1300;
    const start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const value = to * eased;
      el.textContent =
        prefix +
        value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
        suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (!("IntersectionObserver" in window)) {
    targets.forEach(animate);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  targets.forEach((el) => io.observe(el));
}

function initPromoBar() {
  const bar = document.getElementById("promo-bar");
  const closeBtn = document.getElementById("promo-close");
  if (!bar || !closeBtn || closeBtn.dataset.bound) return;
  closeBtn.dataset.bound = "1";
  closeBtn.addEventListener("click", () => bar.classList.add("hidden"));
}

document.addEventListener("DOMContentLoaded", () => {
  initPromoBar();
  // Run immediately for pages with inline chrome (dashboard, network),
  // and again once any injected navbar/footer partials finish loading.
  initPageChrome();
  Promise.all([
    loadPartial("site-navbar", "../navbar.html"),
    loadPartial("site-footer", "../footer.html"),
  ]).then(() => initPageChrome());

  initScrollReveal();
  initCountUp();
});