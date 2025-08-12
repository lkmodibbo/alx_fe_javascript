
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