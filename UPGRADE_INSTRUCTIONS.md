# ChartForge Upgrade Instructions

This document outlines the changes made as part of the comprehensive upgrade based on the `gemini.prompt` requirements.

## Overview of Changes

### Backend Upgrades

#### 1. MasterAccount Model (Already Updated)
- All enriched fields from `standard_chart.csv` are now supported:
  - Core: `code`, `description`, `long_description`, `type`, `category`, `fs_mapping`, `parent_code`, `normal_balance`
  - AI-related: `tags`, `default_vendors`
  - Compliance: `regulatory_mapping`
  - Lifecycle: `start_date`, `end_date`, `notes`
  - Extended: `subcategory`, `cash_flow_classification`, `cost_center`, `gaap_classification`, `detailed_description`

#### 2. Import Engine (`app/services/import_engine.py`)
New import functionality supporting:
- **Simulation Mode**: Preview imports without making changes
- **Duplicate Detection**: Identifies existing accounts
- **Structural Corrections**: Auto-corrects parent codes and types
- **Missing-field Filling**: Enriches from master template
- **Parent-child Reconciliation**: Validates hierarchy

#### 3. Master Template Service (`app/services/master_template_service.py`)
- Loads `standard_chart.csv` at startup
- Singleton pattern for performance
- Search and filter capabilities
- Autofill suggestions by category

#### 4. COA Versioning (`app/services/coa_version_service.py`)
- Complete version snapshot management
- Restore to previous versions
- Compare versions
- Track import history

#### 5. Enhanced Dexter AI (`app/services/dexter/`)
New endpoints:
- `/api/v1/ai/explain-account/{code}` - Detailed account explanation
- `/api/v1/ai/report/{report_type}` - Generate reports
- `/api/v1/ai/insights` - AI-generated insights about COA
- `/api/v1/ai/health` - Service health check

### Frontend Upgrades

#### 1. CreateAccountModal (`components/masterchart/CreateAccountModal.tsx`)
- All enriched fields with tabbed interface
- AI suggestions while typing
- Autofill from template
- Tag and vendor management
- Real-time validation

#### 2. CompanyModal (`components/companies/CompanyModal.tsx`)
- Popup modal instead of inline form
- Activate/Inactivate functionality
- Name confirmation required for status changes
- UCID display after creation

#### 3. DefaultTemplatePage (`pages/template/DefaultTemplatePage.tsx`)
- Tree view and table view toggle
- Filters by category, type, tag, vendor
- Parent-child structure preview
- Apply Template to Company button
- Statistics dashboard

#### 4. ImportEnginePage (`pages/import/ImportEnginePage.tsx`)
- Drag & drop CSV upload
- Preview with corrections
- Accept/reject individual items
- Options for enrichment and versioning
- Progress tracking

## Database Migration

Run the following migration if not already applied:

```bash
# Using psql
psql -U your_user -d your_database -f backend/migration_v5_enriched_coa.sql

# Or using the migration script
cd backend
python scripts/run_migration.py migration_v5_enriched_coa.sql
```

## New API Endpoints

### Master Template API (`/api/v1/master-template`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get template accounts with filters |
| GET | `/tree` | Get template as hierarchical tree |
| GET | `/stats` | Get template statistics |
| GET | `/categories` | Get all unique categories |
| GET | `/subcategories` | Get all unique subcategories |
| GET | `/tags` | Get all unique tags |
| GET | `/fs-mappings` | Get FS mappings |
| GET | `/account/{code}` | Get specific template account |
| GET | `/by-category/{category}` | Get accounts by category |
| GET | `/by-type/{type}` | Get accounts by type |
| POST | `/apply/{company_ucid}` | Apply template to company |
| GET | `/suggest?query=` | Get account suggestions |
| GET | `/similar/{code}` | Get similar accounts |
| GET | `/autofill/{category}` | Get autofill suggestions |

### Import API (`/api/v1/masterchart/import`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/preview` | Preview import (simulation mode) |
| POST | `/execute` | Execute import with options |

### COA Versions API (`/api/v1/masterchart/versions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/versions` | List all versions |
| GET | `/versions/{id}` | Get version detail |
| POST | `/versions/{id}/restore` | Restore to version |
| POST | `/versions/snapshot` | Create manual snapshot |
| GET | `/versions/{id1}/compare/{id2}` | Compare two versions |
| GET | `/import-history` | Get import history |

### Dexter AI API (`/api/v1/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Chat with Dexter |
| POST | `/ingest` | Ingest data (background) |
| POST | `/suggest-account` | Get account suggestion |
| GET | `/explain-account/{code}` | Explain an account |
| POST | `/report/{type}` | Generate report |
| GET | `/insights` | Get AI insights |
| GET | `/health` | Service health check |

## New Frontend Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/master-template` | DefaultTemplatePage | View/manage default template |
| `/import` | ImportEnginePage | Import CSV with preview |

## Testing the Changes

### 1. Test Master Template API
```bash
# Get template stats
curl http://localhost:8000/api/v1/master-template/stats

# Search template
curl "http://localhost:8000/api/v1/master-template?search=cash&category=Asset"

# Get account suggestions
curl "http://localhost:8000/api/v1/master-template/suggest?query=prepaid"
```

### 2. Test Import Preview
```bash
# Preview import
curl -X POST -F "file=@your_chart.csv" \
  "http://localhost:8000/api/v1/masterchart/import/preview?enrich_from_template=true"
```

### 3. Test Dexter AI
```bash
# Explain an account
curl "http://localhost:8000/api/v1/ai/explain-account/10000"

# Get insights
curl "http://localhost:8000/api/v1/ai/insights?insight_type=all"

# Generate report
curl -X POST "http://localhost:8000/api/v1/ai/report/category_summary"
```

### 4. Test COA Versioning
```bash
# Create snapshot
curl -X POST "http://localhost:8000/api/v1/masterchart/versions/snapshot?description=Manual%20backup"

# List versions
curl "http://localhost:8000/api/v1/masterchart/versions"
```

## Frontend Dependencies

Ensure these packages are installed:
```bash
cd frontend
npm install react-dropzone @tanstack/react-query date-fns
```

## Environment Variables

No new environment variables required. Existing variables:
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)
- `OLLAMA_BASE_URL` - Ollama AI service URL
- `ORGANIZER_MODEL_NAME` - AI model name

## Running the Application

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Notes

1. **Template Loading**: The master template is loaded from `assets/standard_chart.csv` at startup. Ensure this file exists.

2. **AI Features**: Dexter AI features require Ollama to be running with the configured model.

3. **Versioning**: Version snapshots are automatically created during imports. Manual snapshots can be created via API.

4. **Company Inactivation**: Inactivating a company preserves all data but prevents new transactions.

5. **Import Engine**: The preview feature shows exactly what will happen before committing changes.

