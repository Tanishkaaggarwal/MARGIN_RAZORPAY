// Rule-based Natural Language Processing Parser for Financial Safety Agent
// Extracts purchase amount, product/intent description, and requested date from natural queries

import { formatDate } from './forecastEngine.js';

/**
 * Parses user natural language query into structured purchase intent
 * 
 * @param {string} text 
 * @returns {Object} { amount, description, date, confidence, rawQuery }
 */
export function parseFinancialQuery(text) {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: "Please enter a question or spending amount (e.g., 'Can I spend ₹15,000 today?')"
    };
  }

  const cleanText = text.trim();

  // 1. Extract Amount
  const amount = extractAmount(cleanText);
  if (!amount || isNaN(amount) || amount <= 0) {
    return {
      success: false,
      error: "Couldn't detect a valid spending amount. Try: 'Can I spend ₹15,000 on a laptop?'"
    };
  }

  // 2. Extract Date (defaults to today)
  const targetDate = extractDate(cleanText);

  // 3. Extract Description / Item Intent
  const description = extractDescription(cleanText, amount);

  return {
    success: true,
    amount,
    date: targetDate,
    description,
    rawQuery: cleanText
  };
}

/**
 * Extracts numeric amount handling INR currency notations:
 * ₹15,000, Rs. 15000, 15k, 1.5L, 1.5 lakh, 15 thousand
 */
function extractAmount(text) {
  // Check for lakh format: "1.5 lakh", "2 lakhs", "1.5L", "2L"
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lakh|l)\b/i);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 100000);
  }

  // Check for 'k' / thousand format: "15k", "15 thousand"
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  // Check for currency symbols and numeric amounts: "₹15,000", "Rs. 15000", "INR 15000", "15000"
  const standardMatch = text.match(/(?:(?:₹|rs\.?|inr)\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/i);
  if (standardMatch) {
    const rawDigits = standardMatch[1].replace(/,/g, '');
    return parseInt(rawDigits, 10);
  }

  return null;
}

/**
 * Extracts target date based on temporal words
 */
function extractDate(text) {
  const lower = text.toLowerCase();
  const d = new Date();

  if (lower.includes('tomorrow')) {
    d.setDate(d.getDate() + 1);
  } else if (lower.includes('day after tomorrow')) {
    d.setDate(d.getDate() + 2);
  } else if (lower.includes('this weekend') || lower.includes('weekend')) {
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSat);
  } else if (lower.includes('next week')) {
    d.setDate(d.getDate() + 7);
  } else if (lower.includes('next month')) {
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
  }

  return formatDate(d);
}

/**
 * Extracts clean description of what the user is planning to buy
 */
function extractDescription(text, amount) {
  let cleaned = text;

  // Remove common prefix phrases
  cleaned = cleaned.replace(/can i (?:spend|afford|buy|purchase|pay for)/i, '');
  cleaned = cleaned.replace(/should i (?:buy|spend on|purchase|get)/i, '');
  cleaned = cleaned.replace(/is it safe to (?:spend|buy|purchase)/i, '');
  cleaned = cleaned.replace(/what happens if i (?:spend|buy)/i, '');
  cleaned = cleaned.replace(/how about (?:spending|buying)/i, '');

  // Remove temporal words
  cleaned = cleaned.replace(/\b(today|tomorrow|this weekend|next week|now|tonight|right now)\b/gi, '');

  // Remove amount fragments
  cleaned = cleaned.replace(new RegExp(`(?:₹|rs\\.?|inr)?\\s*${amount}`, 'gi'), '');
  cleaned = cleaned.replace(/(?:₹|rs\.?|inr)\s*[\d,]+(?:\.\d+)?/gi, '');
  cleaned = cleaned.replace(/\b\d+\s*(?:k|thousand|lakhs?|l)\b/gi, '');

  // Remove punctuation and cleanup filler prepositions
  cleaned = cleaned.replace(/[?.,!]/g, ' ');
  cleaned = cleaned.replace(/\b(for|on|worth of|a|an|the)\b/gi, ' ');
  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  if (!cleaned || cleaned.length < 2) {
    return "Planned Purchase";
  }

  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
