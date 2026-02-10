# ChartForge Project Overview

This document provides a comprehensive overview of the ChartForge project, intended as a technical context for AI-driven development tasks.

## 1. Project Summary

ChartForge is a full-stack web application designed for managing and mapping Charts of Accounts (COA). It allows users to upload their COA, map it to a master chart, and integrate with financial software like QuickBooks. The system features a sophisticated backend with a newly added AI-powered "Organizer" module for intelligent classification of accounting descriptions.

- **Frontend:** A modern, responsive UI built with **React**, **Vite**, **TypeScript**, and styled with **Tailwind CSS** and **shadcn/ui**.
- **Backend:** A robust API built with **Python**, **FastAPI**, and **SQLAlchemy** for the ORM.
- **Database:** **PostgreSQL**, managed via SQLAlchemy models.
- **AI Features:** An "Organizer AI" module uses a local **Ollama** model for classifying accounting data, featuring a learning engine that improves through user feedback.
- **Containerization:** The entire backend and database stack is containerized with **Docker** and **Docker Compose** for easy setup and consistent development environments.

## 2. Key Technologies

| Area      | Technology                                                              |
| :-------- | :---------------------------------------------------------------------- |
| **Frontend**  | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router |
| **Backend**   | FastAPI, Python, Uvicorn, SQLAlchemy, Pydantic, Pandas, Alembic         |
| **Database**  | PostgreSQL                                                              |
| **AI**        | Ollama, httpx, python-thefuzz                                           |
| **DevOps**    | Docker, Docker Compose                                                  |
| **Auth**      | python-jose, passlib, requests-oauthlib (for QBO)                       |

## 3. How to Build and Run (Unified Dev Mode)

The project now supports a "Unified Dev Mode" for streamlined development. This mode runs the frontend on the host machine with hot-reloading, while the backend, PostgreSQL, and Ollama run in Docker containers.

### Prerequisites

*   **Docker**: Ensure Docker Desktop or Docker Engine is installed and running.
*   **`make`**: A build automation tool, commonly available on Unix-like systems.
*   **`npm`**: Node Package Manager, typically installed with Node.js.
*   **Frontend Dependencies**: Install Node.js dependencies in the `frontend` directory.
    ```bash
    cd frontend
    npm install
    ```

### Starting the Development Environment

From the project root directory, run the unified development command:

```bash
make dev
```

Alternatively, you can use the `npm` script:

```bash
npm run dev
```

This command will:
*   Start the Backend, Frontend, PostgreSQL, and Ollama Docker containers in the background.
*   The Backend container mounts the local code for hot-reloading.
*   The Frontend container mounts the local code for hot-reloading and is accessible at `http://localhost:5173`.

### Accessing Services

*   **Frontend**: `http://localhost:5173`
*   **Backend API**: `http://localhost:8000`
*   **Ollama API**: `http://localhost:11434`
*   **PostgreSQL**: Connect using a database client on `localhost:5432`.

### Managing Development Services

The `Makefile` provides additional commands for managing the development environment:

*   `make stop`: Stops all running development services (Docker containers, backend, and frontend processes).
*   `make reset-db`: Stops and removes the PostgreSQL container, then restarts it, effectively resetting the development database.
*   `make logs`: Follows the logs of the Docker services (PostgreSQL and Ollama).

## 4. Development Conventions

-   **Modular Structure:** The backend is organized by features, with API endpoints, services, schemas, and database models separated into distinct modules (e.g., `companies`, `masterchart`, `organizer_ai`).
-   **Database Migrations:** Schema changes are managed via Supabase CLI migrations (`supabase/migrations/*`). The backend no longer auto-creates tables on startup.
-   **Type Hinting:** The Python backend and TypeScript frontend make extensive use of type hints for better code quality and maintainability.
-   **Dependency Management:** Backend dependencies are managed with `pip` and `requirements.txt`. Frontend dependencies are managed with `npm` and `package.json`.
-   **Configuration:** Both frontend and backend use `.env` files for environment-specific configuration.
-   **API Versioning:** The API is versioned under the `/api/v1` prefix.
-   **UI Components:** The frontend heavily utilizes `shadcn/ui`, which is a collection of reusable UI components built on Radix UI and Tailwind CSS. When adding new UI, prefer composing existing `shadcn/ui` components.

## 5. Backend Modules Overview

### 5.1. Organizer AI Module

This module provides intelligent classification of accounting descriptions using a local Ollama model and a learning engine.

-   **Location:** `backend/app/services/organizer_ai/`
-   **Key Components:**
    -   `model.py`: Handles interaction with the Ollama LLM.
    -   `prompts.py`: Defines the system and few-shot prompts for the LLM.
    -   `classifier.py`: Orchestrates the classification process using static rules, memory, and LLM inference.
    -   `memory.py`: Manages a database-backed memory of confirmed classifications for continuous learning.
    -   `learning_rules.py`: Generates and applies dynamic rules based on user feedback.
    -   `feedback.py`: Processes user confirmations and rejections of classifications.
    -   `router.py`: Exposes API endpoints for classification, ingestion, and feedback.
-   **Database Models:** `OrganizerMemory`, `OrganizerRule` (in `app/db/models/`).
-   **Environment Variables:** `ORGANIZER_MODEL_NAME`, `OLLAMA_BASE_URL`, `ORGANIZER_MAX_FEWSHOT`.

### 5.2. Automatic Code Generator Module

This module provides an enterprise-grade system for automatically generating hierarchical Master Chart of Accounts codes.

-   **Location:** `backend/app/services/code_generator/`
-   **Key Components:**
    -   `patterns.py`: Defines the `CodePattern` class for parsing and validating code structures (e.g., "X.XX.XX").
    -   `validator.py`: Validates code structure and detects conflicts with existing accounts.
    -   `generator.py`: The core logic for generating the next available root or child codes based on the active pattern and existing hierarchy.
    -   `exceptions.py`: Custom exceptions for robust error handling within the module.
    -   `router.py`: Exposes API endpoints for generating and validating codes.
-   **Integration:** Integrated with `masterchart_service.py` to auto-generate codes when creating new accounts.
-   **Environment Variables:** `CODE_PATTERN`, `CODE_SEPARATOR`, `CODE_SEGMENT_PAD`, `CODE_MAX_LEVEL`.

### 5.3. Master Chart Dashboard

This module provides a comprehensive visual interface for managing the Master Chart of Accounts and the default US-GAAP template.

-   **Location:** `frontend/src/pages/masterchart/`
-   **Key Features:**
    -   **Dual Mode:** Toggle between viewing the "Default Template" (read-only reference) and the "Database" (active master chart).
    -   **Visualizations:**
        -   **Summary Cards:** High-level metrics (Total Accounts, Orphans, Categories, etc.).
        -   **Tree View:** Collapsible, hierarchical representation of the account structure.
        -   **Card View:** Grid of account cards with key details and quick actions.
    -   **Search & Filter:** Real-time fuzzy search with filters for Category, Type, Normal Balance, and Tags.
    -   **Dexter AI Integration:**
        -   **Insights:** Automated analysis of structural issues and anomalies.
        -   **Account Explanation:** AI-generated explanations of account purpose and usage.
        -   **Similarity Search:** Find semantically similar accounts.
    -   **Template Management:** One-click application of the default template to new companies.
