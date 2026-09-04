// Automated Test Suite for MARGIN Core Engines
import assert from 'node:assert';
import { getMockUsers } from '../data/mockData.js';
import { calculateAverageDiscretionaryDailySpend, generateCashFlowForecast, formatDate } from '../engine/forecastEngine.js';
import { evaluateWhatIfPurchase } from '../engine/whatIfEngine.js';
import { parseFinancialQuery } from '../engine/nlpParser.js';

console.log("🧪 Starting MARGIN Core Engine Unit Tests...\n");

const users = getMockUsers();
const aman = users.user_aman;

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// 1. Forecast Engine Tests
console.log("--- Testing Forecast Engine ---");

test("Calculates realistic average discretionary daily spend", () => {
  const avg = calculateAverageDiscretionaryDailySpend(aman.transactions, 60);
  assert(avg > 200 && avg < 1500, `Average daily spend (${avg}) should be realistic (200-1500)`);
});

test("Generates 30-day forecast timeline with correct structure", () => {
  const forecast = generateCashFlowForecast(aman, { daysForward: 30 });
  assert.strictEqual(forecast.timeline.length, 30, "Timeline should have 30 days");
  assert(forecast.summary.minProjectedBalance !== undefined, "Should contain min balance");
  assert(forecast.summary.healthScore >= 0 && forecast.summary.healthScore <= 100, "Health score should be 0-100");
  
  const day1 = forecast.timeline[0];
  assert(day1.date, "Day snapshot should have date");
  assert(day1.closingBalance !== undefined, "Day snapshot should have closing balance");
});

test("Forecast correctly identifies near-misses if balance drops below buffer", () => {
  // Create user with low balance near recurring bill
  const stressedUser = {
    ...aman,
    currentBalance: 12000,
    safetyBufferTarget: 10000,
    incomeDayOfMonth: 28,
    recurringExpenses: [
      { name: "Rent", amount: 8000, dueDayOfMonth: (new Date().getDate() + 2) % 28 || 1 }
    ]
  };
  const forecast = generateCashFlowForecast(stressedUser, { daysForward: 15 });
  assert(forecast.nearMisses.length > 0, "Should detect at least 1 near-miss event");
  assert(forecast.nearMisses[0].maxShortfall > 0, "Near-miss should specify shortfall");
});

// 2. What-If Engine Tests
console.log("\n--- Testing What-If Engine ---");

test("Small purchase is flagged as SAFE", () => {
  const result = evaluateWhatIfPurchase(aman, { amount: 500, description: "Coffee & Snacks" });
  assert.strictEqual(result.verdict, 'SAFE');
  assert.strictEqual(result.isSafe, true);
  assert.strictEqual(result.safeForRazorpayCheckout, true);
});

test("Moderate purchase breaching buffer is flagged as BUFFER_BREACH with Earliest Safe Date", () => {
  // Aman balance: 28,500. Rent: 18,000 due soon. Buffer target: 10,000.
  // A 15,000 spend will drop balance below buffer.
  const result = evaluateWhatIfPurchase(aman, { amount: 15000, description: "Noise Cancelling Headphones" });
  assert(result.verdict === 'BUFFER_BREACH' || result.verdict === 'CRITICAL_OVERDRAFT', `Should breach buffer or overdraft (got ${result.verdict})`);
  assert.strictEqual(result.isSafe, false);
  assert(result.earliestSafeDate !== null, "Should calculate an earliest safe date");
  assert(result.explanation.details.length > 0, "Should provide structured explanation");
});

test("Massive purchase is flagged as CRITICAL_OVERDRAFT", () => {
  const result = evaluateWhatIfPurchase(aman, { amount: 95000, description: "Gaming PC" });
  assert.strictEqual(result.verdict, 'CRITICAL_OVERDRAFT');
  assert.strictEqual(result.canAffordTechnically, false);
  assert.strictEqual(result.safeForRazorpayCheckout, false);
});

// 3. NLP Parser Tests
console.log("\n--- Testing NLP Intent Parser ---");

test("Parses ₹15,000 query correctly", () => {
  const parsed = parseFinancialQuery("Can I spend ₹15,000 today?");
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.amount, 15000);
});

test("Parses 18k notation with product name", () => {
  const parsed = parseFinancialQuery("Can I buy noise cancelling headphones for 18k tomorrow?");
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.amount, 18000);
  assert(parsed.description.toLowerCase().includes("noise cancelling headphones"));
});

test("Parses lakh format (1.5 lakh)", () => {
  const parsed = parseFinancialQuery("Can I spend 1.5 lakh on a bike?");
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.amount, 150000);
});

test("Handles invalid inputs gracefully", () => {
  const parsed = parseFinancialQuery("Hello what is the weather today?");
  assert.strictEqual(parsed.success, false);
  assert(parsed.error.length > 0);
});

console.log(`\n----------------------------------------`);
console.log(`📊 Test Summary: ${passed} / ${total} passed`);
if (passed === total) {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!\n");
  process.exit(0);
} else {
  console.error("❌ Some tests failed.\n");
  process.exit(1);
}
