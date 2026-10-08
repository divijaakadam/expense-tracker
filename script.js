// ===============================
// PERSONAL EXPENSE TRACKER
// GitHub Pages Version
// Uses Local Storage - No Database
// ===============================

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let budget = Number(localStorage.getItem("budget")) || 0;

let editIndex = -1;
let chart = null;


// ===============================
// GET HTML ELEMENTS
// ===============================

const expenseForm = document.getElementById("expenseForm");

const dateInput = document.getElementById("date");
const nameInput = document.getElementById("name");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");

const expenseRows = document.getElementById("expenseRows");
const empty = document.getElementById("empty");

const totalElement = document.getElementById("total");
const countElement = document.getElementById("count");
const averageElement = document.getElementById("average");

const budgetInput = document.getElementById("budget");
const budgetBtn = document.getElementById("budgetBtn");
const budgetText = document.getElementById("budgetText");
const progressBar = document.getElementById("progressBar");

const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filterCategory");

const themeBtn = document.getElementById("themeBtn");

const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");
const formTitle = document.getElementById("formTitle");

const message = document.getElementById("message");

const exportBtn = document.getElementById("exportBtn");


// ===============================
// SET TODAY'S DATE
// ===============================

const today = new Date();

const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

dateInput.value = todayString;


// ===============================
// SAVE DATA
// ===============================

function saveData() {

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

    localStorage.setItem(
        "budget",
        String(budget)
    );
}


// ===============================
// SHOW MESSAGE
// ===============================

function showMessage(text) {

    message.textContent = text;

    setTimeout(function () {
        message.textContent = "";
    }, 2500);
}


// ===============================
// ADD EXPENSE
// ===============================

expenseForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const date = dateInput.value;
    const description = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;

    if (!date) {
        alert("Please select a date.");
        return;
    }

    if (!description) {
        alert("Please enter a description.");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }


    const expense = {
        date: date,
        name: description,
        amount: amount,
        category: category
    };


    // ADD
    if (editIndex === -1) {

        expenses.push(expense);

        showMessage("Expense added successfully!");

    }

    // EDIT
    else {

        expenses[editIndex] = expense;

        editIndex = -1;

        saveBtn.textContent = "Add Expense";
        formTitle.textContent = "Add Expense";

        cancelBtn.classList.add("hidden");

        showMessage("Expense updated successfully!");
    }


    // Save to browser
    saveData();


    // Clear form
    expenseForm.reset();

    dateInput.value = todayString;


    // IMPORTANT
    renderExpenses();

});


// ===============================
// DISPLAY EXPENSES
// ===============================

