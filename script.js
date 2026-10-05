// ================== CONFIG ==================
// Google Apps Script Web App URL (see google-apps-script.js).
// While empty, the form runs in demo mode: it validates and shows the success
// message, but nothing is saved.
const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbzQGthuKJpBgVqFlQteFLN_ni_7z2AL9DIY1bq9GCntXicUSdwlOo-dyiwBqbma3sfk/exec";

// Texts and speakers live in texts.js.

// ================== LANGUAGE ==================
const LANGS = ["ru", "kz"];
const HTML_LANG = { ru: "ru", kz: "kk" };
let lang = pickLang();

// Russian by default; visitors switch to Kazakh with the РУС/ҚАЗ switch.
// ?lang=kz in the link opens the Kazakh version directly.
function pickLang() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  return LANGS.includes(fromUrl) ? fromUrl : "ru";
}

function t(key) {
  return TEXTS[lang][key] ?? TEXTS.ru[key] ?? "";
}

function applyLang(next) {
  lang = next;
  document.documentElement.lang = HTML_LANG[lang];
  document.title = t("pageTitle");

  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll(".lang-switch button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
  });

  // re-show any visible form errors in the new language
  ["name", "phone"].forEach((f) => { if (errors[f]) setError(f, errors[f]); });
  renderSpeakers();
}

document.querySelectorAll(".lang-switch button").forEach((b) =>
  b.addEventListener("click", () => applyLang(b.dataset.lang))
);

// ================== SPEAKERS ==================
// a field is either one text for all languages or { ru: "...", kz: "..." }
function pick(v) {
  return typeof v === "string" ? v : (v && v[lang]) || "";
}

function renderSpeakers() {
  const grid = document.getElementById("speaker-grid");
  grid.innerHTML = "";
  SPEAKERS.forEach((s, i) => {
    const name = s.name || `${t("speakerPlaceholderName")} ${i + 1}`;
    const card = document.createElement("article");
    card.className = "speaker";

    const photo = document.createElement("div");
    photo.className = "speaker-photo";
    if (s.photo) {
      const img = document.createElement("img");
      img.src = s.photo;
      img.alt = name;
      img.loading = "lazy";
      photo.appendChild(img);
    } else {
      photo.textContent = String(i + 1).padStart(2, "0");
    }

    const body = document.createElement("div");
    body.className = "speaker-body";
    const h3 = document.createElement("h3");
    h3.textContent = name;
    const role = document.createElement("p");
    role.className = "speaker-role";
    role.textContent = pick(s.role) || t("speakerPlaceholderRole");
    const topic = document.createElement("p");
    topic.className = "speaker-topic";
    topic.dataset.label = t("talkLabel");
    topic.textContent = pick(s.topic) || t("speakerPlaceholderTopic");
    body.append(h3, role, topic);

    card.append(photo, body);
    grid.appendChild(card);
  });
}

// ================== FORM ==================
const form = document.getElementById("register-form");
const statusEl = document.getElementById("form-status");
const successEl = document.getElementById("success");
const errors = { name: "", phone: "" }; // text keys, so errors follow the language

function setError(field, key) {
  errors[field] = key || "";
  const wrap = form.querySelector(`#${field}`).closest(".field");
  wrap.classList.toggle("invalid", Boolean(key));
  form.querySelector(`.error[data-for="${field}"]`).textContent = key ? t(key) : "";
}

function validate() {
  const name = form.elements.name.value.trim();
  const digits = form.elements.phone.value.replace(/\D/g, "");
  const isOther = form.elements.country.value === "other";
  let ok = true;

  if (name.length < 2) { setError("name", "errorName"); ok = false; }
  else setError("name", "");

  const min = isOther ? 8 : 6;
  if (digits.length < min || digits.length > 15) {
    setError("phone", isOther ? "errorPhoneOther" : "errorPhone");
    ok = false;
  } else setError("phone", "");

  return ok;
}

function fullPhone() {
  const raw = form.elements.phone.value.trim();
  if (form.elements.country.value === "other") return "+" + raw.replace(/\D/g, "");
  return form.elements.country.value + raw.replace(/\D/g, "").replace(/^0+/, "");
}

form.elements.country.addEventListener("change", () => {
  form.elements.phone.placeholder = form.elements.country.value === "other" ? "+44 7700 900123" : "5555 1234";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  if (!validate()) return;
  if (form.elements.website.value) return; // bot filled the honeypot

  const payload = {
    name: form.elements.name.value.trim(),
    phone: fullPhone(),
    consent: form.elements.consent.checked ? "yes" : "no",
    submittedAt: new Date().toISOString(),
  };

  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = t("sending");

  try {
    if (window.REGISTRATION_STORE) {
      // set by the hosting page (e.g. the claude.ai preview) to save elsewhere
      await window.REGISTRATION_STORE(payload);
    } else if (FORM_ENDPOINT) {
      // text/plain avoids a CORS preflight, which Apps Script doesn't handle.
      await fetch(FORM_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } else {
      console.warn("FORM_ENDPOINT is not set — registration not saved (demo mode).", payload);
    }
    form.hidden = true;
    successEl.hidden = false;
  } catch (err) {
    statusEl.textContent = t("errorNetwork");
    btn.disabled = false;
    btn.textContent = t("submit");
  }
});

["name", "phone"].forEach((f) =>
  form.elements[f].addEventListener("input", () => setError(f, ""))
);

// ================== COUNTDOWN ==================
// 16 Oct 2026, 18:00 Doha time (UTC+3). The fixed offset keeps the
// countdown right for visitors in any time zone.
const EVENT_START = new Date("2026-10-16T18:00:00+03:00");

function startCountdown() {
  const box = document.getElementById("countdown");
  const done = document.getElementById("countdown-done");
  const parts = ["days", "hours", "minutes", "seconds"].map((k) => document.getElementById("cd-" + k));
  let timer;

  function tick() {
    const left = EVENT_START - Date.now();
    if (left <= 0) {
      clearInterval(timer);
      box.hidden = true;
      done.hidden = false;
      return;
    }
    const s = Math.floor(left / 1000);
    const values = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    values.forEach((v, i) => { parts[i].textContent = String(v).padStart(2, "0"); });
  }

  tick();
  timer = setInterval(tick, 1000);
}

// ================== INIT ==================
applyLang(lang);
startCountdown();
document.getElementById("year").textContent = new Date().getFullYear();
