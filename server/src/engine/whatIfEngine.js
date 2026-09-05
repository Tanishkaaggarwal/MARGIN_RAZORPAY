// What-If Simulation Engine for MARGIN
// Simulates hypothetical purchases and determines:
// - technical affordability
// - safety-buffer integrity
// - relevant upcoming commitments
// - earliest safe purchase date
// - human-readable explanation

import { generateCashFlowForecast, formatDate } from './forecastEngine.js';

/**
 * Evaluates a hypothetical purchase against the user's cash flow forecast
 *
 * @param {Object} user
 * @param {Object} purchase { amount: number, date?: string, description?: string }
 * @param {number} horizonDays
 * @returns {Object} Structured simulation result
 */
export function evaluateWhatIfPurchase(user, purchase, horizonDays = 45) {
  const amount = Number(purchase.amount);

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Purchase amount must be a positive number");
  }

  const todayStr = formatDate(new Date());
  const purchaseDate = purchase.date || todayStr;
  const description = purchase.description || "Hypothetical purchase";

  // ---------------------------------------------------------
  // 1. BASELINE FORECAST
  // ---------------------------------------------------------

  const baseline = generateCashFlowForecast(user, {
    startDate: todayStr,
    daysForward: horizonDays
  });

  // ---------------------------------------------------------
  // 2. SIMULATED FORECAST
  // ---------------------------------------------------------

  const simulated = generateCashFlowForecast(user, {
    startDate: todayStr,
    daysForward: horizonDays,
    hypotheticalExpense: {
      amount,
      date: purchaseDate,
      description
    }
  });

  const bufferTarget = Number(user.safetyBufferTarget) || 0;

  const simMinBalance = simulated.summary.minProjectedBalance;
  const baseMinBalance = baseline.summary.minProjectedBalance;

  const canAffordTechnically = simMinBalance >= 0;
  const breachesBuffer = simMinBalance < bufferTarget;

  // ---------------------------------------------------------
  // 3. DETERMINE VERDICT
  // ---------------------------------------------------------

  let verdict = 'SAFE';
  let verdictColor = 'emerald';

  if (!canAffordTechnically) {
    verdict = 'CRITICAL_OVERDRAFT';
    verdictColor = 'rose';
  } else if (breachesBuffer) {
    verdict = 'BUFFER_BREACH';
    verdictColor = 'amber';
  }

  // ---------------------------------------------------------
  // 4. EARLIEST SAFE DATE
  // ---------------------------------------------------------

  let earliestSafeDateInfo = null;

  if (verdict !== 'SAFE') {
    earliestSafeDateInfo = findEarliestSafeDate(
      user,
      amount,
      purchaseDate,
      horizonDays,
      bufferTarget
    );
  }

  // ---------------------------------------------------------
  // 5. FIND RELEVANT UPCOMING COMMITMENTS
  // ---------------------------------------------------------

  const upcomingCommitments = findRelevantCommitments(
    user,
    purchaseDate,
    simulated.timeline,
    horizonDays
  );

  // ---------------------------------------------------------
  // 6. GENERATE EXPLANATION
  // ---------------------------------------------------------

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
    simulatedNearMisses: simulated.nearMisses,
    upcomingCommitments
  });

  // ---------------------------------------------------------
  // 7. CALCULATE CUSHION
  // ---------------------------------------------------------

  const baselineCushion = Math.max(
    0,
    baseMinBalance - bufferTarget
  );

  const simulatedCushion = simMinBalance - bufferTarget;

  // ---------------------------------------------------------
  // 8. RETURN COMPLETE RESULT
  // ---------------------------------------------------------

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

      simulatedBufferShortfall: breachesBuffer
        ? bufferTarget - simMinBalance
        : 0,

      baselineCushion,
      simulatedCushion,

      healthScoreBefore: baseline.summary.healthScore,
      healthScoreAfter: simulated.summary.healthScore
    },

    explanation,

    earliestSafeDate: earliestSafeDateInfo,

    // IMPORTANT:
    // This is consumed by WhatIfConsole.jsx
    upcomingCommitments,

    safeForRazorpayCheckout: verdict === 'SAFE',

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
 * Finds relevant recurring commitments.
 *
 * We include commitments that occur between the purchase date
 * and the simulated minimum-balance date.
 *
 * If that window contains fewer than 3 bills, we also consider
 * the next upcoming bills so the user still gets useful context.
 */
