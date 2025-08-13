const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn  = document.getElementById("newQuote");
const importFile   = document.getElementById("importFile");

let quotes = [
  { text: "The best way to get started is to quit talking and begin doing", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today", category: "Inspiration" }
];

// storage helpers
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

// rendering
function renderQuote(quote) {
  quoteDisplay.innerHTML = `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}
function showRandomQuote() {
  if (quotes.length === 0) return;
  const i = Math.floor(Math.random() * quotes.length);
  renderQuote(quotes[i]);
}
newQuoteBtn.addEventListener("click", showRandomQuote);

// dynamic UI
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
  btn.addEventListener("click", () => {
    const data = JSON.stringify(quotes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    a.click();
    URL.revokeObjectURL(url);
  });
  document.body.appendChild(btn);
}

// actions
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

function tryRenderLastViewed() {
  const last = sessionStorage.getItem("lastQuote");
  if (last) {
    try { renderQuote(JSON.parse(last)); }
    catch { showRandomQuote(); }
  } else {
    showRandomQuote();
  }
}

// init
function init() {
  loadQuotes();
  createAddQuoteForm();
  createExportButton();
  tryRenderLastViewed();
  saveQuotes();
}
init();
