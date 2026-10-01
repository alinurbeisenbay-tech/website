// ================== CONFIG ==================
// Paste your Google Apps Script Web App URL here (see google-apps-script.js).
// While empty, the form runs in demo mode: it validates and shows the success
// message, but nothing is saved.
const FORM_ENDPOINT = "";

// Speakers — replace placeholders with real data. `photo` is a path like
// "assets/speakers/jane.jpg"; leave it empty to show the speaker number instead.
const SPEAKERS = [
  { name: "Speaker One",   role: "Title, Company", topic: "Talk title coming soon", photo: "" },
  { name: "Speaker Two",   role: "Title, Company", topic: "Talk title coming soon", photo: "" },
  { name: "Speaker Three", role: "Title, Company", topic: "Talk title coming soon", photo: "" },
  { name: "Speaker Four",  role: "Title, Company", topic: "Talk title coming soon", photo: "" },
  { name: "Speaker Five",  role: "Title, Company", topic: "Talk title coming soon", photo: "" },
  { name: "Speaker Six",   role: "Title, Company", topic: "Talk title coming soon", photo: "" },
  { name: "Speaker Seven", role: "Title, Company", topic: "Talk title coming soon", photo: "" },
];

// ================== SPEAKERS ==================
function renderSpeakers() {
  const grid = document.getElementById("speaker-grid");
  grid.innerHTML = "";
  SPEAKERS.forEach((s, i) => {
    const card = document.createElement("article");
    card.className = "speaker";

    const photo = document.createElement("div");
    photo.className = "speaker-photo";
    if (s.photo) {
      const img = document.createElement("img");
      img.src = s.photo;
      img.alt = s.name;
      img.loading = "lazy";
      photo.appendChild(img);
    } else {
      photo.textContent = String(i + 1).padStart(2, "0") + ".";
    }

    const body = document.createElement("div");
    body.className = "speaker-body";
    const h3 = document.createElement("h3");
    h3.textContent = s.name;
    const role = document.createElement("p");
    role.className = "speaker-role";
    role.textContent = s.role;
    const topic = document.createElement("p");
    topic.className = "speaker-topic";
    topic.textContent = s.topic;
    body.append(h3, role, topic);

    card.append(photo, body);
    grid.appendChild(card);
  });
}

// ================== FORM ==================
const form = document.getElementById("register-form");
const statusEl = document.getElementById("form-status");
const successEl = document.getElementById("success");

function setError(field, message) {
  const wrap = form.querySelector(`#${field}`).closest(".field");
  wrap.classList.toggle("invalid", Boolean(message));
  form.querySelector(`.error[data-for="${field}"]`).textContent = message || "";
}

function validate() {
  const name = form.elements.name.value.trim();
  const digits = form.elements.phone.value.replace(/\D/g, "");
  const isOther = form.elements.country.value === "other";
  let ok = true;

  if (name.length < 2) { setError("name", "Please enter your name."); ok = false; }
  else setError("name", "");

  const min = isOther ? 8 : 6;
  if (digits.length < min || digits.length > 15) {
    setError("phone", isOther
      ? "Enter your full number with country code, e.g. +44 7700 900123."
      : "Please enter a valid WhatsApp number.");
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
  btn.textContent = "Sending…";

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
    statusEl.textContent = "Something went wrong. Please check your connection and try again.";
    btn.disabled = false;
    btn.textContent = "Register →";
  }
});

["name", "phone"].forEach((f) =>
  form.elements[f].addEventListener("input", () => setError(f, ""))
);

// ================== INIT ==================
renderSpeakers();
document.getElementById("year").textContent = new Date().getFullYear();
