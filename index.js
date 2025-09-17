// Fix your index.js - move the debug middleware BEFORE the routes

import express, {json} from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {dirname,join} from 'path';
import { fileURLToPath } from 'url';
import userRouter from './routes/users-routes.js';
import authRouter from './routes/auth-routes.js';
import formRoute from './routes/form-routes.js';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3939;
const corsOptions = {credentials:true, origin : process.env.URL || '*'};

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());

// MOVE THIS DEBUG MIDDLEWARE BEFORE THE ROUTES
// Add this enhanced debugging middleware to your index.js BEFORE your routes
app.use((req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('Cookies:', req.cookies);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('=====================');
  
  // Intercept the response to see what's being sent
  const originalSend = res.send;
  res.send = function(data) {
    console.log('=== RESPONSE DEBUG ===');
    console.log('Status:', res.statusCode);
    console.log('Response Data:', data);
    console.log('======================');
    originalSend.call(this, data);
  };
  
  next();
});


app.use('/api/users',userRouter);
app.use('/api/auth',authRouter);
app.use('/api/form',formRoute);
app.use('/uploads', express.static('uploads'));
app.use('/',express.static(join(__dirname,'public')));


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on ${PORT}`);
  console.log(`Test auth routes at: http://localhost:${PORT}/api/auth/test`);
});
