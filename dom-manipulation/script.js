// ===== DOM =====
const quoteDisplay   = document.getElementById("quoteDisplay");
const newQuoteBtn    = document.getElementById("newQuote");
const importFile     = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");
const syncStatusEl   = document.getElementById("syncStatus");
const syncNowBtn     = document.getElementById("syncNow");

// ===== Local state =====
// NOTE: Each quote will have { id, text, category, updatedAt, pending }
// - id: 'srv-<number>' for server items, 'loc-<timestamp>' for local-only
// - pending: true if created/edited locally and not pushed yet
let quotes = [
  { id: `loc-${Date.now()-2}`, text: "The best way to get started is to quit talking and begin doing", category: "Motivation",  updatedAt: Date.now()-2, pending: false },
  { id: `loc-${Date.now()-1}`, text: "Don't let yesterday take up too much of today",                    category: "Inspiration", updatedAt: Date.now()-1, pending: false }
];

// ===== Server simulation (JSONPlaceholder) =====
// We’ll map quotes <-> posts (title=text, body=category). JSONPlaceholder accepts POST but doesn’t persist.
// This is enough to *simulate* a round-trip.
const API = {
  list:  "https://jsonplaceholder.typicode.com/posts?_limit=10",
  create:"https://jsonplaceholder.typicode.com/posts"
};

// ===== Utilities =====
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function setStatus(msg, type = "info") {
  // type: info | success | warn | error
  syncStatusEl.textContent = msg;
  syncStatusEl.style.padding = "6px 10px";
  syncStatusEl.style.marginTop = "8px";
  syncStatusEl.style.borderRadius = "6px";
  const colors = {
    info:   "#eef5ff",
    success:"#eaffea",
    warn:   "#fff7e6",
    error:  "#ffecec"
  };
  syncStatusEl.style.background = colors[type] || colors.info;
}

// ===== Local storage helpers =====
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}
function loadQuotes() {
  const raw = localStorage.getItem("quotes");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // ensure meta fields exist
      quotes = parsed.map(q => ({
        id: q.id || `loc-${Date.now()}-${Math.random()}`,
        text: q.text,
        category: q.category,
        updatedAt: q.updatedAt || Date.now(),
        pending: !!q.pending
      }));
    }
  } catch {}
}