function findRelevantCommitments(
  user,
  purchaseDate,
  timeline,
  horizonDays
) {
  if (
    !user.recurringExpenses ||
    user.recurringExpenses.length === 0
  ) {
    return {
      items: [],
      totalAmount: 0,
      count: 0,

      analysisWindow: {
        from: purchaseDate,
        to: purchaseDate
      }
    };
  }

  const startDate = new Date(purchaseDate);

  // Find the lowest projected balance.
  const lowestPoint = timeline.reduce(
    (lowest, day) => {
      if (
        !lowest ||
        day.closingBalance < lowest.closingBalance
      ) {
        return day;
      }

      return lowest;
    },
    null
  );

  const endDate = lowestPoint
    ? new Date(lowestPoint.date)
    : new Date(startDate);

  const commitments = [];

  for (const bill of user.recurringExpenses) {
    const amount = Number(bill.amount) || 0;
    const dueDay = Number(bill.dueDayOfMonth);

    if (!amount || !dueDay) continue;

    // Find next occurrence of this recurring bill.
    const dueDate = getNextDueDate(
      startDate,
      dueDay
    );

    const daysUntilDue = Math.max(
      0,
      Math.round(
        (dueDate - startDate) /
          (1000 * 60 * 60 * 24)
      )
    );

    const isBeforeTrough = dueDate <= endDate;

    commitments.push({
      id: bill.id,
      name: bill.name || 'Upcoming Bill',
      recipient: bill.recipient || '',
      category: bill.category || 'Recurring',
      amount,

      dueDate: formatDate(dueDate),

      daysUntilDue,

      isBeforeTrough
    });
  }

  // ---------------------------------------------------------
  // PRIORITIZATION
  // ---------------------------------------------------------
  //
  // First prioritize bills occurring before the simulated
  // trough. Then consider the nearest remaining bills.
  //

  commitments.sort((a, b) => {
    if (a.isBeforeTrough !== b.isBeforeTrough) {
      return a.isBeforeTrough ? -1 : 1;
    }

    if (a.daysUntilDue !== b.daysUntilDue) {
      return a.daysUntilDue - b.daysUntilDue;
    }

    return b.amount - a.amount;
  });

  // Maximum 3 commitments shown in the UI.
  const selected = commitments.slice(0, 3);

  return {
    items: selected,

    totalAmount: selected.reduce(
      (sum, bill) => sum + bill.amount,
      0
    ),

    count: selected.length,

    analysisWindow: {
      from: formatDate(startDate),
      to: formatDate(endDate)
    }
  };
}

/**
 * Gets the next occurrence of a recurring bill.
 *
 * Handles month rollover correctly.
 */
function getNextDueDate(startDate, dueDay) {
  const year = startDate.getFullYear();
  const month = startDate.getMonth();

  // Days in current month
  const daysInCurrentMonth =
    new Date(year, month + 1, 0).getDate();

  const safeDueDay = Math.min(
    dueDay,
    daysInCurrentMonth
  );

  let dueDate = new Date(
    year,
    month,
    safeDueDay
  );

  // If today's date is after the bill's due date,
  // move to next month.
  if (dueDate < startDate) {
    const nextMonthDate = new Date(
      year,
      month + 1,
      1
    );

    const nextYear =
      nextMonthDate.getFullYear();

    const nextMonth =
      nextMonthDate.getMonth();

    const daysInNextMonth =
      new Date(
        nextYear,
        nextMonth + 1,
        0
      ).getDate();

    const safeNextDueDay = Math.min(
      dueDay,
      daysInNextMonth
    );

    dueDate = new Date(
      nextYear,
      nextMonth,
      safeNextDueDay
    );
  }

  return dueDate;
}

/**
 * Finds earliest date when purchase preserves
 * the safety buffer.
 */
