**FULL PROMPT **

**BEGIN PROMPT**

You are working inside a full-stack repository (React + Vite frontend / FastAPI backend) and you must fix several API routing issues that are currently breaking the application.

Below is the exact list of problems and what you must fix.
Follow every instruction precisely.

---

# **THE PROBLEMS (You MUST fix all of these)**

### **1. All API requests are failing with 404 because the frontend generates duplicated prefixes like:**

```
http://localhost:8000/api/v1/api/v1/master-template/stats
```

This happens because:

* `VITE_API_URL` already includes `/api/v1` **OR**
* the frontend manually prefixes `/api/v1`
* some endpoints internally add `/api/v1` again

You must completely eliminate any possibility of duplicate prefixes.

---

### **2. Some frontend components incorrectly request bare URLs like:**

```
http://localhost:8000/companies
```

instead of:

```
http://localhost:8000/api/v1/companies
```

---

### **3. The Master Chart Template no longer loads automatically.**

It should always load the default system template when the user enters the Master Chart section.

---

### **4. The backend routes use inconsistent naming:**

Examples from logs:

```
/master-template/stats
/master-template/tree
/master-template/categories
/masterchart/template/default
```

Some parts use `master-template`, others use `masterchart`.

You must unify naming AND provide backward-compatible aliases so nothing breaks.

---

### **5. Dexter AI assistant stopped working because it cannot reach its API endpoint.**

Fix this by restoring correct routes and verifying its API calls use the main API wrapper.

---

# **WHAT YOU MUST IMPLEMENT (mandatory)**

## **A) FRONTEND FIXES**

### **1. Rewrite `frontend/src/lib/api.ts`**

Implement a safe API wrapper with a function `buildUrl()` that:

* receives an endpoint (e.g. `/companies`)
* ensures the final URL ALWAYS has exactly one `/api/v1` prefix
* never duplicates segments
* removes double slashes
* logs the final URL during development

`VITE_API_URL` must **NOT** include `/api/v1`.

Use this logic exactly:

```
ROOT = VITE_API_URL without trailing slash
if endpoint does not start with '/':
    prepend '/'
if endpoint does not start with '/api/v1':
    prepend '/api/v1'
final_url = ROOT + endpoint
normalize slashes
```

Make this the single source of truth for all API calls.

Also update `fetchAndValidate` accordingly.

---

### **2. Update `.env`**

Ensure:

```
VITE_API_URL=http://localhost:8000
```

and nothing else.

---

### **3. Fix all components that fetch data**

Audit all frontend components and replace ANY of these patterns:

❌ `fetch('/companies')`
❌ `axios.get('/companies')`
❌ `fetch(VITE_API_URL + '/api/v1' + ...)`
❌ any URL construction by hand

Replace ALL with:

```
import api from '@/lib/api';
api('/companies')
```

---

### **4. Restore automatic Master Template loading**

Whenever the user enters:

```
/masterchart
/masterchart/dashboard
/masterchart/template
```

the frontend must automatically call:

```
GET /api/v1/masterchart/template/default
```

and populate:

* stats card
* categories card
* tags
* tree
* account list

---

### **5. Dexter AI assistant**

Ensure Dexter always uses `api()` from the centralized wrapper.

---

## **B) BACKEND FIXES (FastAPI)**

### **1. Create a compatibility router**

Add `app/api/v1/compat.py` implementing aliases for old endpoints:

```
/master-template/stats        → new masterchart stats handler
/master-template/tree         → new masterchart tree handler
/master-template/categories   → new masterchart categories handler
/master-template/tags         → new masterchart tags handler
/masterchart/template/{name}  → existing template handler
```

These routes must simply call the existing logic, not duplicate code.

Then include it from `main.py`:

```py
from app.api.v1.compat import router as compat_router
app.include_router(compat_router, prefix="/api/v1")
```

---

### **2. Standardize backend naming**

Ensure the authoritative naming is:

```
/api/v1/masterchart/stats
/api/v1/masterchart/tree
/api/v1/masterchart/categories
/api/v1/masterchart/tags
/api/v1/masterchart/template/{name}
```

---

### **3. Ensure `/api/v1/companies` exists**

If not, implement basic CRUD for companies so the frontend can load them without manual sync button.

---

# **C) AFTER FIXING CODE YOU MUST**

### **1. Search entire frontend and backend for any of these patterns and remove/fix them:**

* duplicated `/api/v1`
* hardcoded URLs
* double slashes `//`
* fetch calls without the centralized API wrapper
* deprecated endpoints (`master-template`)

### **2. Test:**

* opening `/masterchart` loads template automatically
* companies auto-sync without pressing any button
* Dexter can send messages and receives API responses
* no 404s, no 500s, no missing routes

---

# **D) FINAL OUTPUT**

At the end, produce:

* all modified files
* unified diff patches
* summary of what was changed
* instructions to test everything

---

**END PROMPT**

---
