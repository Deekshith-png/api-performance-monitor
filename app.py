from datetime import datetime
import sqlite3
import time
from urllib.parse import urlparse
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
DATABASE = "monitor.db"
TIMEOUT_SECONDS = 10

def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection

def init_db():
    with get_db() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL,
            checked_at TEXT NOT NULL, status_code INTEGER,
            response_time_ms REAL, success INTEGER NOT NULL, error TEXT)""")

def validate_url(url):
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)

def run_check(url):
    started = time.perf_counter()
    status_code, error, success = None, None, 0
    try:
        response = requests.get(url, timeout=TIMEOUT_SECONDS,
            headers={"User-Agent": "SimpleAPIPerformanceMonitor/1.0"})
        status_code = response.status_code
        success = int(200 <= status_code < 400)
    except requests.RequestException as exc:
        error = str(exc)[:500]
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    checked_at = datetime.now().astimezone().isoformat(timespec="seconds")
    with get_db() as db:
        cursor = db.execute("""INSERT INTO checks
            (url, checked_at, status_code, response_time_ms, success, error)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (url, checked_at, status_code, elapsed_ms, success, error))
        check_id = cursor.lastrowid
    return {"id": check_id, "url": url, "checked_at": checked_at,
            "status_code": status_code, "response_time_ms": elapsed_ms,
            "success": bool(success), "error": error}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/check", methods=["POST"])
def check_api():
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    if not validate_url(url):
        return jsonify({"error": "Enter a valid URL starting with http:// or https://"}), 400
    return jsonify(run_check(url)), 200

@app.route("/api/history")
def history():
    limit = min(max(request.args.get("limit", default=20, type=int), 1), 100)
    with get_db() as db:
        rows = db.execute("SELECT * FROM checks ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return jsonify([dict(row) for row in rows])

@app.route("/api/summary")
def summary():
    with get_db() as db:
        row = db.execute("""SELECT COUNT(*) AS total_checks,
            COALESCE(SUM(success), 0) AS successful_checks,
            COALESCE(AVG(response_time_ms), 0) AS average_response_ms
            FROM checks""").fetchone()
    total, successes = row["total_checks"], row["successful_checks"]
    return jsonify({"total_checks": total, "successful_checks": successes,
        "failed_checks": total - successes,
        "average_response_ms": round(row["average_response_ms"], 2),
        "success_rate_percent": round(successes / total * 100, 1) if total else 0})

@app.route("/api/history/clear", methods=["POST"])
def clear_history():
    with get_db() as db:
        db.execute("DELETE FROM checks")
    return jsonify({"message": "History cleared"})

init_db()
if __name__ == "__main__":
    app.run(debug=True)
