# Architecture

## System Overview

FinTrack is a finance tracking application with a clear separation between backend API and frontend UI.

```mermaid
graph TB
    subgraph Client
        Browser[Browser]
    end

    subgraph Docker Network
        subgraph Frontend Container
            Vite[Vite Dev Server]
            ReactApp[React SPA]
        end

        subgraph Backend Container
            Uvicorn[Uvicorn ASGI]
            FastAPIApp[FastAPI App]
            Slowapi[Rate Limiter]
            SQLAlchemy[SQLAlchemy ORM]
        end

        subgraph Database Container
            Postgres[(PostgreSQL 15)]
        end
    end

    Browser -->|:5173| Vite
    Vite -->|Proxy /api| Uvicorn
    Uvicorn --> FastAPIApp
    FastAPIApp --> Slowapi
    FastAPIApp --> SQLAlchemy
    SQLAlchemy --> Postgres
```

## Layered Architecture

```mermaid
graph LR
    subgraph Presentation
        Routes[API Routes]
        Pages[React Pages]
    end

    subgraph Business
        Services[Service Layer]
        Stores[Zustand Stores]
    end

    subgraph Data
        Models[SQLAlchemy Models]
        Schemas[Pydantic Schemas]
        DB[(PostgreSQL)]
    end

    subgraph Cross-Cutting
        Auth[Auth Middleware]
        RateLimit[Rate Limiting]
        CORS[CORS]
        Errors[Error Handlers]
    end

    Routes --> Services --> Models --> DB
    Pages --> Stores --> Routes
    Auth -.-> Routes
    RateLimit -.-> Routes
    CORS -.-> Routes
    Errors -.-> Routes
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Router
    participant S as Auth Service
    participant D as Database

    C->>A: POST /auth/register
    A->>S: register_viewer()
    S->>D: INSERT user (role=viewer)
    D-->>S: User
    S-->>A: UserResponse
    A-->>C: 201 Created

    C->>A: POST /auth/login
    A->>S: login()
    S->>D: SELECT user
    D-->>S: User + hashed_password
    S->>S: verify_password()
    S->>S: create_access_token()
    S->>S: create_refresh_token()
    S-->>A: TokenResponse
    A-->>C: {access_token, refresh_token}

    C->>A: GET /auth/me [Bearer token]
    A->>A: decode_token()
    A->>D: SELECT user by id
    D-->>A: User
    A-->>C: UserResponse
```

## Data Model

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar hashed_password
        varchar name
        enum role
        bool is_active
        bool is_deleted
        timestamp created_at
        timestamp updated_at
    }

    RECORDS {
        uuid id PK
        uuid user_id FK
        enum record_type
        varchar category
        decimal amount
        text description
        timestamp recorded_at
        bool is_deleted
        timestamp created_at
        timestamp updated_at
    }

    USERS ||--o{ RECORDS : "has"
```

## Security Layers

```mermaid
graph TB
    subgraph "Layer 1: Transport"
        CORS[CORS Middleware]
    end

    subgraph "Layer 2: Rate Limiting"
        Global[Global: 60/min]
        Auth[Auth: 5-10/min]
    end

    subgraph "Layer 3: Authentication"
        JWT[JWT Validation]
        TokenCheck[Token Type Check]
        UUIDParse[UUID Parsing]
    end

    subgraph "Layer 4: Authorization"
        RoleCheck[Role Check]
        OwnerCheck[Owner Scoping]
    end

    subgraph "Layer 5: Data"
        SoftDelete[Soft Delete Filter]
        InputValidation[Pydantic Validation]
        SQLEscape[SQL ILIKE Escaping]
    end

    CORS --> Global --> JWT --> RoleCheck --> SoftDelete
    Auth --> TokenCheck --> OwnerCheck --> InputValidation
    UUIDParse --> SQLEscape
```

## Role and Capability Separation

The role system is enforced backend-first through explicit capability checks:

- `viewer`: report mode only (summary, recent records, basic record filters, exports)
- `analyst`: viewer capabilities + insights mode (category breakdown, trends, monthly comparison, advanced record filters)
- `admin`: analyst capabilities + mutation/admin controls (create/update/delete records, user management)

Authorization is checked at API dependency level, not only in frontend presentation:

- Dashboard insights endpoints (`/dashboard/by-category`, `/dashboard/trends`, `/dashboard/comparison`) require analyst-or-admin capability.
- Record listing allows all roles, but advanced query predicates (`search`, `amount_min`, `amount_max`) are guarded for analyst-or-admin only.

Frontend mirrors these capabilities so Viewer UI stays read-only and does not expose analyst interaction controls.

## Deployment

```mermaid
graph LR
    subgraph Development
        DevBE[Backend :8000]
        DevFE[Frontend :5173]
        DevDB[(PostgreSQL :5432)]
    end

    subgraph Production
        ProdBE[Backend (gunicorn)]
        ProdFE[Frontend (nginx)]
        ProdDB[(Managed PostgreSQL)]
    end

    DevBE --> DevDB
    DevFE -->|Proxy| DevBE
    ProdFE --> ProdBE
    ProdBE --> ProdDB
```
