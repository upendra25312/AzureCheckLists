# Architecture Diagram

## End-to-end solution architecture

```mermaid
flowchart TB
    subgraph UserLayer["User layer"]
        U1["Sales Architect"]
        U2["Solutions Architect"]
        U3["Cloud Engineer"]
        U4["Senior Director"]
    end

    subgraph Experience["Frontend experience"]
        SWA["Azure Static Web App<br/>Next.js static export"]
        HOME["Homepage / Start Review"]
        PR["Project review workspace"]
        SP["Service pages"]
        DH["Data health page"]
    end

    subgraph StaticData["Build-time catalog"]
        GEN["tools/generate-data.mjs"]
        SRC["Azure/review-checklists source repo"]
        JSON["public/data/*.json"]
    end

    subgraph Runtime["Dedicated backend"]
        FUNC["Azure Function App"]
        AV["/api/availability"]
        PRC["/api/pricing"]
        HLTH["/api/health"]
        RF["/api/refresh"]
        BLOB["Azure Blob Storage cache"]
        AI["Application Insights"]
    end

    subgraph MicrosoftSources["Microsoft-backed sources"]
        REG["Azure Product Availability by Region"]
        RLIST["Azure regions list"]
        PRICE["Azure Retail Prices API"]
    end

    U1 --> SWA
    U2 --> SWA
    U3 --> SWA
    U4 --> SWA

    SWA --> HOME
    SWA --> PR
    SWA --> SP
    SWA --> DH

    SRC --> GEN
    GEN --> JSON
    JSON --> SWA

    PR --> AV
    PR --> PRC
    DH --> HLTH
    SP --> AV
    SP --> PRC

    AV --> FUNC
    PRC --> FUNC
    HLTH --> FUNC
    RF --> FUNC

    FUNC --> BLOB
    FUNC --> AI
    FUNC --> REG
    FUNC --> RLIST
    FUNC --> PRICE
```

## Primary data flows

## 1. Build-time catalog flow

```mermaid
flowchart LR
    A["Azure/review-checklists source repo"] --> B["generate-data.mjs"]
    B --> C["Normalized service + finding model"]
    C --> D["public/data catalog artifacts"]
    D --> E["Static frontend routes"]
```

## 2. Live regional availability flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API as Function App
    participant Cache as Blob cache
    participant MS as Microsoft availability sources

    User->>Frontend: Open project review or service page
    Frontend->>API: POST /api/availability
    API->>Cache: Read cached availability dataset
    alt cache hit and fresh
        Cache-->>API: cached dataset
    else cache miss or expired
        API->>MS: Fetch current availability data
        MS-->>API: availability dataset
        API->>Cache: Save normalized dataset
    end
    API-->>Frontend: service regional fit response
    Frontend-->>User: show region status and restrictions
```

## 3. Live pricing flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API as Function App
    participant Cache as Blob cache
    participant Retail as Azure Retail Prices API

    User->>Frontend: Open project review matrix
    Frontend->>API: POST /api/pricing
    API->>Cache: Read service pricing cache
    alt cache hit and fresh
        Cache-->>API: cached pricing
    else cache miss or expired
        API->>Retail: Query pricing rows
        Retail-->>API: retail pricing response
        API->>Cache: Save normalized pricing snapshot
    end
    API-->>Frontend: pricing rows and summary
    Frontend-->>User: show cost fit and export options
```

## 4. Project review export flow

```mermaid
flowchart LR
    A["User selects services"] --> B["Project review state"]
    B --> C["Service assumptions"]
    B --> D["Checklist decisions"]
    B --> E["Target regions"]
    C --> F["Export builder"]
    D --> F
    E --> F
    F --> G["Checklist CSV"]
    F --> H["Design Markdown / Text"]
    F --> I["Pricing CSV / Markdown / Text"]
```
