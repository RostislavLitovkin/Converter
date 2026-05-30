const hexInput = document.getElementById("hexInput");
const decodeBtn = document.getElementById("decodeBtn");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");
const autoFormat = document.getElementById("autoFormat");
const copyBtn = document.getElementById("copyBtn");
const themeToggle = document.getElementById("themeToggle");

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

function replaceLucideSafe() {
  if (window.lucide && typeof window.lucide.replace === 'function') {
    try { window.lucide.replace(); } catch (e) {}
  }
}

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
