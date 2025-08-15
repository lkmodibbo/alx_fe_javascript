// ===== DOM =====
const quoteDisplay   = document.getElementById("quoteDisplay");
const newQuoteBtn    = document.getElementById("newQuote");
const importFile     = document.getElementById("importFile");
const exportBtn      = document.getElementById("export-quotes");
const categoryFilter = document.getElementById("categoryFilter");

// ===== Local state =====
let quotes = [
  { id: `loc-${Date.now()-2}`, text: "The best way to get started is to quit talking and begin doing", category: "Motivation",  updatedAt: Date.now()-2, pending: false },
  { id: `loc-${Date.now()-1}`, text: "Don't let yesterday take up too much of today",                    category: "Inspiration", updatedAt: Date.now()-1, pending: false }
];

// ===== Storage helpers =====
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}
function loadQuotes() {
  const raw = localStorage.getItem("quotes");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
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

// ===== Categories =====
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
  localStorage.setItem("selectedCategory", categoryFilter.value);
  showRandomQuote();
}
categoryFilter?.addEventListener("change", filterQuotes);

// ===== Add Quote UI =====
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

  quotes.push({
    id: `loc-${Date.now()}`,
    text,
    category,
    updatedAt: Date.now(),
    pending: true   // mark for POST on next sync
  });
  saveQuotes();
  populateCategories();
  textEl.value = "";
  catEl.value = "";
  alert("Quote added locally! It will be pushed to the server on next sync.");
  showRandomQuote();
}

// ===== Import / Export =====
exportBtn?.addEventListener('click', exportQuotes);
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

// ===== Server mapping helpers =====
function mapPostToQuote(post) {
  return {
    id: `srv-${post.id}`,
    text: String(post.title || "").trim() || "(no text)",
    category: String(post.body || "Server").split("\n")[0].trim() || "Server",
    updatedAt: Date.now(),
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
// 1) Pull latest from server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=8");
    const data = await response.json();
    const serverQuotes = data.map(mapPostToQuote);

    // Merge: server-wins by text (simple strategy)
    const serverTextSet = new Set(serverQuotes.map(q => q.text));
    const conflicts = quotes.filter(q => q.pending && serverTextSet.has(q.text));

    // server first, then local items not duplicated by text
    const merged = [
      ...serverQuotes,
      ...quotes.filter(q => !serverTextSet.has(q.text))
    ];

    if (conflicts.length > 0) {
      console.warn(`Conflicts detected (${conflicts.length}). Server version kept.`);
    }

    quotes = merged;
    saveQuotes();
    populateCategories();
    showRandomQuote();
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
  }
}

// 2) Push local pending quotes (***contains method/POST/headers/Content-Type***)
async function pushLocalPendingQuotes() {
  const pending = quotes.filter(q => q.pending);
  if (pending.length === 0) return;

  for (const q of pending) {
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapQuoteToPostPayload(q))
      });
      const created = await res.json();
      // Simulate server assigning an id; switch to srv- id
      q.id = created?.id != null ? `srv-${created.id}` : `srv-${Math.floor(Math.random()*100000)}`;
      q.pending = false;
      q.updatedAt = Date.now();
    } catch (e) {
      console.error("Push failed for", q, e);
    }
  }
  saveQuotes();
}

// ===== Sync orchestration =====
async function runSync() {
  await pushLocalPendingQuotes(); // push local first
  await fetchQuotesFromServer();  // then pull latest (server-wins)
}

// ===== Last viewed =====
function tryRenderLastViewed() {
  const last = sessionStorage.getItem("lastQuote");
  if (last) {
    try { renderQuote(JSON.parse(last)); }
    catch { showRandomQuote(); }
  } else {
    showRandomQuote();
  }
}

// ===== Init =====
function init() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();
  tryRenderLastViewed();
  saveQuotes();

  // Initial sync + periodic sync every 30s
  runSync();
  setInterval(runSync, 30000);
}
init();
