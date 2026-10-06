const STORAGE_KEY = "expenseTrackerTransactions";

const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const filterInput = document.getElementById("filter");
const list = document.getElementById("transactionList");
const emptyState = document.getElementById("emptyState");
const count = document.getElementById("transactionCount");

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

dateInput.value = new Date().toISOString().split("T")[0];

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date + "T00:00:00"));
}

function updateSummary() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  document.getElementById("totalIncome").textContent = formatCurrency(income);
  document.getElementById("totalExpense").textContent = formatCurrency(expense);
  document.getElementById("balance").textContent = formatCurrency(income - expense);
}

function renderTransactions() {
  const filter = filterInput.value;
  const visible = transactions
    .filter(t => filter === "all" || t.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  list.innerHTML = "";
  emptyState.style.display = visible.length ? "none" : "block";
  count.textContent = `${visible.length} transaction${visible.length === 1 ? "" : "s"}`;

  visible.forEach(transaction => {
    const item = document.createElement("article");
    item.className = "transaction";

    const sign = transaction.type === "income" ? "+" : "-";

    item.innerHTML = `
      <div class="transaction-main">
        <div class="category-icon">${getCategoryIcon(transaction.category)}</div>
        <div>
          <h3>${escapeHtml(transaction.description)}</h3>
          <small>${escapeHtml(transaction.category)} • ${formatDate(transaction.date)}</small>
        </div>
      </div>
      <div class="transaction-right">
        <span class="amount ${transaction.type}">
          ${sign}${formatCurrency(transaction.amount)}
        </span>
        <button class="delete-btn" title="Delete transaction" data-id="${transaction.id}">×</button>
      </div>
    `;

    item.querySelector(".delete-btn").addEventListener("click", () => {
      transactions = transactions.filter(t => t.id !== transaction.id);
      saveTransactions();
      render();
    });

    list.appendChild(item);
  });
}

function getCategoryIcon(category) {
  const icons = {
    Food: "🍔",
    Transport: "🚗",
    Shopping: "🛍️",
    Bills: "🧾",
    Entertainment: "🎬",
    Health: "💊",
    Education: "📚",
    Salary: "💼",
    Other: "📌"
  };
  return icons[category] || "📌";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const amount = Number(amountInput.value);

  if (!descriptionInput.value.trim() || amount <= 0 || !dateInput.value) {
    alert("Please enter valid transaction details.");
    return;
  }

  transactions.push({
    id: Date.now(),
    type: typeInput.value,
    description: descriptionInput.value.trim(),
    amount,
    category: categoryInput.value,
    date: dateInput.value
  });

  saveTransactions();
  form.reset();
  typeInput.value = "expense";
  dateInput.value = new Date().toISOString().split("T")[0];
  render();
});

filterInput.addEventListener("change", renderTransactions);

document.getElementById("clearAllBtn").addEventListener("click", () => {
  if (!transactions.length) return;

  if (confirm("Delete all transactions? This cannot be undone.")) {
    transactions = [];
    saveTransactions();
    render();
  }
});

function render() {
  updateSummary();
  renderTransactions();
}

render();
