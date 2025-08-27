
# Recipes App — Setup & Run Guide

A minimal stack to parse a JSON of recipes, store in PostgreSQL, expose REST APIs, and render a small React UI with filters, pagination, and a details drawer.

## Repo Layout

```
server/           # Node.js + Express + TypeScript API
  src/
  scripts/
  sql/
  .env.example
  package.json
frontend/         # React + Vite + TypeScript UI
  src/
  .env.example
  package.json
data/
  recipes.json    # <-- put your JSON array here (see format below)
```

---

## Prerequisites

* Node.js ≥ 18
* PostgreSQL ≥ 13 (local or remote)
* (Optional) psql CLI (for running schema SQL & enabling extensions)

---

## 1) Backend (API)

### 1.1 Configure environment

```bash
cd server
cp .env.example .env
# open .env and set your real DB creds and server port if needed
# PGHOST=localhost
# PGPORT=5432
# PGDATABASE=recipes_db
# PGUSER=postgres
# PGPASSWORD=postgres
# PORT=3001
```

### 1.2 Install dependencies

```bash
npm i
```

### 1.3 Create database (if not existing)

**Option A: psql (local)**

```bash
# create the database if it doesn't exist
createdb -h $PGHOST -p $PGPORT -U $PGUSER $PGDATABASE || true
```

**Option B: PostgreSQL Docker (alternative)**

```bash
docker run --name recipes-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
# then set PG* in server/.env accordingly (PGHOST=localhost, PGPORT=5432, etc.)
```

### 1.4 Apply schema

```bash
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f sql/schema.sql
```

> 🔎 **Optional (recommended):** enable trigram index support once per DB (speeds up partial title search).

```bash
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### 1.5 Add data file

Place your JSON array at:

```
/data/recipes.json
```

**Expected sample shape (array of records):**

```json
[
  {
    "Contient": "North America",
    "Country_State": "US",
    "cuisine": "Southern Recipes",
    "title": "Sweet Potato Pie",
    "URL": "https://www.allrecipes.com/recipe/12142/sweet-potato-pie-i/",
    "rating": 4.8,
    "total_time": 115,
    "prep_time": 15,
    "cook_time": 100,
    "description": "Shared from a Southern recipe...",
    "ingredients": ["..."],
    "instructions": ["..."],
    "nutrients": {
      "calories": "389 kcal",
      "carbohydrateContent": "48 g",
      "cholesterolContent": "78 mg",
      "fiberContent": "3 g",
      "proteinContent": "5 g",
      "saturatedFatContent": "10 g",
      "sodiumContent": "254 mg",
      "sugarContent": "28 g",
      "fatContent": "21 g"
    },
    "serves": "8 servings"
  }
]
```

### 1.6 Seed the database

Parses the JSON, converts `NaN`/invalid numeric values to `NULL`, and inserts.

```bash
npm run seed
# output: "Imported X recipes"
```

### 1.7 Run the API

```bash
npm run dev
# API listening on http://localhost:3001
```

**Health check**

```
GET http://localhost:3001/health
→ { "ok": true }
```

---

## 2) Frontend (UI)

### 2.1 Configure environment

```bash
cd ../frontend
cp .env.example .env
# VITE_API_BASE=http://localhost:3001
```

### 2.2 Install & run

```bash
npm i
npm run dev
# UI runs at http://localhost:5173
```

---

## 3) API Reference

### 3.1 Get all recipes (paginated + sorted by rating desc)

```
GET /api/recipes?page=1&limit=10
```

* `page` (default 1), `limit` (default 10, max 100)
* Sort: `rating DESC NULLS LAST, id ASC`

**cURL**

```bash
curl "http://localhost:3001/api/recipes?page=1&limit=10"
```

**Response**

```json
{
  "page": 1,
  "limit": 10,
  "total": 50,
  "data": [
    {
      "id": 1,
      "title": "Sweet Potato Pie",
      "cuisine": "Southern Recipes",
      "rating": 4.8,
      "prep_time": 15,
      "cook_time": 100,
      "total_time": 115,
      "description": "Shared from a Southern recipe...",
      "nutrients": { "calories": "389 kcal", "...": "..." },
      "serves": "8 servings"
    }
  ]
}
```

### 3.2 Search recipes (field-level filters)

```
GET /api/recipes/search?calories=<=400&title=pie&rating=>=4.5
```

**Supported query params**

* `title` — partial match (case-insensitive)
* `cuisine` — exact match
* `rating` — comparison filter (`=`, `>=`, `<=`, `<`, `>`, e.g. `>=4.5`)
* `total_time` — comparison filter (e.g. `<=30`)
* `calories` — comparison filter on the number extracted from `nutrients.calories` (e.g. `<=400`)

**Examples**

```bash
# Page listing
curl "http://localhost:3001/api/recipes?page=1&limit=10"

