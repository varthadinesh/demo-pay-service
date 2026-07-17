/* OntmPay — shared behaviour
   Note: this demo intentionally avoids localStorage/sessionStorage and
   carries the demo "logged in" role via URL query params instead, so the
   whole flow works identically whether opened as a plain file or hosted. */

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
  if (!toggle || !links) return;
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

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  // Populate any role-aware placeholders present on the page.
  document.querySelectorAll("[data-role-label]").forEach((el) => {
    el.textContent = ROLES[currentRole()].label;
  });
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    el.textContent = currentName();
  });
  document.querySelectorAll("[data-wallet-balance]").forEach((el) => {
    el.textContent = fmtINR(ROLES[currentRole()].wallet);
  });
  // Rewrite internal dashboard links to preserve the demo role/name.
  document.querySelectorAll("a[data-preserve-role]").forEach((a) => {
    a.setAttribute("href", withRole(a.getAttribute("href")));
  });
  // If a role is already present in the URL (came from the dashboard),
  // swap any "Partner Login" button for a "My Dashboard" link instead of
  // showing a logged-out state on public/service pages.
  if (qs("role")) {
    document.querySelectorAll("a[data-login-link]").forEach((a) => {
      a.textContent = "My Dashboard";
      a.classList.remove("btn-outline");
      a.classList.add("btn-primary");
      a.setAttribute("href", withRole(a.dataset.loginLink));
    });
  }
});