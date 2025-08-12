
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuote = document.getElementById("newQuote");

let quotes = [
    {
        text: "The best way to get started is to quit talking and begin doing",
        category: "Motivation"
    },
       {
        text: "Don't let yesterday take up too much of today",
        category: "Inspiration"
    }
]
function showRandomQuote() {
   const randomIndex = Math.floor(Math.random() * quotes.length);
   const quote = quotes[randomIndex];
   quoteDisplay.innerHTML = `<p>"${quote.text}"</p> <small> - ${quote.category} </small>`;
}

function createAddQuoteForm(){
    const formContainer = document.createElement('div');

    const textInput = document.createElement('input');
    textInput.type = "text";
    textInput.id = "newQuoteText";
    textInput.placeholder = "Enter new Quote";

    const categoryInput = document.createElement("input");
    categoryInput.type = "text";
    categoryInput.id = "newQuoteCategory";
    categoryInput.placeholder = "Enter Quote Category";

    const addButton = document.createElement("button");
    addButton.textContent = "Add Quote";
    addButton.addEventListener("click", addQuote);

    formContainer.appendChild(textInput);
    formContainer.appendChild(categoryInput);
    formContainer.appendChild(addButton);

    document.body.appendChild(formContainer);
}

function addQuote() {
    const text = document.getElementById("newQuoteText").value.trim();
    const category = document.getElementById("newQuoteCategory").value.trim();

    if (text && category){
        quotes.push({ text, category});
        document.getElementById("newQuoteText").value = "";
        document.getElementById("newQuoteCategory").value = '';
        alert("Quotes added successfully!")
        console.log(addQuote)
    } else {
        alert("Please enter both a quote and a category")
    }
}
newQuote.addEventListener("click", showRandomQuote)

showRandomQuote();
createAddQuoteForm();