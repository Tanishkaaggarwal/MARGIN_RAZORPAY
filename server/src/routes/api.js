// API Routes for MARGIN Financial Safety Agent
import express from 'express';
import { getMockUsers } from '../data/mockData.js';
import { generateCashFlowForecast } from '../engine/forecastEngine.js';
import { evaluateWhatIfPurchase } from '../engine/whatIfEngine.js';
import { parseFinancialQuery } from '../engine/nlpParser.js';

const router = express.Router();

// In-memory data store for hackathon session
let usersStore = getMockUsers();
let activeUserId = "user_aman";

// Running log of historical near-misses caught by MARGIN
let problemsAvoidedLog = [
  {
    id: "avoided_1",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    query: "Can I buy the Nothing Ear (2) for ₹9,999?",
    amount: 9999,
    preventedDeficit: 6200,
    cause: "Rent due in 2 days",
    actionTaken: "Postponed purchase until after salary day",
    status: "Saved from buffer breach"
  },
  {
    id: "avoided_2",
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    query: "Can I book Goa resort package for ₹22,000?",
    amount: 22000,
    preventedDeficit: 14500,
    cause: "MacBook EMI & Indiranagar Rent clash",
    actionTaken: "Deferred and saved ₹15,000 in late fees & overdraft",
    status: "Saved from overdraft"
  }
];

// Helper to get active user
function getActiveUser() {
  return usersStore[activeUserId] || Object.values(usersStore)[0];
}

// 1. List available personas
router.get('/users', (req, res) => {
  const summaries = Object.values(usersStore).map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    currentBalance: u.currentBalance,
    safetyBufferTarget: u.safetyBufferTarget,
    monthlyIncome: u.monthlyIncome,
    isActive: u.id === activeUserId
  }));
  res.json({ users: summaries, activeUserId });
});

// 2. Switch persona
router.post('/user/switch', (req, res) => {
  const { userId } = req.body;
  if (!usersStore[userId]) {
    return res.status(404).json({ error: "User persona not found" });
  }
  activeUserId = userId;
  res.json({ success: true, activeUser: getActiveUser() });
});

// 3. Get active user profile, balance, bills, and recent transactions
router.get('/user', (req, res) => {
  const user = getActiveUser();
  res.json({
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    currency: user.currency,
    currentBalance: user.currentBalance,
    safetyBufferTarget: user.safetyBufferTarget,
    monthlyIncome: user.monthlyIncome,
    incomeDayOfMonth: user.incomeDayOfMonth,
    incomeSource: user.incomeSource,
    recurringExpenses: user.recurringExpenses,
    transactions: user.transactions.slice(0, 25)
  });
});

// 4. Update safety buffer target
router.post('/user/buffer', (req, res) => {
  const { bufferTarget } = req.body;
  const targetNum = Number(bufferTarget);
  if (isNaN(targetNum) || targetNum < 0) {
    return res.status(400).json({ error: "Invalid buffer target" });
  }

  const user = getActiveUser();
  user.safetyBufferTarget = targetNum;
  res.json({ success: true, safetyBufferTarget: user.safetyBufferTarget });
});

// 5. Baseline 30/60-day cash flow forecast
router.get('/forecast', (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const user = getActiveUser();
  const forecast = generateCashFlowForecast(user, { daysForward: days });
  res.json(forecast);
});

// 6. Direct What-If Simulation
router.post('/what-if', (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const user = getActiveUser();
    const result = evaluateWhatIfPurchase(user, { amount, date, description });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Natural language chat query
router.post('/chat', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const parsed = parseFinancialQuery(message);
    if (!parsed.success) {
      return res.json({
        success: false,
        error: parsed.error,
        botReply: parsed.error
      });
    }

    const user = getActiveUser();
    const simulation = evaluateWhatIfPurchase(user, {
      amount: parsed.amount,
      date: parsed.date,
      description: parsed.description
    });

    // If purchase breached buffer or had near-miss, record in problems avoided log
    if (!simulation.isSafe) {
      const avoidedItem = {
        id: `avoided_${Date.now()}`,
        timestamp: new Date().toISOString(),
        query: message,
        amount: parsed.amount,
        preventedDeficit: simulation.metrics.simulatedBufferShortfall,
        cause: simulation.explanation.details,
        actionTaken: simulation.earliestSafeDate?.date
          ? `Flagged for deferral to ${simulation.earliestSafeDate.formattedDate}`
          : "Blocked to avoid account overdraft",
        status: simulation.verdict === 'CRITICAL_OVERDRAFT' ? 'Saved from overdraft' : 'Saved from buffer breach'
      };
      // Keep most recent first, max 10
      problemsAvoidedLog.unshift(avoidedItem);
      if (problemsAvoidedLog.length > 10) problemsAvoidedLog.pop();
    }

    res.json({
      success: true,
      parsed,
      simulation,
      botReply: simulation.explanation.headline,
      botDetails: simulation.explanation.details,
      botRecommendation: simulation.explanation.recommendation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Near-misses & Problems Avoided running log
router.get('/near-misses', (req, res) => {
  const user = getActiveUser();
  const forecast = generateCashFlowForecast(user, { daysForward: 45 });
  
  res.json({
    activeForecastNearMisses: forecast.nearMisses,
    problemsAvoidedCounter: problemsAvoidedLog.length,
    problemsAvoidedLog
  });
});

export default router;
