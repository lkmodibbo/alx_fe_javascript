const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn  = document.getElementById("newQuote");
const importFile   = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");

let quotes = [
  { text: "The best way to get started is to quit talking and begin doing", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today", category: "Inspiration" }
];

document.getElementById('export-quotes').addEventListener('click', exportQuotes);

function exportQuotes() {
    const quotesJSON = JSON.stringify(quotes, null, 2);
    const blob = new Blob([quotesJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Storage helpers
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}
function loadQuotes() {
  const raw = localStorage.getItem("quotes");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) quotes = parsed;
  } catch {}
}

// Rendering
function renderQuote(quote) {
  quoteDisplay.innerHTML = `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}
function showRandomQuote() {
  let filtered = getFilteredQuotes();
  if (filtered.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes in this category.</p>";
    return;
  }
  const i = Math.floor(Math.random() * filtered.length);
  renderQuote(filtered[i]);
}
newQuoteBtn.addEventListener("click", showRandomQuote);

// Category Functions
function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  // Restore last filter
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

function getFilteredQuotes() {
  const selected = categoryFilter.value || "all";
  if (selected === "all") return quotes;
  return quotes.filter(q => q.category === selected);
}

// Dynamic UI
function createAddQuoteForm() {
  const form = document.createElement("div");

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  form.append(textInput, categoryInput, addBtn);
  document.body.appendChild(form);

  [textInput, categoryInput].forEach(el =>
    el.addEventListener("keydown", (e) => e.key === "Enter" && addQuote())
  );
}
function createExportButton() {
  const btn = document.createElement("button");
  btn.textContent = "Export Quotes";
  btn.addEventListener("click", exportQuotes);
  document.body.appendChild(btn);
}

// Actions
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl  = document.getElementById("newQuoteCategory");
  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please enter both a quote and a category");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  textEl.value = "";
  catEl.value = "";
  alert("Quote added successfully!");
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("JSON must be an array");
      const cleaned = imported.filter(
        q => q && typeof q.text === "string" && typeof q.category === "string"
      );
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
importFile.addEventListener("change", importFromJsonFile);
categoryFilter.addEventListener("change", filterQuotes);

function tryRenderLastViewed() {
  const last = sessionStorage.getItem("lastQuote");
  if (last) {
    try { renderQuote(JSON.parse(last)); }
    catch { showRandomQuote(); }
  } else {
    showRandomQuote();
  }
}

// Init
function init() {
  loadQuotes();
  createAddQuoteForm();
  createExportButton();
  populateCategories();
  tryRenderLastViewed();
  saveQuotes();
}
init();
