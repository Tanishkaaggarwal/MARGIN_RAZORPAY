// Cash Flow Forecast Engine for MARGIN
// Projects daily balance forward 30-60 days and detects near-misses

/**
 * Calculates average daily discretionary spending from non-recurring debit transactions
 */
export function calculateAverageDiscretionaryDailySpend(transactions, defaultDays = 60) {
  if (!transactions || transactions.length === 0) {
    return 450; // reasonable fallback
  }

  const variableDebits = transactions.filter(tx => tx.type === 'debit' && !tx.isRecurring);
  if (variableDebits.length === 0) return 400;

  const totalSpent = variableDebits.reduce((sum, tx) => sum + tx.amount, 0);

  // Find actual span of days in transactions
  const dates = variableDebits.map(tx => new Date(tx.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const diffDays = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)));

  const daysSpan = Math.min(Math.max(diffDays, 14), defaultDays);
  return Math.round(totalSpent / daysSpan);
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates the day-by-day cash flow forecast timeline
 * 
 * @param {Object} user 
 * @param {Object} options { startDate, daysForward, hypotheticalExpense, avgDailySpendOverride }
 * @returns {Object} { timeline, nearMisses, summary, avgDailySpend }
 */
export function generateCashFlowForecast(user, options = {}) {
  const startDate = options.startDate ? new Date(options.startDate) : new Date();
  const daysForward = options.daysForward || 30;
  const hypotheticalExpense = options.hypotheticalExpense || null; // { amount, date, description }

  const avgDailySpend = options.avgDailySpendOverride !== undefined 
    ? options.avgDailySpendOverride 
    : calculateAverageDiscretionaryDailySpend(user.transactions, 60);

  const timeline = [];
  let runningBalance = user.currentBalance;
  const bufferTarget = user.safetyBufferTarget;

  // Track near-miss episodes
  const nearMisses = [];
  let currentEpisode = null;

  for (let i = 0; i < daysForward; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = formatDate(currentDate);
    const dayOfMonth = currentDate.getDate();
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });

    let incomeToday = 0;
    const incomeDetails = [];

    // Check if salary / monthly income is credited today
    if (dayOfMonth === user.incomeDayOfMonth) {
      incomeToday += user.monthlyIncome;
      incomeDetails.push({
        source: user.incomeSource || "Monthly Salary",
        amount: user.monthlyIncome
      });
    }

    // Check for scheduled recurring expenses
    let recurringToday = 0;
    const recurringDetails = [];
    if (user.recurringExpenses && user.recurringExpenses.length > 0) {
      for (const bill of user.recurringExpenses) {
        if (bill.dueDayOfMonth === dayOfMonth) {
          recurringToday += bill.amount;
          recurringDetails.push({ ...bill });
        }
      }
    }

    // Check for hypothetical expense inserted on this date
    let hypotheticalToday = 0;
    let hypotheticalDetails = null;
    if (hypotheticalExpense && hypotheticalExpense.amount > 0) {
      const hypDateStr = hypotheticalExpense.date || formatDate(startDate);
      if (dateStr === hypDateStr) {
        hypotheticalToday = Number(hypotheticalExpense.amount);
        hypotheticalDetails = {
          amount: hypotheticalToday,
          description: hypotheticalExpense.description || "Hypothetical Purchase"
        };
      }
    }

    // Calculate balance at start, inflows, outflows, and end
    const openingBalance = runningBalance;
    const discretionaryToday = avgDailySpend;
    
    // Balance calculation formula:
    // Balance_t = Balance_{t-1} + Income_t - Recurring_t - Discretionary_t - Hypothetical_t
    runningBalance = Math.round(openingBalance + incomeToday - recurringToday - discretionaryToday - hypotheticalToday);

    const isBufferBreached = runningBalance < bufferTarget;
    const isOverdraft = runningBalance < 0;
    const bufferShortfall = isBufferBreached ? (bufferTarget - runningBalance) : 0;

    const daySnapshot = {
      date: dateStr,
      dayIndex: i,
      dayName,
      dayOfMonth,
      openingBalance,
      closingBalance: runningBalance,
      incomeToday,
      incomeDetails,
      recurringToday,
      recurringDetails,
      discretionaryToday,
      hypotheticalToday,
      hypotheticalDetails,
      bufferTarget,
      isBufferBreached,
      isOverdraft,
      bufferShortfall
    };

    timeline.push(daySnapshot);

    // Near-Miss tracking: episode detection
    if (isBufferBreached) {
      if (!currentEpisode) {
        // Find which recent/upcoming event triggered this breach
        const primaryCause = determineBreachCause(daySnapshot, timeline);
        currentEpisode = {
          id: `nm_${dateStr}_${i}`,
          startDate: dateStr,
          lowestBalance: runningBalance,
          lowestDate: dateStr,
          maxShortfall: bufferShortfall,
          cause: primaryCause.text,
          triggerItem: primaryCause.item,
          isOverdraft: isOverdraft,
          daysInBreach: 1
        };
      } else {
        currentEpisode.daysInBreach += 1;
        if (runningBalance < currentEpisode.lowestBalance) {
          currentEpisode.lowestBalance = runningBalance;
          currentEpisode.lowestDate = dateStr;
          currentEpisode.maxShortfall = bufferShortfall;
        }
        if (isOverdraft) {
          currentEpisode.isOverdraft = true;
        }
      }
    } else {
      if (currentEpisode) {
        // Episode ended and recovered
        currentEpisode.recoveryDate = dateStr;
        currentEpisode.severity = currentEpisode.isOverdraft ? 'critical' : (currentEpisode.maxShortfall > 5000 ? 'high' : 'moderate');
        currentEpisode.preventiveAction = generatePreventiveAction(currentEpisode, user);
        nearMisses.push(currentEpisode);
        currentEpisode = null;
      }
    }
  }

  // If an episode was active at the end of horizon
  if (currentEpisode) {
    currentEpisode.recoveryDate = "Beyond forecast horizon";
    currentEpisode.severity = currentEpisode.isOverdraft ? 'critical' : (currentEpisode.maxShortfall > 5000 ? 'high' : 'moderate');
    currentEpisode.preventiveAction = generatePreventiveAction(currentEpisode, user);
    nearMisses.push(currentEpisode);
  }

  // Summary Metrics
  const minBalance = Math.min(...timeline.map(d => d.closingBalance));
  const minDay = timeline.find(d => d.closingBalance === minBalance);
  const maxBalance = Math.max(...timeline.map(d => d.closingBalance));
  const breachDaysCount = timeline.filter(d => d.isBufferBreached).length;
  const overdraftDaysCount = timeline.filter(d => d.isOverdraft).length;

  // Financial safety score (0 to 100)
  // Evaluates buffer cushion, breach frequency, and minimum trough
  const bufferRatio = minBalance / (bufferTarget || 1);
  let healthScore = 100;
  if (minBalance < 0) {
    healthScore = Math.max(0, Math.round(30 - (Math.abs(minBalance) / 1000)));
  } else if (minBalance < bufferTarget) {
    healthScore = Math.max(35, Math.round(35 + (bufferRatio * 45)));
  } else {
    healthScore = Math.min(100, Math.round(80 + (Math.min(minBalance - bufferTarget, 20000) / 1000)));
  }

  return {
    timeline,
    nearMisses,
    summary: {
      currentBalance: user.currentBalance,
      safetyBufferTarget: user.safetyBufferTarget,
      minProjectedBalance: minBalance,
      minBalanceDate: minDay ? minDay.date : null,
      maxProjectedBalance: maxBalance,
      breachDaysCount,
      overdraftDaysCount,
      healthScore,
      safetyStatus: minBalance >= bufferTarget ? 'healthy' : (minBalance >= 0 ? 'buffer_at_risk' : 'critical_deficit')
    },
    avgDailySpend
  };
}

