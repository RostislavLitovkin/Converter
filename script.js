const hexInput = document.getElementById("hexInput");
const decodeBtn = document.getElementById("decodeBtn");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");
const autoFormat = document.getElementById("autoFormat");
const copyBtn = document.getElementById("copyBtn");
const themeToggle = document.getElementById("themeToggle");

const lucideIcons = {
  cpu: [
    '<rect width="16" height="16" x="4" y="4" rx="2" />',
    '<rect width="6" height="6" x="9" y="9" rx="1" />',
    '<path d="M9 1v3" />',
    '<path d="M15 1v3" />',
    '<path d="M9 20v3" />',
    '<path d="M15 20v3" />',
    '<path d="M1 9h3" />',
    '<path d="M1 15h3" />',
    '<path d="M20 9h3" />',
    '<path d="M20 15h3" />'
  ].join(''),
  sun: [
    '<circle cx="12" cy="12" r="4" />',
    '<path d="M12 2v2" />',
    '<path d="M12 20v2" />',
    '<path d="m4.93 4.93 1.41 1.41" />',
    '<path d="m17.66 17.66 1.41 1.41" />',
    '<path d="M2 12h2" />',
    '<path d="M20 12h2" />',
    '<path d="m6.34 17.66-1.41 1.41" />',
    '<path d="m19.07 4.93-1.41 1.41" />'
  ].join(''),
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
  "play-circle": [
    '<circle cx="12" cy="12" r="10" />',
    '<path d="m10 8 6 4-6 4Z" />'
  ].join(''),
  code: [
    '<path d="m16 18 6-6-6-6" />',
    '<path d="m8 6-6 6 6 6" />'
  ].join(''),
  copy: [
    '<rect width="14" height="14" x="8" y="8" rx="2" />',
    '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />'
  ].join(''),
  info: [
    '<circle cx="12" cy="12" r="10" />',
    '<path d="M12 16v-4" />',
    '<path d="M12 8h.01" />'
  ].join('')
};

function createLucideIcon(name) {
  const paths = lucideIcons[name];
  if (!paths) return null;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "1em");
  svg.setAttribute("height", "1em");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  const parsed = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${paths}</svg>`,
    "image/svg+xml"
  );
  const sourceSvg = parsed.documentElement;
  if (!sourceSvg || sourceSvg.nodeName.toLowerCase() === "parsererror") {
    return null;
  }
  Array.from(sourceSvg.childNodes).forEach((child) => {
    svg.appendChild(document.importNode(child, true));
  });
  return svg;
}

function replaceLucideSafe() {
  document.querySelectorAll("[data-lucide]").forEach((element) => {
    if (element.dataset.lucideReady === "true") return;
    const icon = createLucideIcon(element.getAttribute("data-lucide"));
    if (!icon) return;
    element.textContent = "";
    element.appendChild(icon);
    element.dataset.lucideReady = "true";
  });
}

function setStatus(message, isError = false) {
  if (statusEl) statusEl.textContent = message;
  const statusIcon = document.getElementById("statusIcon");
  if (statusIcon) {
    if (isError) {
      statusIcon.style.color = "#ff6b6b";
    } else if (message && /decoded/i.test(message)) {
      statusIcon.style.color = "#8be88b";
    } else {
      statusIcon.style.color = "";
    }
  }
}

function normalizeHex(value) {
  return (value || "")
    .replace(/0x/gi, "")
    .replace(/[^a-fA-F0-9]/g, "")
    .trim();
}

function hexToBytes(hex) {
  if (!hex) return new Uint8Array();
  if (hex.length % 2 !== 0) throw new Error("Hex input must have an even number of characters.");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function escapeHtml(value) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightJson(jsonString) {
  const escaped = escapeHtml(jsonString);
  return escaped.replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:?)|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (match) => {
    if (/^"/.test(match)) {
      return /:$/.test(match) ? `<span class="token-key">${match}</span>` : `<span class="token-string">${match}</span>`;
    }
    if (/true|false/.test(match)) return `<span class="token-boolean">${match}</span>`;
    if (/null/.test(match)) return `<span class="token-null">${match}</span>`;
    return `<span class="token-number">${match}</span>`;
  });
}

function renderOutput(text, shouldFormat) {
  if (!shouldFormat) {
    output.textContent = text;
    return;
  }
  try {
    const parsed = JSON.parse(text);
    const pretty = JSON.stringify(parsed, null, 2);
    output.innerHTML = highlightJson(pretty);
    setStatus("Decoded and formatted as JSON");
  } catch (err) {
    output.textContent = text;
    setStatus("Decoded text (invalid JSON)", true);
  }
}

function decodeHex() {
  try {
    const normalized = normalizeHex(hexInput && hexInput.value);
    const bytes = hexToBytes(normalized);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const text = decoder.decode(bytes);
    renderOutput(text, autoFormat && autoFormat.checked);
    if (autoFormat && !autoFormat.checked) setStatus("Decoded text");
  } catch (err) {
    if (output) output.textContent = "";
    setStatus(err.message || "Decode error", true);
  }
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(output.textContent || "");
    setStatus("Output copied");
  } catch (err) {
    setStatus("Copy failed", true);
  }
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

const debouncedDecode = debounce(() => {
  setStatus("Decoding...");
  decodeHex();
}, 300);

if (hexInput) {
  hexInput.addEventListener("input", debouncedDecode);
  hexInput.addEventListener("paste", () => setTimeout(() => decodeHex(), 50));
}

if (decodeBtn) decodeBtn.addEventListener("click", decodeHex);
if (autoFormat) autoFormat.addEventListener("change", decodeHex);
if (copyBtn) copyBtn.addEventListener("click", copyOutput);

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    if (themeToggle) {
      const sun = themeToggle.querySelector('.icon-sun');
      const moon = themeToggle.querySelector('.icon-moon');
      if (sun) sun.style.display = '';
      if (moon) moon.style.display = 'none';
      themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    }
  } else {
    document.documentElement.removeAttribute("data-theme");
    if (themeToggle) {
      const sun = themeToggle.querySelector('.icon-sun');
      const moon = themeToggle.querySelector('.icon-moon');
      if (sun) sun.style.display = 'none';
      if (moon) moon.style.display = '';
      themeToggle.setAttribute('aria-label', 'Switch to light theme');
    }
  }
  replaceLucideSafe();
}

function initTheme() {
  const saved = localStorage.getItem('pluto_theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = saved || (prefersLight ? 'light' : 'dark');
  applyTheme(theme);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('pluto_theme', next);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  replaceLucideSafe();
  initTheme();
  if (hexInput && hexInput.value && hexInput.value.trim().length > 0) decodeHex();
});
