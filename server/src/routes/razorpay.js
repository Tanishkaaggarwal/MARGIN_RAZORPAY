// Razorpay Integration Hook for MARGIN Hackathon Prototype
// Provides "MARGIN Safe Checkout Shield" using Razorpay Orders / Payment Link simulation

import express from 'express';
const router = express.Router();

/**
 * Simulates or verifies a checkout transaction through Razorpay
 * Only permits instant checkout if approved by MARGIN Safety Engine
 */
router.post('/shield-checkout', (req, res) => {
  try {
    const { amount, description, isSafe, earliestSafeDate, user } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const orderId = `order_margin_${Date.now()}`;
    const paymentLinkId = `plink_margin_${Math.random().toString(36).substring(2, 9)}`;

    if (!isSafe) {
      return res.status(403).json({
        allowed: false,
        status: "BLOCKED_BY_MARGIN_SHIELD",
        message: "MARGIN Shield prevented this instant transaction to safeguard your safety buffer.",
        recommendation: earliestSafeDate 
          ? `Earliest safe date is ${earliestSafeDate.formattedDate}. We can schedule a Razorpay Payment Mandate for that date.`
          : "Insufficient projected balance.",
        scheduledOptionAvailable: true,
        scheduledDate: earliestSafeDate?.date || null
      });
    }

    // Transaction is safe! Return simulated Razorpay checkout parameters
    return res.json({
      allowed: true,
      status: "APPROVED_BY_MARGIN_SHIELD",
      orderId,
      paymentLinkId,
      paymentUrl: `https://rzp.io/i/${paymentLinkId}`,
      amountInPaise: Math.round(amount * 100),
      currency: "INR",
      merchantName: "MARGIN Safe Checkout Partner",
      description: description || "Pre-verified Safe Spend",
      safetyShieldToken: `shield_token_${Math.random().toString(36).substring(2, 12)}`,
      audit: {
        verifiedAt: new Date().toISOString(),
        userSafetyBufferProtected: true,
        projectedBalanceHealthy: true
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