// ===== Rendering =====
function renderQuote(quote) {
  quoteDisplay.innerHTML = `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

function getFilteredQuotes() {
  const selected = categoryFilter?.value || "all";
  if (selected === "all") return quotes;
  return quotes.filter(q => q.category === selected);
}

function showRandomQuote() {
  const filtered = getFilteredQuotes();
  if (filtered.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes in this category.</p>";
    return;
  }
  const i = Math.floor(Math.random() * filtered.length);
  renderQuote(filtered[i]);
}

newQuoteBtn.addEventListener("click", showRandomQuote);

// ===== Categories (filter) =====
function populateCategories() {
  if (!categoryFilter) return;
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  const lastCat = localStorage.getItem("selectedCategory");
  if (lastCat && categories.includes(lastCat)) {
    categoryFilter.value = lastCat;
  }
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);
  showRandomQuote();
}
categoryFilter?.addEventListener("change", filterQuotes);

// ===== Add Quote (dynamic UI) =====
function createAddQuoteForm() {
  const form = document.createElement("div");
  form.style.marginTop = "10px";

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter a new quote";
  textInput.style.marginRight = "6px";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.style.marginRight = "6px";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  form.append(textInput, categoryInput, addBtn);
  document.body.appendChild(form);

  [textInput, categoryInput].forEach(el =>
    el.addEventListener("keydown", (e) => e.key === "Enter" && addQuote())
  );
}

function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl  = document.getElementById("newQuoteCategory");
  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category");
    return;
  }

  const newQ = {
    id: `loc-${Date.now()}`, // local placeholder id
    text, category,
    updatedAt: Date.now(),
    pending: true // mark as needing push to server
  };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();
  textEl.value = "";
  catEl.value = "";
  alert("Quote added locally! It will be pushed to the server on next sync.");
  showRandomQuote();
}

// ===== Import / Export =====
document.getElementById('export-quotes')?.addEventListener('click', exportQuotes);

function exportQuotes() {
  const quotesJSON = JSON.stringify(quotes, null, 2);
  const blob = new Blob([quotesJSON], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("JSON must be an array");
      const cleaned = imported
        .filter(q => q && typeof q.text === "string" && typeof q.category === "string")
        .map(q => ({
          id: q.id || `loc-${Date.now()}-${Math.random()}`,
          text: q.text,
          category: q.category,
          updatedAt: q.updatedAt || Date.now(),
          pending: !!q.pending
        }));
      quotes.push(...cleaned);
      saveQuotes();
      populateCategories();
      alert(`Imported ${cleaned.length} quotes!`);
      showRandomQuote();
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}
importFile?.addEventListener("change", importFromJsonFile);

// ===== Try render last viewed =====
function tryRenderLastViewed() {
  const last = sessionStorage.getItem("lastQuote");
  if (last) {
    try { renderQuote(JSON.parse(last)); }
    catch { showRandomQuote(); }
  } else {
    showRandomQuote();
  }
}

// ===== Server mapping helpers =====
function mapPostToQuote(post) {
  // Map JSONPlaceholder post -> our quote shape
  return {
    id: `srv-${post.id}`,
    text: String(post.title || "").trim() || "(no text)",
    category: String(post.body || "General").split("\n")[0].trim() || "General",
    updatedAt: Date.now(), // JSONPlaceholder has no updatedAt; simulate "fresh"
    pending: false
  };
}
function mapQuoteToPostPayload(q) {
  return {
    title: q.text,
    body:  q.category,
    userId: 1
  };
}

// ===== Server I/O =====
async function fetchServerQuotes() {
  const res = await fetch(API.list);
  const data = await res.json();
  return data.map(mapPostToQuote);
}

async function pushLocalNewQuotes() {
  // Push only quotes with id starting 'loc-' and pending === true
  const locals = quotes.filter(q => q.pending && q.id.startsWith("loc-"));
  if (locals.length === 0) return { pushed: 0, updated: [] };

  const updated = [];
  for (const q of locals) {
    try {
      const payload = mapQuoteToPostPayload(q);
      const res = await fetch(API.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const created = await res.json();
      // JSONPlaceholder responds with an id; we'll convert to srv-id
      const newId = created?.id != null ? `srv-${created.id}` : `srv-${Math.floor(Math.random()*100000)}`;
      // Replace local id with server id & clear pending
      q.id = newId;
      q.pending = false;
      q.updatedAt = Date.now();
      updated.push(q);
    } catch (e) {
      console.error("Push failed for", q, e);
    }
  }
  saveQuotes();
  return { pushed: updated.length, updated };
}

// ===== Merge & Conflict Resolution (server-wins) =====
function mergeServerIntoLocal(serverQuotes) {
  const localMap = new Map(quotes.map(q => [q.id, q]));
  const conflicts = [];

  // 1) Apply/overwrite with server items
  for (const s of serverQuotes) {
    const l = localMap.get(s.id);
    if (!l) {
      // New from server -> add
      localMap.set(s.id, s);
      continue;
    }
    // Conflict? (local pending changes vs server)
    if (l.pending) {
      // Server wins policy
      conflicts.push({ local: { ...l }, server: { ...s } });
      localMap.set(s.id, { ...s, pending: false });
    } else {
      // Not pending locally: just trust server and overwrite if changed
      localMap.set(s.id, { ...s, pending: false });
    }
  }

  // 2) Keep local-only items (their ids start with loc- OR srv-* not present on server)
  //    We already have them in localMap; nothing to delete unless you want hard server-authoritative.
  const merged = Array.from(localMap.values());

  quotes = merged;
  saveQuotes();
  populateCategories();
  return conflicts;
}

// ===== Sync Orchestrator =====
let syncTimer = null;

async function runSync({ manual = false } = {}) {
  try {
    setStatus(manual ? "Syncing (manual)..." : "Syncing...");
    // 1) Push local new quotes first
    const pushRes = await pushLocalNewQuotes();
    // 2) Fetch server state
    const serverList = await fetchServerQuotes();
    // 3) Merge (server-wins)
    const conflicts = mergeServerIntoLocal(serverList);

    if (conflicts.length > 0) {
      setStatus(`Synced with ${conflicts.length} conflict(s). Server version kept.`, "warn");
      console.table(conflicts.map(c => ({
        local_text: c.local.text, local_cat: c.local.category,
        server_text: c.server.text, server_cat: c.server.category
      })));
    } else if (pushRes.pushed > 0) {
      setStatus(`Synced. Pushed ${pushRes.pushed} new quote(s).`, "success");
    } else {
      setStatus("Synced. No changes.", "success");
    }
    // Refresh current view
    showRandomQuote();
  } catch (e) {
    console.error(e);
    setStatus("Sync error. See console.", "error");
  }
}

function startPeriodicSync() {
  if (syncTimer) clearInterval(syncTimer);
  // Periodic fetch to simulate updates from server (every 30s)
  syncTimer = setInterval(runSync, 30000);
}
syncNowBtn?.addEventListener("click", () => runSync({ manual: true }));

// ===== Init =====
function init() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();
  tryRenderLastViewed();
  saveQuotes();

  // initial sync shortly after load (to avoid blocking first paint)
  setTimeout(() => runSync({ manual: false }), 1000);
  startPeriodicSync();
  setStatus("Ready.");
}
init();