function findEarliestSafeDate(
  user,
  amount,
  requestedDate,
  horizonDays,
  bufferTarget
) {
  const startDate = new Date(requestedDate);

  const searchDays = Math.max(
    horizonDays,
    60
  );

  // ---------------------------------------------------------
  // FIRST: preserve safety buffer
  // ---------------------------------------------------------

  for (
    let offset = 1;
    offset <= searchDays;
    offset++
  ) {
    const candidateDate =
      new Date(startDate);

    candidateDate.setDate(
      startDate.getDate() + offset
    );

    const candidateDateStr =
      formatDate(candidateDate);

    const testSimulation =
      generateCashFlowForecast(user, {
        startDate: requestedDate,
        daysForward: searchDays,

        hypotheticalExpense: {
          amount,
          date: candidateDateStr,
          description: "Earliest Safe Date Test"
        }
      });

    const testMinBalance =
      testSimulation.summary.minProjectedBalance;

    if (testMinBalance >= bufferTarget) {
      const milestone =
        findEnablingMilestone(
          user,
          requestedDate,
          candidateDateStr
        );

      return {
        date: candidateDateStr,

        formattedDate:
          candidateDate.toLocaleDateString(
            'en-IN',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }
          ),

        daysToWait: offset,

        projectedMinBalance:
          testMinBalance,

        enablingFactor: milestone
      };
    }
  }

  // ---------------------------------------------------------
  // SECOND: avoid overdraft
  // ---------------------------------------------------------

  for (
    let offset = 1;
    offset <= searchDays;
    offset++
  ) {
    const candidateDate =
      new Date(startDate);

    candidateDate.setDate(
      startDate.getDate() + offset
    );

    const candidateDateStr =
      formatDate(candidateDate);

    const testSimulation =
      generateCashFlowForecast(user, {
        startDate: requestedDate,
        daysForward: searchDays,

        hypotheticalExpense: {
          amount,
          date: candidateDateStr,
          description: "Overdraft Avoidance Test"
        }
      });

    if (
      testSimulation.summary.minProjectedBalance >= 0
    ) {
      return {
        date: candidateDateStr,

        formattedDate:
          candidateDate.toLocaleDateString(
            'en-IN',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }
          ),

        daysToWait: offset,

        projectedMinBalance:
          testSimulation.summary.minProjectedBalance,

        enablingFactor:
          `Prevents negative balance, though still under ₹${bufferTarget.toLocaleString('en-IN')} target buffer.`,

        isPartialSafety: true
      };
    }
  }

  return {
    date: null,

    formattedDate: "Beyond 60 days",

    daysToWait: null,

    projectedMinBalance: null,

    enablingFactor:
      "Requires increasing regular monthly income or reducing recurring commitments."
  };
}

/**
 * Finds the financial milestone that unlocks affordability.
 */
function findEnablingMilestone(
  user,
  fromDateStr,
  targetDateStr
) {
  const fromDate =
    new Date(fromDateStr);

  const targetDate =
    new Date(targetDateStr);

  let salaryPassed = false;

  const cur =
    new Date(fromDate);

  while (cur <= targetDate) {
    if (
      cur.getDate() ===
      user.incomeDayOfMonth
    ) {
      salaryPassed = true;
      break;
    }

    cur.setDate(
      cur.getDate() + 1
    );
  }

  if (salaryPassed) {
    return `Monthly income credit of ₹${Number(user.monthlyIncome).toLocaleString('en-IN')} on the ${getOrdinal(user.incomeDayOfMonth)} replenishes your cash reserve.`;
  }

  return `Gradual accumulation of discretionary cash balance over ${Math.round(
    (targetDate - fromDate) /
      (1000 * 60 * 60 * 24)
  )} days.`;
}

/**
 * Creates a readable list of commitments.
 */
function formatCommitmentList(
  upcomingCommitments
) {
  if (
    !upcomingCommitments ||
    !upcomingCommitments.items ||
    upcomingCommitments.items.length === 0
  ) {
    return '';
  }

  return upcomingCommitments.items
    .map(bill => {
      const dueText =
        bill.daysUntilDue === 0
          ? 'due today'
          : bill.daysUntilDue === 1
            ? 'due tomorrow'
            : `due in ${bill.daysUntilDue} days`;

      return `${bill.name} (₹${bill.amount.toLocaleString('en-IN')}, ${dueText})`;
    })
    .join(', ');
}

