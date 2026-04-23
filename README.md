# Foliotest — Portfolio Backtester

Real-time portfolio backtesting with Yahoo Finance data, inspired by Trade Republic's clean aesthetic.

## 🚀 Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
```bash
cd foliotest-vercel
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/foliotest.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Framework preset:** Create React App (auto-detected)
4. **Build command:** `npm run build` (auto-detected)
5. **Output directory:** `build` (auto-detected)
6. Click **Deploy**

That's it! Your app will be live at `https://foliotest-xxx.vercel.app` in ~2 minutes.

---

## 🛠 Tech stack
- **Frontend:** React 18 + Recharts + Inter typography + Lucide icons
- **Backend:** Vercel serverless functions (Yahoo Finance proxy with caching)
- **Computation:** Web Worker (off-main-thread simulations)

## 📊 Features
- Real-time data via Yahoo Finance (any ticker)
- Up to 4 portfolios compared side-by-side
- 10 analysis tabs: performance, drawdown, heatmap, distribution, scatter, correlation, etc.
- Dollar-cost averaging support (monthly contributions)
- Multiple rebalancing strategies (monthly, quarterly, annual, bands 5%, never)
- URL state encoding (shareable links)
- Keyboard shortcuts (1-8 for periods, Cmd+S to share)

## 📁 Structure
```
foliotest-vercel/
├── api/
│   └── history.js          # Vercel serverless function (Yahoo proxy)
├── public/
│   └── index.html
├── src/
│   ├── App.js              # Orchestrator
│   ├── lib/                # Pure logic (compute, format, tokens)
│   ├── hooks/              # State management
│   ├── components/         # UI primitives + chrome
│   └── screens/            # 5 routes (Onboarding, Builder, Results, Compare, Correlation)
├── package.json
└── vercel.json             # Vercel routing config
```

## 🧪 Local development
```bash
npm install
npm start
```
Then visit `http://localhost:3000`.
