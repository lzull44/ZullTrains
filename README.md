# ZullCoaching

A premium AI-powered fitness coaching platform — built for bodybuilding, fat-loss,
and lifestyle coaching clients. Coach dashboard, full client management, a functional
meal builder with live macro math, an AI-style auto plan generator, grocery lists,
weekly check-ins, and analytics.

> Built by **ZullCoaching**.

## Tech stack

- **React 18** + **Vite**
- **Tailwind CSS** (dark mode via `class`)
- **Framer Motion** — page/element animations
- **Recharts** — graphs & charts
- **lucide-react** — icons
- **React Router** — navigation
- Local React state + Context (no backend) with mock starter data

## Run locally

```bash
cd zullcoaching
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173).

Any email/password logs you in (auth is mocked and stored in `localStorage`).

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Project structure

```
zullcoaching/
├── index.html
├── tailwind.config.js
├── vite.config.js
├── public/
│   └── zull-logo.svg
└── src/
    ├── main.jsx                 # providers: Router → Theme → Auth → AppData
    ├── App.jsx                  # routes + auth gate
    ├── index.css                # Tailwind + component classes (.card, .btn-*, .input)
    ├── context/
    │   ├── ThemeContext.jsx     # dark/light toggle
    │   ├── AuthContext.jsx      # mocked login/logout
    │   └── AppDataContext.jsx   # clients, foods, meal plan, targets, grocery list
    ├── data/
    │   ├── foods.js             # food database + category styles
    │   ├── clients.js           # client roster
    │   └── analytics.js         # dashboard/analytics mock series
    ├── utils/
    │   └── macros.js            # macro math: scaleFood, sumMacros, presets, delta logic
    ├── components/
    │   ├── ui/                  # Card, Button, StatCard, ProgressBar, MacroRing, Modal…
    │   └── layout/              # Sidebar, Topbar, Layout, Footer, AI chat widget
    └── pages/
        ├── Login.jsx  Onboarding.jsx  Dashboard.jsx  Clients.jsx  ClientProfile.jsx
        ├── MealBuilder.jsx  FoodDatabase.jsx  GroceryList.jsx  Progress.jsx
        └── CheckIns.jsx  Analytics.jsx  Settings.jsx
```

## Core macro formula

```
actual macro = food macro × entered grams ÷ serving size grams
```

Implemented once in `src/utils/macros.js` (`scaleFood`) and used by the Meal Builder,
Food Database, Auto-Build generator, and Grocery List.
