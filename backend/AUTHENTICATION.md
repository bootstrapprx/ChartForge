# User Authentication & Access Control System

> **Note:** ChartForge now uses **Supabase Auth**. This document describes the legacy JWT flow and access control patterns. The backend now expects Supabase JWTs and exposes `GET /api/v1/auth/me` for profile access. The access control and company membership concepts below still apply.

This document describes the user authentication system and company-based access control implemented in ChartForge.

## Overview

The system provides:
- User registration and authentication (JWT-based)
- Shared database for all users
- Company-based access control (users only see companies they're assigned to)
- Admin users have full access to all companies
- Regular users only have access to companies they're part of

## Architecture

### Components

1. **User Model** (`app/db/models/user.py`)
   - Stores user authentication information
   - Email, hashed password, active status, superuser flag
   - Methods: `has_access_to_company()`, `get_company_ids()`

2. **UserCompany Model** (`app/db/models/user_company.py`)
   - Many-to-many relationship between users and companies
   - Stores permissions: `is_admin`, `can_edit`, `can_view`
   - Links users to companies they have access to

3. **Authentication Routes** (`app/api/v1/auth.py`)
   - `/api/v1/auth/register` - Register new user
   - `/api/v1/auth/login` - Login (OAuth2 form)
   - `/api/v1/auth/login-json` - Login (JSON body)
   - `/api/v1/auth/me` - Get current user info

4. **Access Control Dependencies** (`app/api/deps.py`)
   - `get_user_companies()` - Get list of company IDs user can access
   - `check_company_access()` - Verify user has access to a company
   - `check_company_admin()` - Verify user is admin of a company

## Usage

### 1. Register a New User

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### 2. Login

```bash
POST /api/v1/auth/login-json
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Using Access Control in Routes

#### Filter companies by user access:

```python
from app.api.deps import get_user_companies, get_current_user
from fastapi import Depends
from sqlalchemy.orm import Session

@router.get("/companies")
def get_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_ids = get_user_companies(current_user, db)
    companies = db.query(Company).filter(Company.id.in_(company_ids)).all()
    return companies
```

#### Check access to specific company:

```python
from app.api.deps import check_company_access

@router.get("/companies/{company_id}")
def get_company(
    company: Company = Depends(check_company_access)
):
    # company is guaranteed to be accessible by current user
    return company
```

#### Require admin access:

```python
from app.api.deps import check_company_admin

@router.delete("/companies/{company_id}")
def delete_company(
    company: Company = Depends(check_company_admin)
):
    # Only admins can delete
    db.delete(company)
    db.commit()
```

## Access Control Rules

1. **Superusers** (`is_superuser=True`):
   - Have access to ALL companies
   - Can perform any action on any company
   - Bypass all access checks

2. **Regular Users**:
   - Only see companies they're assigned to (via `UserCompany` table)
   - Permissions are controlled by:
     - `is_admin`: Can manage company settings
     - `can_edit`: Can modify company data
     - `can_view`: Can view company data

3. **Company Access**:
   - Users must be explicitly assigned to companies
   - Assignment is done through the `UserCompany` relationship
   - Multiple users can be assigned to the same company

## Frontend Integration

### Authentication Context

The frontend uses `AuthContext` to manage authentication state:

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, login, logout, isAuthenticated } = useAuth();
```

### Protected Routes

Routes are protected using the `ProtectedRoute` component:

```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### API Client

The API client automatically includes the authentication token in requests:

```typescript
// Token is automatically added from localStorage
api.get('/companies'); // Includes Authorization header
```

## Security Features

1. **Password Hashing**: Uses bcrypt for password hashing
2. **JWT Tokens**: Secure token-based authentication (24-hour expiration)
3. **Access Control**: Row-level security based on user-company relationships
4. **Superuser Privileges**: Admin users have full system access

## Database Schema

- `users`: User accounts with authentication info
- `companies`: Company records
- `user_companies`: Junction table linking users to companies with permissions
  - `user_id`: Foreign key to users
  - `company_id`: Foreign key to companies
  - `is_admin`: Boolean for admin privileges
  - `can_edit`: Boolean for edit permissions
  - `can_view`: Boolean for view permissions

## Next Steps

To assign users to companies, you'll need to:
1. Create an admin endpoint to manage user-company assignments
2. Or manually insert records into the `user_companies` table
3. Use the access control dependencies in your routes to filter data
