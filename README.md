# PulseCheck — API Performance Monitor

A beginner-friendly API monitoring dashboard built with Python, Flask, Requests, SQLite, HTML, CSS, and JavaScript.

## Features
- Manually check an HTTP/HTTPS API endpoint.
- Measure request duration in milliseconds.
- Record HTTP status codes and connection errors.
- Store check history locally in SQLite.
- View total checks, success rate, failed checks, and average response time.
- Visualize recent response times in a chart.
- Clear saved history.

## Requirements
- Python 3.10 or newer
- Internet access to check public APIs and load Chart.js

## Run locally
Open a terminal in this folder:
```bash
python -m pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000 in your browser.

## Test examples
- `https://jsonplaceholder.typicode.com/posts/1` — normally HTTP 200.
- `https://httpbin.org/status/500` — HTTP 500 for error tracking.
Public services may be unavailable or rate-limited.

## API endpoints
- `GET /` — dashboard
- `POST /api/check` — check URL; JSON body: `{"url":"https://example.com"}`
- `GET /api/history` — recent checks
- `GET /api/summary` — aggregate metrics
- `POST /api/history/clear` — clear saved history

## How it works
1. The browser sends the entered URL to Flask.
2. Requests makes an HTTP GET request; Python measures elapsed time.
3. SQLite saves the URL, timestamp, status, response time, and error details.
4. The dashboard fetches history and summary data and updates the metrics and chart.

## Limitations and safety
Educational local demo, not a production monitoring service. Checks are manual, not scheduled. Check only endpoints you are authorized to access. Do not expose Flask's development server publicly. Production use needs stronger URL/SSRF protections, authentication, rate limits, background scheduling, and a production WSGI server.

## Screenshots
Add your own screenshots after running and testing the app.
