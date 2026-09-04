// What-If Simulation Engine for MARGIN
// Simulates hypothetical purchases and determines technical affordability,
// buffer integrity, and the earliest safe purchase date.

import { generateCashFlowForecast, formatDate } from './forecastEngine.js';

/**
 * Evaluates a hypothetical purchase against the user's cash flow forecast
 * 
 * @param {Object} user 
 * @param {Object} purchase { amount: number, date?: string, description?: string }
 * @param {number} horizonDays 
 * @returns {Object} Structured analysis, verdicts, earliest safe date, and comparison timelines
 */
export function evaluateWhatIfPurchase(user, purchase, horizonDays = 45) {
  const amount = Number(purchase.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Purchase amount must be a positive number");
  }

  const todayStr = formatDate(new Date());
  const purchaseDate = purchase.date || todayStr;
  const description = purchase.description || "Hypothetical purchase";

  // 1. Generate Baseline Forecast (no hypothetical expense)
  const baseline = generateCashFlowForecast(user, {
    startDate: todayStr,
    daysForward: horizonDays
  });

  // 2. Generate Simulated Forecast with purchase on the requested date
  const simulated = generateCashFlowForecast(user, {
    startDate: todayStr,
    daysForward: horizonDays,
    hypotheticalExpense: {
      amount,
      date: purchaseDate,
      description
    }
  });

  const bufferTarget = user.safetyBufferTarget;
  const simMinBalance = simulated.summary.minProjectedBalance;
  const baseMinBalance = baseline.summary.minProjectedBalance;

  const canAffordTechnically = simMinBalance >= 0;
  const breachesBuffer = simMinBalance < bufferTarget;

  let verdict = 'SAFE'; // 'SAFE', 'BUFFER_BREACH', 'CRITICAL_OVERDRAFT'
  let verdictColor = 'emerald'; // UI color helper

  if (!canAffordTechnically) {
    verdict = 'CRITICAL_OVERDRAFT';
    verdictColor = 'rose';
  } else if (breachesBuffer) {
    verdict = 'BUFFER_BREACH';
    verdictColor = 'amber';
  }

  // 3. Search for Earliest Safe Date if current date breaches buffer or causes overdraft
  let earliestSafeDateInfo = null;
  if (verdict !== 'SAFE') {
    earliestSafeDateInfo = findEarliestSafeDate(user, amount, purchaseDate, horizonDays, bufferTarget);
  }

  // 4. Generate Human-Readable Structured Explanation
  const explanation = generateStructuredExplanation({
    verdict,
    amount,
    description,
    purchaseDate,
    bufferTarget,
    simMinBalance,
    baseMinBalance,
    user,
    earliestSafeDateInfo,
    simulatedNearMisses: simulated.nearMisses
  });

  // Calculate cushion difference
  const baselineCushion = Math.max(0, baseMinBalance - bufferTarget);
  const simulatedCushion = simMinBalance - bufferTarget;

  return {
    verdict,
    verdictColor,
    isSafe: verdict === 'SAFE',
    canAffordTechnically,
    breachesBuffer,
    purchase: {
      amount,
      date: purchaseDate,
      description
    },
    metrics: {
      currentBalance: user.currentBalance,
      safetyBufferTarget: bufferTarget,
      baselineMinBalance: baseMinBalance,
      simulatedMinBalance: simMinBalance,
      simulatedBufferShortfall: breachesBuffer ? (bufferTarget - simMinBalance) : 0,
      baselineCushion,
      simulatedCushion,
      healthScoreBefore: baseline.summary.healthScore,
      healthScoreAfter: simulated.summary.healthScore
    },
    explanation,
    earliestSafeDate: earliestSafeDateInfo,
    safeForRazorpayCheckout: verdict === 'SAFE',
    // Compact timelines for chart visualization
    baselineTimeline: baseline.timeline.map(d => ({
      date: d.date,
      balance: d.closingBalance,
      dayName: d.dayName
    })),
    simulatedTimeline: simulated.timeline.map(d => ({
      date: d.date,
      balance: d.closingBalance,
      dayName: d.dayName,
      isBufferBreached: d.isBufferBreached,
      isOverdraft: d.isOverdraft
    })),
    simulatedNearMisses: simulated.nearMisses
  };
}

/**
 * Scans day-by-day forward to find the earliest date when spending `amount`
 * will NOT breach the safety buffer or cause negative balance.
 */