/**
 * Identifies the specific expense or condition that caused the balance to drop below buffer
 */
function determineBreachCause(daySnapshot, timeline) {
  // If recurring bill paid today
  if (daySnapshot.recurringToday > 0 && daySnapshot.recurringDetails.length > 0) {
    const largest = [...daySnapshot.recurringDetails].sort((a, b) => b.amount - a.amount)[0];
    return {
      text: `${largest.name} (₹${largest.amount.toLocaleString('en-IN')}) due on ${daySnapshot.date}`,
      item: largest
    };
  }

  // If hypothetical purchase happened today
  if (daySnapshot.hypotheticalToday > 0) {
    return {
      text: `Hypothetical spend of ₹${daySnapshot.hypotheticalToday.toLocaleString('en-IN')} on ${daySnapshot.date}`,
      item: daySnapshot.hypotheticalDetails
    };
  }

  // Look back 1-3 days for the recent bill that dragged the balance down
  const currentIndex = daySnapshot.dayIndex;
  for (let b = currentIndex - 1; b >= Math.max(0, currentIndex - 3); b--) {
    const prev = timeline[b];
    if (prev && prev.recurringToday > 0) {
      const largest = [...prev.recurringDetails].sort((x, y) => y.amount - x.amount)[0];
      return {
        text: `Preceding bill ${largest.name} (₹${largest.amount.toLocaleString('en-IN')}) on ${prev.date}`,
        item: largest
      };
    }
  }

  return {
    text: `Cumulative discretionary spend before next salary credit`,
    item: null
  };
}

/**
 * Generates an actionable preventive recommendation for avoiding the near-miss
 */
function generatePreventiveAction(episode, user) {
  if (episode.isOverdraft) {
    return `Critical cash shortfall of ₹${Math.abs(episode.lowestBalance).toLocaleString('en-IN')}. Delay non-essential spends or reschedule upcoming commitments.`;
  }
  if (episode.triggerItem && episode.triggerItem.amount) {
    return `Buffer dips by ₹${episode.maxShortfall.toLocaleString('en-IN')}. Consider shifting ${episode.triggerItem.name} or curbing discretionary spend by ₹${Math.round(episode.maxShortfall / Math.max(1, episode.daysInBreach))} / day.`;
  }
  return `Target buffer breached by ₹${episode.maxShortfall.toLocaleString('en-IN')}. Rebuilding ₹${episode.maxShortfall} cushion before ${episode.startDate} ensures safety.`;
}