# Title contains "pie"
curl "http://localhost:3001/api/recipes/search?title=pie"

# Cuisine & min rating
curl "http://localhost:3001/api/recipes/search?cuisine=Southern%20Recipes&rating=>=4.5"

# Total time <= 30 min
curl "http://localhost:3001/api/recipes/search?total_time=<=30"

# Calories <= 400, title contains "pie", rating >= 4.5
curl "http://localhost:3001/api/recipes/search?calories=<=400&title=pie&rating=>=4.5"
```

---

## 4) Frontend Features

* Table columns: **Title** (truncated), **Cuisine**, **Rating** (stars), **Total Time**, **Serves**
* Click row → right-side **drawer**:

  * Header shows **Title** + **Cuisine**
  * Key/Value: **Description**
  * Key/Value: **Total Time** with expandable **Prep Time** & **Cook Time**
  * **Nutrition** section as small table (calories, carbs, cholesterol, fiber, protein, saturated fat, sodium, sugar, fat if present)
* **Filters** (top bar) map to `/search` API:

  * Title (partial), Cuisine (exact), Rating (e.g. `>=4.5`), Total Time (e.g. `<=30`), Calories (e.g. `<=400`)
* **Pagination** (when not filtering): page size selectable **15–50**
* **Empty states**:

  * No filters + no rows → “No data available.”
  * Filters + no matches → “No results found for given filters.”

---

## 5) Data Handling Notes

* **NaN / invalid numbers** in `rating`, `prep_time`, `cook_time`, `total_time` are stored as `NULL`.
* **Calories filter** parses numeric value from strings like `"389 kcal"` during query.
* To speed calorie filtering further for huge datasets, you can store a numeric `calories` column at import time and index it.

---

## 6) Common Issues & Fixes

* **CORS errors from UI → API**
  Ensure API is running on the port in `VITE_API_BASE` and that the backend uses `cors()` middleware (already enabled).

* **`psql: command not found`**
  Install PostgreSQL client tools or use Docker.

* **`permission denied for extension pg_trgm`**
  Connect as a superuser (e.g., `postgres`) or ask your DB admin to run:

  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  ```

* **Seeding fails / file not found**
  Confirm your data file path is `data/recipes.json` (from repo root) and contains a **JSON array**.

* **Windows PowerShell quoting**
  Use double quotes in curl:

  ```powershell
  curl "http://localhost:3001/api/recipes?page=1&limit=10"
  ```

---

## 7) Scripts (for reference)

**Backend**

```bash
# from /server
npm run dev     # start API in watch mode
npm run seed    # import data from ../data/recipes.json
npm run build   # compile TS -> dist/
npm start       # run compiled server (after build)
```

**Frontend**

```bash
# from /frontend
npm run dev     # start Vite dev server
npm run build   # production build
npm run preview # preview build locally
```

---

## 8) Quick Test Checklist

1. **API up**

   * Open `http://localhost:3001/health` → `{ ok: true }`
   * Open `http://localhost:3001/api/recipes?page=1&limit=10` → JSON list

2. **UI up**

   * Open `http://localhost:5173`
   * See table rows; click a row → drawer opens
   * Try filters (e.g., Title: `pie`, Rating: `>=4.5`) → results narrow
   * Change page size (e.g., 30 / page) → table updates
