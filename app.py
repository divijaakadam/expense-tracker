"""Personal Expense Tracker - Flask + SQLite (sqlite3 is built into Python)."""
import csv, io, os, sqlite3
from datetime import date
from flask import Flask, g, jsonify, render_template, request, Response

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "expenses.db")
CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Health", "Education", "Other"]
SORTS = {"date_desc": "date DESC, id DESC", "date_asc": "date ASC, id ASC",
         "amt_desc": "amount DESC", "amt_asc": "amount ASC"}


def db():
    """One database connection per request."""
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_):
    conn = g.pop("db", None)
    if conn:
        conn.close()


def init_db():
    with sqlite3.connect(DB) as c:
        c.execute("""CREATE TABLE IF NOT EXISTS expenses(
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
            amount REAL NOT NULL, category TEXT NOT NULL, date TEXT NOT NULL)""")
        c.execute("CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT)")


def validate(d):
    """Check user input. Returns (values, error)."""
    name = (d.get("name") or "").strip()
    if not name:
        return None, "Please enter an expense name."
    try:
        amount = float(d.get("amount"))
    except (TypeError, ValueError):
        return None, "Amount must be a number."
    if amount <= 0:
        return None, "Amount must be more than 0."
    day = d.get("date") or ""
    try:
        date.fromisoformat(day)
    except ValueError:
        return None, "Please pick a valid date."
    cat = d.get("category") if d.get("category") in CATEGORIES else "Other"
    return (name, round(amount, 2), cat, day), None


def get_budget():
    row = db().execute("SELECT value FROM settings WHERE key='budget'").fetchone()
    return float(row["value"]) if row else 0


@app.route("/")
def home():
    return render_template("index.html", categories=CATEGORIES)


@app.get("/api/expenses")
def list_expenses():
    q, cat, month = request.args.get("q", ""), request.args.get("category", ""), request.args.get("month", "")
    sql, args = "SELECT * FROM expenses WHERE name LIKE ?", [f"%{q}%"]
    if cat:
        sql += " AND category=?"; args.append(cat)
    if month:
        sql += " AND substr(date,1,7)=?"; args.append(month)
    sql += " ORDER BY " + SORTS.get(request.args.get("sort"), SORTS["date_desc"])
    rows = [dict(r) for r in db().execute(sql, args)]
    this_month = date.today().isoformat()[:7]
    spent = db().execute("SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE substr(date,1,7)=?",
                         (this_month,)).fetchone()["s"]
    return jsonify(expenses=rows, budget=get_budget(), month_spent=spent)


@app.post("/api/expenses")
def add_expense():
    vals, err = validate(request.get_json() or {})
    if err:
        return jsonify(error=err), 400
    db().execute("INSERT INTO expenses(name,amount,category,date) VALUES(?,?,?,?)", vals)
    db().commit()
    return jsonify(ok=True), 201


@app.put("/api/expenses/<int:eid>")
def edit_expense(eid):
    vals, err = validate(request.get_json() or {})
    if err:
        return jsonify(error=err), 400
    db().execute("UPDATE expenses SET name=?,amount=?,category=?,date=? WHERE id=?", vals + (eid,))
    db().commit()
    return jsonify(ok=True)


@app.delete("/api/expenses/<int:eid>")
def delete_expense(eid):
    db().execute("DELETE FROM expenses WHERE id=?", (eid,))
    db().commit()
    return jsonify(ok=True)


@app.post("/api/budget")
def set_budget():
    try:
        value = max(0.0, float((request.get_json() or {}).get("budget", 0)))
    except (TypeError, ValueError):
        return jsonify(error="Budget must be a number."), 400
    db().execute("INSERT OR REPLACE INTO settings VALUES('budget',?)", (str(value),))
    db().commit()
    return jsonify(ok=True)


@app.get("/export.csv")
def export_csv():
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Expense", "Amount", "Category", "Date"])
    for r in db().execute("SELECT name,amount,category,date FROM expenses ORDER BY date"):
        w.writerow(list(r))
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=expenses.csv"})


init_db()
if __name__ == "__main__":
    app.run(debug=True)
