# ChartForge - Unified Chart of Accounts Management

ChartForge is a web application designed to help businesses centralize, map, and synchronize their financial structures. It provides AI-assisted mapping and seamless integration with QuickBooks Online to reduce manual reconciliation time and improve financial data accuracy.

## Features

- **Unified Master Chart:** Build and maintain a centralized Master Chart of Accounts across all your companies.
- **AI-Powered Mapping:** Intelligent semantic mapping with fuzzy logic to automatically align local accounts.
- **QuickBooks Integration:** Seamless sync with QuickBooks Online via OAuth 2.0 for real-time updates.
- **Coverage Reports:** Visual analytics and heatmaps showing mapping coverage and data quality.
- **Version Control:** Complete audit trail with rollback capabilities for every Chart of Accounts.
- **Unified Financial Statements:** Generate unified Balance Sheets, P&L, and Cash Flow reports from mapped data.

## Technologies Used

This project is built with:

- **Vite:** A next-generation frontend tooling that provides a faster and leaner development experience.
- **React:** A JavaScript library for building user interfaces.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **shadcn/ui:** A collection of re-usable components built using Radix UI and Tailwind CSS.
- **Supabase:** An open-source Firebase alternative for database and authentication.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js and npm installed on your machine. You can use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (Node Version Manager) to manage multiple Node.js versions.

### Installation

1.  **Clone the repo (if you have access)**
    ```sh
    git clone <YOUR_GIT_URL>
    cd chart-forge
    ```
    *If you don't have a git repository, you can skip this step and just work in the current project directory.*

2.  **Install NPM packages**
    ```sh
    npm install
    ```

3.  **Start the development server**
    ```sh
    npm run dev
    ```
    This will start the development server, typically at `http://localhost:5173`.