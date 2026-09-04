# MARGIN — AI-Powered Financial Safety Agent
> **Built for Razorpay Buildathon (Open Track)**  
> *Don't just look at what you have today — simulate the downstream safety of tomorrow before spending.*

---

## 💡 The Core Problem & Vision

Traditional fintech apps, banking dashboards, and UPI wallets answer only one question: **"What is my balance right now?"**

This creates a dangerous illusion of liquidity. A user seeing **₹38,500** in their account might believe they can easily afford a **₹15,000** gadget today. But they don't realize:
1. Rent of **₹18,000** is due in 5 days.
2. Laptop EMI of **₹5,500** is debited on the 10th.
3. Daily living expenses (food, commute, groceries) burn ~₹450/day.

Making that purchase leaves their balance crashing through their safety buffer into an overdraft deficit before next month's salary arrives.

**MARGIN is an autonomous financial safety agent.** It sits *between* a user's impulse and their checkout button. Given any hypothetical spend, MARGIN simulates downstream cash flows 30–60 days forward, flags buffer breaches, attributes root causes, and computes the **Earliest Safe Date** to buy.

---

## 🧠 The Mathematical Core (Explained for Pitch Prep)

MARGIN's simulation engines (`forecastEngine.js` and `whatIfEngine.js`) are standalone, testable, and explainable to judges:

### 1. Empirical Discretionary Burn Rate ($D_{avg}$)
Rather than assuming a rigid budget, MARGIN observes $K$ days (60 days) of debit transactions, filters out known fixed commitments, and derives the user's real empirical daily burn:
$$D_{avg} = \frac{1}{K} \sum_{i=1}^{M} \text{Debit}_i \quad \text{where } \text{isRecurring} = \text{false}$$

### 2. Daily Cash Flow Forecast Equation
Starting from current liquidity $B_0$ on day $t = 0$, daily projected balance $B_t$ is computed day-by-day:
$$B_t = B_{t-1} + I_t - R_t - D_{avg} - P_t$$
Where:
- $I_t$: Verified income credited on day $t$ (e.g., monthly payroll).
- $R_t$: Sum of scheduled recurring obligations due on day $t$ (Rent, EMIs, Utilities).
- $D_{avg}$: Empirical average discretionary spend.
- $P_t$: Hypothetical purchase amount (if simulated on date $t$).

### 3. Safety Buffer Condition & Near-Miss Detection
A user defines an emotional/financial safety cushion (e.g. $B_{target} = \text{₹10,000}$).
- **Safe Spend**: $\min_{t} B_t \ge B_{target}$
- **Buffer Breach (Near-Miss)**: $0 \le \min_{t} B_t < B_{target}$
- **Critical Overdraft**: $\min_{t} B_t < 0$

When a near-miss occurs, the engine traverses backward to identify the primary causal obligation (e.g. *"MacBook EMI on the 10th caused a ₹4,200 buffer dip"*).

### 4. The Earliest Safe Date Search Algorithm
If a purchase breaches the buffer today, MARGIN scans forward $T_{candidate} \in [1, 60]$ days:
$$T_{safe} = \min \left\{ t \ge T_{today} \;\middle|\; \forall \tau \ge t, \; B_\tau(P, t) \ge B_{target} \right\}$$
MARGIN then returns a structured natural explanation:
> *"Technically affordable today, but your buffer drops to ₹3,200 on Oct 3rd when Rent is due. Waiting until Oct 1st (6 days) after your salary credit keeps your ₹10,000 buffer intact."*

---

## ⚡ Razorpay Integration Highlights (Why Judges Love This)

1. **RazorpayX Payroll Inflow**: Income schedules are modeled around automated RazorpayX payroll webhooks.
2. **MARGIN Shield API Hook (`/api/razorpay/shield-checkout`)**:
   - When a purchase is greenlit, MARGIN signs a cryptographically verifiable **Safety Token** and initializes a live Razorpay Order.
   - When a purchase is unsafe, MARGIN blocks impulsive checkout and offers a **1-click Razorpay Payment Mandate / AutoPay** scheduled exactly on the **Earliest Safe Date**!

---

## 🚀 Quick Start (Local Run)

### 1. Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v10+

### 2. Start Backend Server
```bash
cd server
npm install
npm start
# Server runs on http://localhost:5001
```

### 3. Start Frontend Client
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Run Automated Engine Unit Tests
```bash
npm test
# Or inside server: node src/test/engine.test.js
```

---

## 🎭 60-Second Demo Pitch Script for Judges

1. **The Hook (0:00 - 0:15)**:  
   *"Judges, look at Aman's dashboard. He has ₹38,500 in his account. If he walks into a store and wants to buy these Sony XM5 headphones for ₹16,000, his banking app says 'Approved'. But is he actually safe?"*

2. **The Simulation (0:15 - 0:35)**:  
   *Click the 'Sony XM5 Headphones (₹16,000)' chip or type 'Can I buy headphones for 16k today?'.*  
   *"Look at what MARGIN does. In 100 milliseconds, it runs a 45-day forecast. It flags a yellow BUFFER BREACH. Why? Because Rent of ₹18,000 is due in 3 days, and his buffer will drop to ₹1,400 — dangerously breaching his ₹10,000 emergency target."*

3. **The Solution (0:35 - 0:50)**:  
   *"MARGIN doesn't just say NO. It tells him: 'Wait 6 days until your salary arrives on the 1st, and you will stay 100% safe.' Notice the purple dashed line overlaid directly on the forecast chart."*

4. **The Razorpay Finish (0:50 - 1:00)**:  
   *Click 'Verify Razorpay Shield'.*  
   *"Through our Razorpay Shield integration, MARGIN shields the user from overdraft and schedules a Razorpay Mandate for the safe date."*

---

## 📂 Project Architecture

```
razorpay/
├── package.json               # Root scripts
├── README.md                  # Pitch notes & algorithm documentation
├── server/
│   ├── src/
│   │   ├── data/mockData.js   # 60-day transactions, personas, bills
│   │   ├── engine/
│   │   │   ├── forecastEngine.js  # Daily liquidity projection & near-misses
│   │   │   ├── whatIfEngine.js    # Simulation & Earliest Safe Date search
│   │   │   └── nlpParser.js       # Natural language intent & INR extractor
│   │   ├── routes/
│   │   │   ├── api.js             # User, forecast, what-if, chat endpoints
│   │   │   └── razorpay.js        # Razorpay Shield checkout API
│   │   ├── test/
│   │   │   └── engine.test.js     # 10/10 automated unit tests
│   │   └── server.js              # Express app on port 5001
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx         # KPI strip & persona switcher
    │   │   ├── WhatIfConsole.jsx  # Chat & natural language simulator
    │   │   ├── ForecastChart.jsx  # 30/60-day interactive Recharts graph
    │   │   ├── NearMissPanel.jsx  # Problems Avoided counter & alerts
    │   │   ├── UpcomingBills.jsx  # Recurring obligations ledger
    │   │   ├── RecentTransactions.jsx # Discretionary spending analytics
    │   │   └── RazorpayShieldModal.jsx# Razorpay Safe Checkout demo
    │   ├── services/api.js        # Frontend API client
    │   ├── App.jsx                # Master dashboard layout
    │   └── index.css              # Custom styling & glow utilities
```
