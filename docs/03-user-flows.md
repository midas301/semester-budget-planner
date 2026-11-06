# User Flows

## Flow 1: First-time setup
```mermaid
flowchart LR
    A[Open app] --> B[Welcome screen]
    B --> C[Enter semester budget]
    C --> D[Set semester length]
    D --> E[App generates weekly budgets]
    E --> F[Home dashboard]
```

## Flow 2: Add an expense
```mermaid
flowchart LR
    A[Home dashboard] --> B[Tap + button]
    B --> C[Enter amount]
    C --> D[Pick category]
    D --> E[Save]
    E --> F{Near weekly limit?}
    F -- Yes --> G[Show overspend alert]
    F -- No --> H[Back to dashboard]
    G --> H
```

## Flow 3: View spending insights
```mermaid
flowchart LR
    A[Home dashboard] --> B[Insights tab]
    B --> C[Category breakdown chart]
    C --> D[Weekly comparison]
```

## Screen list
1. Welcome / onboarding
2. Budget setup
3. Home dashboard (this week's remaining budget)
4. Add expense
5. Overspend alert
6. Insights
7. Settings / profile