function findEarliestSafeDate(user, amount, requestedDate, horizonDays, bufferTarget) {
  const startDate = new Date(requestedDate);
  const searchDays = Math.max(horizonDays, 60);

  for (let offset = 1; offset <= searchDays; offset++) {
    const candidateDate = new Date(startDate);
    candidateDate.setDate(startDate.getDate() + offset);
    const candidateDateStr = formatDate(candidateDate);

    // Test simulation with hypothetical expense on candidateDate
    const testSimulation = generateCashFlowForecast(user, {
      startDate: requestedDate,
      daysForward: searchDays,
      hypotheticalExpense: {
        amount,
        date: candidateDateStr,
        description: "Earliest Safe Date Test"
      }
    });

    const testMinBalance = testSimulation.summary.minProjectedBalance;

    // Condition for being truly safe: projected balance never drops below safetyBufferTarget
    if (testMinBalance >= bufferTarget) {
      const milestone = findEnablingMilestone(user, requestedDate, candidateDateStr);
      return {
        date: candidateDateStr,
        formattedDate: candidateDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysToWait: offset,
        projectedMinBalance: testMinBalance,
        enablingFactor: milestone
      };
    }
  }

  // If no date keeps it strictly above buffer, find earliest date that at least avoids overdraft
  for (let offset = 1; offset <= searchDays; offset++) {
    const candidateDate = new Date(startDate);
    candidateDate.setDate(startDate.getDate() + offset);
    const candidateDateStr = formatDate(candidateDate);

    const testSimulation = generateCashFlowForecast(user, {
      startDate: requestedDate,
      daysForward: searchDays,
      hypotheticalExpense: {
        amount,
        date: candidateDateStr,
        description: "Overdraft avoidance test"
      }
    });

    if (testSimulation.summary.minProjectedBalance >= 0) {
      return {
        date: candidateDateStr,
        formattedDate: candidateDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysToWait: offset,
        projectedMinBalance: testSimulation.summary.minProjectedBalance,
        enablingFactor: `Prevents negative balance, though still under ₹${bufferTarget.toLocaleString('en-IN')} target buffer.`,
        isPartialSafety: true
      };
    }
  }

  return {
    date: null,
    formattedDate: "Beyond 60 days",
    daysToWait: null,
    projectedMinBalance: null,
    enablingFactor: "Requires increasing regular monthly income or reducing recurring commitments."
  };
}

/**
 * Finds the financial milestone (e.g. salary deposit, passing of rent date)
 * that unlocks affordability.
 */
function findEnablingMilestone(user, fromDateStr, targetDateStr) {
  const fromDate = new Date(fromDateStr);
  const targetDate = new Date(targetDateStr);

  // Check if salary day occurs in this window
  let salaryPassed = false;
  const cur = new Date(fromDate);
  while (cur <= targetDate) {
    if (cur.getDate() === user.incomeDayOfMonth) {
      salaryPassed = true;
      break;
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (salaryPassed) {
    return `Monthly salary credit of ₹${user.monthlyIncome.toLocaleString('en-IN')} on the ${getOrdinal(user.incomeDayOfMonth)} replenishes your cash reserve.`;
  }

  return `Gradual accumulation of discretionary cash balance over ${Math.round((targetDate - fromDate) / (1000 * 60 * 60 * 24))} days.`;
}

/**
 * Formats structured explanation text suitable for both chat response and UI cards
 */
function generateStructuredExplanation(ctx) {
  const {
    verdict,
    amount,
    description,
    bufferTarget,
    simMinBalance,
    user,
    earliestSafeDateInfo,
    simulatedNearMisses
  } = ctx;

  const fmtAmount = `₹${amount.toLocaleString('en-IN')}`;
  const fmtBuffer = `₹${bufferTarget.toLocaleString('en-IN')}`;
  const fmtMin = `₹${simMinBalance.toLocaleString('en-IN')}`;

  if (verdict === 'SAFE') {
    return {
      headline: `All clear! Spending ${fmtAmount} on ${description} is completely safe.`,
      verdictTitle: "Safe Spending Decision",
      details: `Your projected cash balance stays comfortably above your ${fmtBuffer} safety buffer throughout the next 45 days (troughing at ${fmtMin}).`,
      recommendation: "You are pre-approved by MARGIN. Proceed with peace of mind.",
      tag: "SAFE"
    };
  }

  if (verdict === 'BUFFER_BREACH') {
    const triggerMiss = simulatedNearMisses && simulatedNearMisses[0];
    const triggerText = triggerMiss ? ` when ${triggerMiss.cause}` : ` due to upcoming bills`;
    const waitText = earliestSafeDateInfo && earliestSafeDateInfo.date
      ? `Waiting until ${earliestSafeDateInfo.formattedDate} (${earliestSafeDateInfo.daysToWait} days) keeps you above your safety buffer.`
      : `Consider spacing out this purchase or reducing other discretionary spends.`;

    return {
      headline: `Technically affordable, but breaches your ${fmtBuffer} safety buffer.`,
      verdictTitle: "Safety Buffer at Risk",
      details: `You have enough cash right now, but your balance will drop to ${fmtMin} around ${triggerMiss?.lowestDate || 'the next billing cycle'}${triggerText}.`,
      recommendation: waitText,
      enablingFactor: earliestSafeDateInfo?.enablingFactor,
      tag: "BUFFER BREACH"
    };
  }

  // CRITICAL_OVERDRAFT
  const shortfall = Math.abs(simMinBalance);
  return {
    headline: `Critical alert: Spending ${fmtAmount} will cause an account deficit of ₹${shortfall.toLocaleString('en-IN')}.`,
    verdictTitle: "High Overdraft Risk",
    details: `Deducting ${fmtAmount} leaves insufficient funds to honor scheduled obligations like Rent & EMIs, driving your balance negative.`,
    recommendation: earliestSafeDateInfo?.date 
      ? `Earliest safe date: ${earliestSafeDateInfo.formattedDate} (${earliestSafeDateInfo.daysToWait} days away).` 
      : `Do not make this purchase until income is replenished.`,
    enablingFactor: earliestSafeDateInfo?.enablingFactor,
    tag: "CRITICAL"
  };
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
