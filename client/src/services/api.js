// API client for MARGIN Backend

const BASE_URL = '/api';

export async function fetchUserData() {
  const res = await fetch(`${BASE_URL}/user`);
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) throw new Error("Failed to load user personas");
  return res.json();
}

export async function switchUser(userId) {
  const res = await fetch(`${BASE_URL}/user/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error("Failed to switch persona");
  return res.json();
}

export async function updateBufferTarget(bufferTarget) {
  const res = await fetch(`${BASE_URL}/user/buffer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bufferTarget })
  });
  if (!res.ok) throw new Error("Failed to update buffer target");
  return res.json();
}

export async function fetchForecast(days = 30) {
  const res = await fetch(`${BASE_URL}/forecast?days=${days}`);
  if (!res.ok) throw new Error("Failed to generate forecast");
  return res.json();
}

export async function runWhatIf(amount, date = null, description = null) {
  const res = await fetch(`${BASE_URL}/what-if`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, date, description })
  });
  if (!res.ok) throw new Error("Failed to evaluate what-if simulation");
  return res.json();
}

export async function sendChatMessage(message) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error("Failed to process financial query");
  return res.json();
}

export async function fetchNearMisses() {
  const res = await fetch(`${BASE_URL}/near-misses`);
  if (!res.ok) throw new Error("Failed to load near-miss intelligence");
  return res.json();
}

export async function requestRazorpayCheckout(payload) {
  const res = await fetch(`${BASE_URL}/razorpay/shield-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
