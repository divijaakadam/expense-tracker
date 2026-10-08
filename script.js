// Frontend: talks to the Flask API with fetch().
const $ = id => document.getElementById(id);
const money = n => "₹" + Number(n).toFixed(2);
let editId = null, pie, bars;

$("date").value = new Date().toISOString().slice(0, 10);

async function api(url, method = "GET", body) {
  const res = await fetch(url, {method, headers: {"Content-Type": "application/json"},
    body: body ? JSON.stringify(body) : undefined});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

async function load() {
  const p = new URLSearchParams({q: $("search").value, category: $("fCat").value,
    month: $("fMonth").value, sort: $("sort").value});
  const {expenses, budget, month_spent} = await api("/api/expenses?" + p);
  renderTable(expenses); renderStats(expenses); renderCharts(expenses); renderBudget(budget, month_spent);
}

function renderTable(list) {
  $("rows").innerHTML = "";
  $("empty").hidden = list.length > 0;
  for (const e of list) {
    const tr = document.createElement("tr");
    for (const v of [e.name, money(e.amount), e.category, e.date]) {
      const td = document.createElement("td"); td.textContent = v; tr.append(td);   // textContent = safe from HTML injection
    }
    const act = document.createElement("td");
    const ed = Object.assign(document.createElement("button"), {textContent: "Edit", className: "edit"});
    const del = Object.assign(document.createElement("button"), {textContent: "Delete", className: "danger"});
    ed.onclick = () => startEdit(e);
    del.onclick = async () => { if (confirm(`Delete "${e.name}"?`)) { await api("/api/expenses/" + e.id, "DELETE"); load(); } };
    act.append(ed, del); tr.append(act); $("rows").append(tr);
  }
}

function renderStats(list) {
  const total = list.reduce((s, e) => s + e.amount, 0);
  $("total").textContent = money(total);
  $("count").textContent = list.length;
  $("avg").textContent = money(list.length ? total / list.length : 0);
}

function renderCharts(list) {
  if (typeof Chart === "undefined") return;   // Chart.js (CDN) not loaded, e.g. offline: skip charts, rest still works
  const byCat = {}, byMonth = {};
  for (const e of list) {
    byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    const m = e.date.slice(0, 7); byMonth[m] = (byMonth[m] || 0) + e.amount;
  }
  const months = Object.keys(byMonth).sort();
  pie?.destroy(); bars?.destroy();
  const opt = {responsive: true, maintainAspectRatio: false};
  pie = new Chart($("pie"), {type: "doughnut", options: {...opt, plugins: {title: {display: true, text: "By category"}}},
    data: {labels: Object.keys(byCat), datasets: [{data: Object.values(byCat)}]}});
  bars = new Chart($("bars"), {type: "bar", options: {...opt, plugins: {legend: {display: false}, title: {display: true, text: "By month"}}},
    data: {labels: months, datasets: [{data: months.map(m => byMonth[m]), backgroundColor: "#2563eb"}]}});
}

function renderBudget(budget, spent) {
  $("budget").value = budget || "";
  const pct = budget ? Math.min(100, spent / budget * 100) : 0;
  $("barFill").style.width = pct + "%";
  $("barFill").style.background = pct >= 100 ? "#dc2626" : pct >= 80 ? "#f59e0b" : "#16a34a";
  $("budgetText").textContent = !budget ? "No budget set."
    : spent > budget ? `Over budget: ${money(spent)} spent of ${money(budget)} this month.`
    : `${money(spent)} spent of ${money(budget)} this month.`;
}

function startEdit(e) {
  editId = e.id;
  $("name").value = e.name; $("amount").value = e.amount; $("category").value = e.category; $("date").value = e.date;
  $("formTitle").textContent = "Edit Expense"; $("save").textContent = "Save changes"; $("cancel").hidden = false;
  window.scrollTo({top: 0, behavior: "smooth"});
}

function resetForm() {
  editId = null; $("name").value = ""; $("amount").value = "";
  $("date").value = new Date().toISOString().slice(0, 10);
  $("formTitle").textContent = "Add Expense"; $("save").textContent = "Add Expense"; $("cancel").hidden = true; $("error").textContent = "";
}

$("save").onclick = async () => {
  const body = {name: $("name").value, amount: $("amount").value, category: $("category").value, date: $("date").value};
  try {
    await (editId ? api("/api/expenses/" + editId, "PUT", body) : api("/api/expenses", "POST", body));
    resetForm(); load();
  } catch (err) { $("error").textContent = err.message; }
};
$("cancel").onclick = resetForm;
$("setBudget").onclick = async () => {
  try { await api("/api/budget", "POST", {budget: $("budget").value || 0}); load(); }
  catch (err) { $("error").textContent = err.message; }
};
for (const id of ["search", "fCat", "fMonth", "sort"]) $(id).oninput = load;

// Dark mode (remembered in the browser)
const setTheme = t => { document.documentElement.dataset.theme = t; $("theme").textContent = t === "dark" ? "Light mode" : "Dark mode"; localStorage.setItem("theme", t); };
$("theme").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
setTheme(localStorage.getItem("theme") || "light");

load();
