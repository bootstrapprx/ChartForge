# ChartForge

ChartForge is a full-stack web application designed to streamline the management and mapping of charts of accounts. It features a modern React frontend and a powerful FastAPI backend, providing a seamless experience for uploading, analyzing, and synchronizing financial data.

## ✨ Features

- **Intuitive Frontend:** A responsive and user-friendly interface built with Next.js (React) and Tailwind CSS.
- **Powerful Backend:** A robust REST API built with FastAPI and Python.
- **Database Integration:** Uses PostgreSQL with SQLAlchemy for reliable data storage.
- **AI-Powered Organization:**
    - **Local AI:** Uses Ollama for local, private accounting classification.
    - **Cloud AI:** Supports Cloudflare Workers AI for edge-based inference.
- **Dynamic Settings:** Manage API keys and integrations directly from the UI.
- **Excel Upload & Parsing:** Easily upload chart of accounts files in `.xlsx` or `.xls` format, parsed with Pandas.
- **Automatic Mapping Engine:** A smart mapping engine using fuzzy logic (`difflib`) to automatically suggest or map company accounts to a master chart.
- **QuickBooks Integration:** OAuth2-based integration to connect with QuickBooks Online for account synchronization.
- **Containerized Environment:** Full Docker and Docker Compose setup for easy development and deployment.
- **UCID Generation:** Automatic generation of Unique Company IDs (UCID) using a standardized normalization and hashing protocol.

## 📂 Project Structure

The project is organized into two main directories: `frontend` and `backend`.

```
/
├── backend/         # FastAPI application
│   ├── app/
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/        # React application
│   ├── src/
│   └── package.json
├── nginx.conf       # Production reverse proxy config
├── docker-compose.prod.yml # Production orchestration
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.11
- **Database:** PostgreSQL (Local or Supabase)
- **ORM:** SQLAlchemy
- **AI:** Ollama (Local) or Cloudflare Workers AI (Cloud)
- **Containerization:** Docker, Docker Compose

### Frontend
- **Framework:** Next.js (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **API Communication:** Axios
- **State Management:** TanStack Query (React Query v5)

## 🚀 Getting Started

### 1. Unified Development Mode (Recommended)

The easiest way to run the entire stack (Frontend + Backend + DB + AI) locally.

```bash
# From the root directory
make dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Ollama: `http://localhost:11434`

### 2. Production Deployment (Docker)

Deploy the full stack using Docker Compose with Nginx as a reverse proxy.

1.  Configure environment:
    ```bash
    cp .env.prod.example .env
    # Edit .env with secure passwords and domain
    ```
2.  Run production stack:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```
- Access via `http://yourdomain.com` (or `http://localhost`).

### 3. Cloudflare Deployment (Edge)

- **Frontend**: Deploy to Cloudflare Pages using `frontend/wrangler.toml`.
- **Backend**: Deploy to Cloudflare Workers using `backend/wrangler.toml` (Note: Requires external DB/AI).

### 4. Real-Time Preview (Contractor Mode)

Share your local development environment with external collaborators.

1.  **Database**: Connect to a cloud database (e.g., Supabase).
2.  **AI**: Switch to Cloudflare Workers AI in Settings.
3.  **Tunnel**: Expose your local ports using Cloudflare Tunnel.
    ```bash
    cloudflared tunnel --url http://localhost:5173
    ```

## ⚙️ Configuration

Navigate to the **Settings** page in the application to configure:
- **AI Provider**: Switch between Ollama (Local) and Cloudflare Workers AI.
- **Cloudflare Credentials**: Account ID and API Token.
- **QuickBooks Online**: Client ID and Secret.

## 🧰 Supabase (DB + Auth)

ChartForge now supports Supabase for both Postgres and authentication. The schema is managed with Supabase CLI migrations.

See `docs/supabase_migration.md` for the step-by-step setup.

## 📝 API Endpoints

The backend exposes a RESTful API under the `/api/v1` prefix.
- `/health`: Health check.
- `/companies`: Company management.
- `/masterchart`: Master chart management.
- `/organizer`: AI classification.
- `/settings`: System configuration.
- `/quickbooks`: QBO integration.

## 🆔 UCID Generation Protocol

ChartForge uses a deterministic algorithm to generate a 4-character Unique Company ID (UCID) for every registered company.

1.  **Normalization**:
    *   Convert to uppercase.
    *   Remove common suffixes (e.g., INC, LLC, LTD, GMBH).
    *   Remove all non-alphanumeric characters.
2.  **Hashing**:
    *   Compute SHA-256 hash of the normalized string.
3.  **Truncation**:
    *   Take the first 4 characters of the hexadecimal hash.

This ensures that "Acme Corp", "Acme, Inc.", and "ACME" all resolve to the same UCID, preventing duplicate entities.

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
