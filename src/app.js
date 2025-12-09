// app.js - FIXED ORDER FOR STRIPE WEBHOOK
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import xssClean from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

import logger from './core/config/logger.js';
import errorHandler from './core/middlewares/errorMiddleware.js';
import notFound from './core/middlewares/notFound.js';
import { globalLimiter } from './lib/limit.js';
import appRouter from './core/app/appRouter.js';
import { stripeWebhookHandler } from './entities/webhook.js';
import { connectedAccountWebhookHandler } from './entities/webhookAccounts.js';
//import { startReminderJob } from './lib/reminderJob.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Stripe webhook route FIRST — must be raw body
app.post('/api/v1/webhook/main', express.raw({ type: 'application/json' }), stripeWebhookHandler);
app.post('/api/v1/webhook/connected', express.raw({ type: '*/*' }), connectedAccountWebhookHandler);


// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', "PATCH",'OPTIONS'],
}));
app.use(xssClean());
app.use(mongoSanitize());
app.use(morgan('combined'));
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/v1/webhook/main') ||  req.originalUrl.startsWith('/api/v1/webhook/connected')) {
    // Skip JSON parsing, Stripe needs raw body
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(globalLimiter);

// Static files
const uploadPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadPath));

// Home route
app.get('/', (req, res) => {
  res.send({ message: 'Server is running' });
});

// API routes
app.use('/api', appRouter);




// Socket IO setup
const server = createServer(app);

export const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});


io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("registerUser", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });

  socket.on("joinRoom", (room) => {
    socket.join(`room-${room}`);
    console.log(`Client joined chat room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});


// registerUser → global communication || for personal notifications (new chat, new message alert).

// joinRoom → scoped communication || for live chat sessions (realtime messages inside the room).


// Error handling
app.use(notFound);
app.use(errorHandler);

logger.info('Middleware stack initialized');

//startReminderJob();

export { server, app };