/**
 * Generates structured human-readable explanation.
 */
function generateStructuredExplanation(ctx) {
  const {
    verdict,
    amount,
    description,
    bufferTarget,
    simMinBalance,
    earliestSafeDateInfo,
    upcomingCommitments
  } = ctx;

  const fmtAmount =
    `₹${amount.toLocaleString('en-IN')}`;

  const fmtBuffer =
    `₹${bufferTarget.toLocaleString('en-IN')}`;

  const fmtMin =
    `₹${simMinBalance.toLocaleString('en-IN')}`;

  const commitmentList =
    formatCommitmentList(
      upcomingCommitments
    );

  const commitmentTotal =
    upcomingCommitments &&
    upcomingCommitments.totalAmount
      ? `₹${upcomingCommitments.totalAmount.toLocaleString('en-IN')}`
      : '₹0';

  // ---------------------------------------------------------
  // SAFE
  // ---------------------------------------------------------

  if (verdict === 'SAFE') {
    return {
      headline:
        `All clear! Spending ${fmtAmount} on ${description} is safe.`,

      verdictTitle:
        "Safe Spending Decision",

      details:
        `Your projected cash balance stays above your ${fmtBuffer} safety buffer throughout the forecast, with a projected low of ${fmtMin}.`,

      recommendation:
        "You are pre-approved by MARGIN. Proceed with peace of mind.",

      tag: "SAFE"
    };
  }

  // ---------------------------------------------------------
  // BUFFER BREACH
  // ---------------------------------------------------------

  if (verdict === 'BUFFER_BREACH') {
    const waitText =
      earliestSafeDateInfo &&
      earliestSafeDateInfo.date
        ? `Waiting until ${earliestSafeDateInfo.formattedDate} (${earliestSafeDateInfo.daysToWait} days) keeps you above your safety buffer.`
        : `Consider delaying the purchase or reducing discretionary spending.`;

    let details =
      `You have enough cash to make this purchase today, but doing so would reduce your projected balance to ${fmtMin}, below your protected ${fmtBuffer} safety buffer.`;

    if (commitmentList) {
      details +=
        ` Upcoming commitments include ${commitmentList}, totaling ${commitmentTotal}.`;
    }

    return {
      headline:
        `Spending ${fmtAmount} is affordable, but it puts your safety buffer at risk.`,

      verdictTitle:
        "Safety Buffer at Risk",

      details,

      recommendation:
        waitText,

      enablingFactor:
        earliestSafeDateInfo?.enablingFactor,

      tag:
        "BUFFER BREACH"
    };
  }

  // ---------------------------------------------------------
  // CRITICAL OVERDRAFT
  // ---------------------------------------------------------

  const shortfall =
    Math.abs(simMinBalance);

  let details =
    `Spending ${fmtAmount} would push your projected balance to ${fmtMin}, creating a ${`₹${shortfall.toLocaleString('en-IN')}`} shortfall.`;

  if (commitmentList) {
    details +=
      ` The main upcoming commitments driving this risk are ${commitmentList}, totaling ${commitmentTotal}.`;
  } else {
    details +=
      ` Your projected cash flow cannot cover the purchase while maintaining upcoming obligations.`;
  }

  return {
    headline:
      `Critical alert: Spending ${fmtAmount} will cause an account deficit of ₹${shortfall.toLocaleString('en-IN')}.`,

    verdictTitle:
      "High Overdraft Risk",

    details,

    recommendation:
      earliestSafeDateInfo?.date
        ? `Earliest safer date: ${earliestSafeDateInfo.formattedDate} (${earliestSafeDateInfo.daysToWait} days away).`
        : `Do not make this purchase until additional income is received or commitments are reduced.`,

    enablingFactor:
      earliestSafeDateInfo?.enablingFactor,

    tag:
      "CRITICAL"
  };
}

/**
 * Converts number to ordinal representation.
 */
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;

  return (
    n +
    (s[(v - 20) % 10] ||
      s[v] ||
      s[0])
  );
}