function renderExpenses() {

    const searchText =
        searchInput.value.toLowerCase().trim();

    const selectedCategory =
        filterCategory.value;


    const filteredExpenses = expenses.filter(function (expense) {

        const matchesSearch =
            expense.name
                .toLowerCase()
                .includes(searchText);

        const matchesCategory =
            selectedCategory === "" ||
            expense.category === selectedCategory;

        return matchesSearch && matchesCategory;

    });


    expenseRows.innerHTML = "";


    if (filteredExpenses.length === 0) {

        empty.classList.remove("hidden");

    } else {

        empty.classList.add("hidden");


        filteredExpenses.forEach(function (expense) {

            const originalIndex =
                expenses.indexOf(expense);


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>${escapeHTML(expense.date)}</td>

                <td>${escapeHTML(expense.name)}</td>

                <td>₹${Number(expense.amount).toFixed(2)}</td>

                <td>${escapeHTML(expense.category)}</td>

                <td>
                    <div class="action-buttons">

                        <button
                            class="edit-btn"
                            onclick="editExpense(${originalIndex})">
                            Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteExpense(${originalIndex})">
                            Delete
                        </button>

                    </div>
                </td>
            `;


            expenseRows.appendChild(row);

        });

    }


    // Update everything
    updateSummary();
    updateBudget();
    updateChart();

}


// ===============================
// SECURITY
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ===============================
// UPDATE SUMMARY
// ===============================

function updateSummary() {

    let total = 0;


    expenses.forEach(function (expense) {

        total += Number(expense.amount);

    });


    const count =
        expenses.length;


    const average =
        count > 0
            ? total / count
            : 0;


    totalElement.textContent =
        "₹" + total.toFixed(2);


    countElement.textContent =
        count;


    averageElement.textContent =
        "₹" + average.toFixed(2);

}


// ===============================
// EDIT EXPENSE
// ===============================

function editExpense(index) {

    const expense =
        expenses[index];


    dateInput.value =
        expense.date;

    nameInput.value =
        expense.name;

    amountInput.value =
        expense.amount;

    categoryInput.value =
        expense.category;


    editIndex = index;


    formTitle.textContent =
        "Edit Expense";

    saveBtn.textContent =
        "Update Expense";

    cancelBtn.classList.remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ===============================
// CANCEL EDIT
// ===============================

cancelBtn.addEventListener("click", function () {

    editIndex = -1;

    expenseForm.reset();

    dateInput.value =
        todayString;

    formTitle.textContent =
        "Add Expense";

    saveBtn.textContent =
        "Add Expense";

    cancelBtn.classList.add("hidden");

});


// ===============================
// DELETE EXPENSE
// ===============================

function deleteExpense(index) {

    if (!confirm("Are you sure you want to delete this expense?")) {
        return;
    }


    expenses.splice(index, 1);

    saveData();

    renderExpenses();

}


// ===============================
// MONTHLY BUDGET
// ===============================

budgetBtn.addEventListener("click", function () {

    const newBudget =
        parseFloat(budgetInput.value);


    if (isNaN(newBudget) || newBudget < 0) {

        alert("Please enter a valid budget.");

        return;
    }


    budget = newBudget;

    saveData();

    budgetInput.value = "";

    updateBudget();

});


function updateBudget() {

    let totalSpent = 0;


    expenses.forEach(function (expense) {

        totalSpent += Number(expense.amount);

    });


    budgetText.textContent =
        "Budget: ₹" +
        budget.toFixed(2) +
        " | Spent: ₹" +
        totalSpent.toFixed(2);


    if (budget > 0) {

        let percentage =
            (totalSpent / budget) * 100;


        if (percentage > 100) {
            percentage = 100;
        }


        progressBar.style.width =
            percentage + "%";

    } else {

        progressBar.style.width =
            "0%";
    }

}


// ===============================
// SEARCH
// ===============================

searchInput.addEventListener(
    "input",
    renderExpenses
);


// ===============================
// CATEGORY FILTER
// ===============================

filterCategory.addEventListener(
    "change",
    renderExpenses
);


// ===============================
// DARK MODE
// ===============================

themeBtn.addEventListener("click", function () {

    document.body.classList.toggle("dark");


    const dark =
        document.body.classList.contains("dark");


    if (dark) {

        themeBtn.textContent =
            "☀️ Light Mode";

        localStorage.setItem(
            "darkMode",
            "true"
        );

    } else {

        themeBtn.textContent =
            "🌙 Dark Mode";

        localStorage.setItem(
            "darkMode",
            "false"
        );

    }

});


// Load dark mode
if (
    localStorage.getItem("darkMode") === "true"
) {

    document.body.classList.add("dark");

    themeBtn.textContent =
        "☀️ Light Mode";
}


// ===============================
// EXPORT CSV
// ===============================

exportBtn.addEventListener("click", function () {

    if (expenses.length === 0) {

        alert("No expenses available to export.");

        return;
    }


    let csv =
        "Date,Description,Amount,Category\n";


    expenses.forEach(function (expense) {

        const description =
            expense.name.replace(/"/g, '""');


        csv +=
            `"${expense.date}","${description}","${expense.amount}","${expense.category}"\n`;

    });


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "personal-expenses.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);

});


// ===============================
// CHART
// ===============================

function updateChart() {

    const categoryTotals = {};


    expenses.forEach(function (expense) {

        const category =
            expense.category;

        const amount =
            Number(expense.amount);


        if (!categoryTotals[category]) {

            categoryTotals[category] = 0;

        }


        categoryTotals[category] += amount;

    });


    const labels =
        Object.keys(categoryTotals);


    const values =
        Object.values(categoryTotals);


    const canvas =
        document.getElementById("expenseChart");


    // If Chart.js isn't available,
    // don't stop the rest of the application.
    if (
        typeof Chart === "undefined"
    ) {

        return;
    }


    if (chart !== null) {

        chart.destroy();

    }


    chart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [

                    {
                        data: values
                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

}


// ===============================
// INITIAL LOAD
// ===============================

renderExpenses();
