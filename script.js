// 1) Replace these two values with your own Supabase Project URL and Publishable key.
const SUPABASE_URL = "https://icbtdkqrlumfnftxsysj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3TS3lRVYAcGcHaPU41ljig_xjTO_kpC";

const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authMessage = document.getElementById("authMessage");
const appMessage = document.getElementById("appMessage");
const signUpBtn = document.getElementById("signUpBtn");
const signOutBtn = document.getElementById("signOutBtn");
const signedInAs = document.getElementById("signedInAs");

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

let transactions = [];
let currentUser = null;
let supabaseClient = null;

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function configureSupabase() {
  if (!window.supabase || !SUPABASE_URL || SUPABASE_PUBLISHABLE_KEY === "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE") {
    setMessage(authMessage, "Setup needed: add your Supabase Publishable key in script.js first.", true);
    return false;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return true;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(value) || 0);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date + "T00:00:00"));
}

function getCategoryIcon(category) {
  const icons = {
    Food: "🍔", Transport: "🚗", Shopping: "🛍️", Bills: "🧾",
    Entertainment: "🎬", Health: "💊", Education: "📚", Salary: "💼", Other: "📌"
  };
  return icons[category] || "📌";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

function updateSummary() {
  const income = transactions.filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

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
        <span class="amount ${transaction.type}">${sign}${formatCurrency(transaction.amount)}</span>
        <button class="delete-btn" title="Delete transaction" aria-label="Delete transaction">×</button>
      </div>
    `;

    item.querySelector(".delete-btn").addEventListener("click", async () => {
      const { error } = await supabaseClient.from("transactions")
        .delete().eq("id", transaction.id).eq("user_id", currentUser.id);
      if (error) {
        setMessage(appMessage, "Could not delete transaction: " + error.message, true);
        return;
      }
      setMessage(appMessage, "");
      await loadTransactions();
    });

    list.appendChild(item);
  });
}

function render() {
  updateSummary();
  renderTransactions();
}

async function loadTransactions() {
  if (!currentUser || !supabaseClient) return;
  setMessage(appMessage, "Loading transactions...");
  const { data, error } = await supabaseClient.from("transactions")
    .select("id, user_id, type, description, amount, category, transaction_date, created_at")
    .eq("user_id", currentUser.id)
    .order("transaction_date", { ascending: false });

  if (error) {
    setMessage(appMessage, "Could not load transactions: " + error.message, true);
    return;
  }

  transactions = (data || []).map(row => ({
    id: row.id,
    type: row.type,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    date: row.transaction_date
  }));
  setMessage(appMessage, "");
  render();
}

async function showSession(session) {
  currentUser = session?.user || null;
  if (currentUser) {
    authPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    signedInAs.textContent = `Signed in as ${currentUser.email}`;
    dateInput.value = new Date().toISOString().split("T")[0];
    await loadTransactions();
  } else {
    appPanel.classList.add("hidden");
    authPanel.classList.remove("hidden");
    transactions = [];
    render();
  }
}

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!supabaseClient) return;
  setMessage(authMessage, "Signing in...");
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: authEmail.value.trim(),
    password: authPassword.value
  });
  if (error) {
    setMessage(authMessage, error.message, true);
    return;
  }
  setMessage(authMessage, "");
  await showSession(data.session);
});

signUpBtn.addEventListener("click", async () => {
  if (!supabaseClient) return;
  setMessage(authMessage, "Creating account...");
  const { data, error } = await supabaseClient.auth.signUp({
    email: authEmail.value.trim(),
    password: authPassword.value
  });
  if (error) {
    setMessage(authMessage, error.message, true);
    return;
  }
  if (data.session) {
    setMessage(authMessage, "Account created.");
    await showSession(data.session);
  } else {
    setMessage(authMessage, "Account created. Check your email to confirm, then sign in.");
  }
});

signOutBtn.addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    setMessage(appMessage, error.message, true);
    return;
  }
  await showSession(null);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser || !supabaseClient) return;

  const amount = Number(amountInput.value);
  const description = descriptionInput.value.trim();
  if (!description || !Number.isFinite(amount) || amount <= 0 || !dateInput.value) {
    setMessage(appMessage, "Please enter valid transaction details.", true);
    return;
  }

  const { error } = await supabaseClient.from("transactions").insert({
    user_id: currentUser.id,
    type: typeInput.value,
    description,
    amount,
    category: categoryInput.value,
    transaction_date: dateInput.value
  });

  if (error) {
    setMessage(appMessage, "Could not save transaction: " + error.message, true);
    return;
  }

  form.reset();
  typeInput.value = "expense";
  dateInput.value = new Date().toISOString().split("T")[0];
  setMessage(appMessage, "Transaction saved to database.");
  await loadTransactions();
});

filterInput.addEventListener("change", renderTransactions);

document.getElementById("clearAllBtn").addEventListener("click", async () => {
  if (!currentUser || !transactions.length) return;
  if (!confirm("Delete all your transactions? This cannot be undone.")) return;

  const { error } = await supabaseClient.from("transactions")
    .delete().eq("user_id", currentUser.id);
  if (error) {
    setMessage(appMessage, "Could not clear transactions: " + error.message, true);
    return;
  }
  setMessage(appMessage, "All your transactions were deleted.");
  await loadTransactions();
});

dateInput.value = new Date().toISOString().split("T")[0];

if (configureSupabase()) {
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      setMessage(authMessage, error.message, true);
      return;
    }
    showSession(data.session);
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    // Defer to avoid doing additional Supabase calls inside the auth callback.
    setTimeout(() => showSession(session), 0);
  });
}
