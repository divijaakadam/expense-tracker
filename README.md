# Personal Expense Tracker (Flask + SQLite)

A simple expense tracker website with a real SQL database. Add, edit, delete, search and filter expenses, see charts, set a monthly budget, export to CSV, and switch to dark mode.

## Run it
1. Install Python 3.9+ and open a terminal in this folder.
2. `pip install -r requirements.txt`
3. `python app.py`
4. Open http://127.0.0.1:5000

The charts load Chart.js from a CDN, so you need an internet connection for them. Everything else works offline.

## Database
SQLite is built into Python, so there is nothing extra to install.

| File | Purpose |
|------|---------|
| `expenses.db` | The actual database, with 6 sample expenses and a 5000 budget |
| `database_schema.sql` | SQL for the two tables, `expenses` and `settings` |

If `expenses.db` is deleted, `python app.py` recreates the empty tables automatically.
Every Add, Edit and Delete in the website runs a real `INSERT`, `UPDATE` or `DELETE` in `app.py`.

## Project structure
```
expense-tracker/
├── app.py                 Flask server and all database code
├── expenses.db            SQLite database
├── database_schema.sql    Table definitions
├── requirements.txt
├── templates/index.html   The page
└── static/
    ├── style.css          Look, including dark mode
    └── script.js          Calls the server with fetch(), draws table and charts
```

## Push to GitHub
Create an empty repository on github.com first, then in this folder:
```
git init
git add .
git commit -m "Add expense tracker with SQLite database"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## Put it online (free)
GitHub Pages cannot run Python. Use PythonAnywhere or Render: upload this folder and point the web app to `app.py` (the `app` object).
On free hosts, SQLite data may reset; for lasting data, use a host with a persistent disk.
