// MARGIN Backend Server Entrypoint
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import razorpayRoutes from './routes/razorpay.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/api/razorpay', razorpayRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MARGIN Financial Safety Agent', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 MARGIN Financial Safety Agent Server running on http://localhost:${PORT}`);
});
