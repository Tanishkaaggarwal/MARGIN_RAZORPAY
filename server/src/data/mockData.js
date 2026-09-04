// Seed mock data for MARGIN financial safety agent
// Uses dynamic relative day calculations so the demo is always fresh and realistic

function getFormattedDate(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export function getMockUsers() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return {
    "user_aman": {
      id: "user_aman",
      name: "Aman Sharma",
      role: "Junior Software Engineer (Bengaluru)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      currency: "₹",
      currentBalance: 38500,
      safetyBufferTarget: 10000,
      monthlyIncome: 65000,
      incomeDayOfMonth: 1, // Credited on 1st
      incomeSource: "Razorpay Technologies Payroll",
      recurringExpenses: [
        { id: "rec_1", name: "House Rent (Indiranagar)", amount: 18000, dueDayOfMonth: 3, category: "Housing", recipient: "Landlord (Suresh Rao)" },
        { id: "rec_2", name: "MacBook Pro EMI", amount: 5500, dueDayOfMonth: 10, category: "Electronics", recipient: "HDFC Bank" },
        { id: "rec_3", name: "Cult.fit Gym Membership", amount: 1500, dueDayOfMonth: 15, category: "Health & Fitness", recipient: "Cult.fit" },
        { id: "rec_4", name: "ACT Fibernet Broadband", amount: 1199, dueDayOfMonth: 18, category: "Utilities", recipient: "ACT Digital" },
        { id: "rec_5", name: "Netflix & Spotify Premium", amount: 999, dueDayOfMonth: 22, category: "Entertainment", recipient: "Subscription Hub" }
      ],
      // 60-day historical transactions (discretionary spending)
      transactions: generateRealisticTransactions(60, 28500, 65000, 1)
    },
    "user_riya": {
      id: "user_riya",
      name: "Riya Sen",
      role: "Design Intern & Final Year Student",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      currency: "₹",
      currentBalance: 7400,
      safetyBufferTarget: 3000,
      monthlyIncome: 18000,
      incomeDayOfMonth: 5,
      incomeSource: "Design Studio Stipend",
      recurringExpenses: [
        { id: "rec_r1", name: "PG Accommodation Share", amount: 8000, dueDayOfMonth: 6, category: "Housing", recipient: "Zolo Stays" },
        { id: "rec_r2", name: "Campus Mess Card", amount: 3000, dueDayOfMonth: 8, category: "Food", recipient: "College Mess" },
        { id: "rec_r3", name: "Namma Metro Pass", amount: 1000, dueDayOfMonth: 12, category: "Commute", recipient: "BMRCL" },
        { id: "rec_r4", name: "Adobe Cloud & Jio Fiber", amount: 699, dueDayOfMonth: 20, category: "Utilities", recipient: "Adobe Inc" }
      ],
      transactions: generateRealisticTransactions(60, 7400, 18000, 5, 0.4)
    }
  };
}

function generateRealisticTransactions(daysBack, currentBalance, salary, salaryDay, scale = 1.0) {
  const transactions = [];
  const categories = [
    { name: "Food & Dining", vendors: ["Swiggy", "Zomato", "Third Wave Coffee", "Corner House Ice Cream", "Chai Point"], min: 120, max: 450 },
    { name: "Groceries", vendors: ["Blinkit", "Zepto", "Nature's Basket", "Instamart"], min: 180, max: 600 },
    { name: "Commute", vendors: ["Uber India", "Ola Cabs", "Rapido Auto", "Namma Metro"], min: 60, max: 280 },
    { name: "Shopping", vendors: ["Myntra", "Amazon India", "Decathlon", "Uniqlo"], min: 350, max: 1200 },
    { name: "Entertainment", vendors: ["BookMyShow", "Steam Games", "PVR Cinemas"], min: 250, max: 750 }
  ];

  const now = new Date();

  // Generate 1-2 variable transactions per day with occasional 0-spend days
  for (let i = daysBack; i >= 1; i--) {
    const txDate = new Date();
    txDate.setDate(now.getDate() - i);
    const dateStr = txDate.toISOString().split('T')[0];

    // Check if it's salary day
    if (txDate.getDate() === salaryDay) {
      transactions.push({
        id: `tx_salary_${i}`,
        date: dateStr,
        amount: salary,
        type: "credit",
        category: "Salary & Income",
        description: "Monthly Salary Credit via RazorpayX Payroll",
        isRecurring: true
      });
    }

    // Spend frequency: 1 transaction most days, 2 on weekends, occasional 0
    const numTxs = (i % 7 === 0 || i % 7 === 6) ? 2 : (i % 5 === 0 ? 0 : 1);

    for (let j = 0; j < numTxs; j++) {
      const cat = categories[(i * 3 + j) % categories.length];
      const vendor = cat.vendors[(i + j) % cat.vendors.length];
      const rawAmount = Math.floor(cat.min + ((i * 37 + j * 91) % (cat.max - cat.min)));
      const amount = Math.round(rawAmount * scale);

      transactions.push({
        id: `tx_${i}_${j}`,
        date: dateStr,
        amount: amount,
        type: "debit",
        category: cat.name,
        description: `${vendor} Payment`,
        isRecurring: false
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}
