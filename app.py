from flask import Flask, jsonify, request, Response, send_from_directory
from datetime import date
import csv
import io

app = Flask(__name__, static_folder=None)

CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Health", "Education", "Entertainment", "Other"]

# No database is used. Data exists only while the Python program is running.
expenses = [
    {"id": 1, "name": "Lunch", "amount": 200.0, "category": "Food", "date": "2026-10-08"},
    {"id": 2, "name": "Bus Pass", "amount": 500.0, "category": "Travel", "date": "2026-10-07"},
    {"id": 3, "name": "Notebook", "amount": 300.0, "category": "Education", "date": "2026-10-06"},
    {"id": 4, "name": "Movie", "amount": 200.0, "category": "Entertainment", "date": "2026-10-05"},
]
budget = 5000.0
next_id = 5


def validate(data):
    name = str(data.get("name", "")).strip()
    if not name:
        return None, "Please enter an expense description."
    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return None, "Amount must be a number."
    if amount <= 0:
        return None, "Amount must be greater than 0."
    expense_date = str(data.get("date", ""))
    try:
        date.fromisoformat(expense_date)
    except ValueError:
        return None, "Please select a valid date."
    category = data.get("category", "Other")
    if category not in CATEGORIES:
        category = "Other"
    return {"name": name, "amount": round(amount, 2), "category": category, "date": expense_date}, None


@app.get("/")
def home():
    return send_from_directory(app.root_path, "index.html")


@app.get("/style.css")
def style():
    return send_from_directory(app.root_path, "style.css")


@app.get("/script.js")
def script():
    return send_from_directory(app.root_path, "script.js")


@app.get("/api/expenses")
def get_expenses():
    q = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "")
    rows = expenses.copy()
    if q:
        rows = [e for e in rows if q in e["name"].lower() or q in e["category"].lower()]
    if category:
        rows = [e for e in rows if e["category"] == category]
    rows.sort(key=lambda e: (e["date"], e["id"]), reverse=True)
    total = sum(e["amount"] for e in expenses)
    average = total / len(expenses) if expenses else 0
    return jsonify(expenses=rows, total=round(total, 2), count=len(expenses), average=round(average, 2), budget=budget)


@app.post("/api/expenses")
def add_expense():
    global next_id
    values, error = validate(request.get_json() or {})
    if error:
        return jsonify(error=error), 400
    values["id"] = next_id
    next_id += 1
    expenses.append(values)
    return jsonify(ok=True, expense=values), 201


@app.put("/api/expenses/<int:expense_id>")
def update_expense(expense_id):
    values, error = validate(request.get_json() or {})
    if error:
        return jsonify(error=error), 400
    for expense in expenses:
        if expense["id"] == expense_id:
            expense.update(values)
            return jsonify(ok=True, expense=expense)
    return jsonify(error="Expense not found."), 404


@app.delete("/api/expenses/<int:expense_id>")
def delete_expense(expense_id):
    global expenses
    old_length = len(expenses)
    expenses = [e for e in expenses if e["id"] != expense_id]
    if len(expenses) == old_length:
        return jsonify(error="Expense not found."), 404
    return jsonify(ok=True)


@app.post("/api/budget")
def set_budget():
    global budget
    try:
        value = float((request.get_json() or {}).get("budget", 0))
    except (TypeError, ValueError):
        return jsonify(error="Budget must be a number."), 400
    if value < 0:
        return jsonify(error="Budget cannot be negative."), 400
    budget = round(value, 2)
    return jsonify(ok=True, budget=budget)


@app.get("/export.csv")
def export_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Description", "Amount", "Category"])
    for expense in sorted(expenses, key=lambda e: e["date"]):
        writer.writerow([expense["date"], expense["name"], expense["amount"], expense["category"]])
    return Response(output.getvalue(), mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=expenses.csv"})


if __name__ == "__main__":
    app.run(debug=True)
