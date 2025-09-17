import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import { jwtTokens } from '../utils/jwt-helpers.js';
import transporter from "../utils/emailConfig.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();


// Add this to test your database connection - create a test route in your auth-routes.js
router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    res.json({ success: true, time: result.rows[0] });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: error.message,
      code: error.code 
    });
  }
});

// Test if your admin table exists
router.get('/test-admin-table', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM admin');
    console.log('Admin table accessible, row count:', result.rows[0].count);
    res.json({ success: true, adminCount: result.rows[0].count });
  } catch (error) {
    console.error('Admin table error:', error);
    res.status(500).json({ 
      error: 'Admin table access failed', 
      details: error.message,
      code: error.code 
    });
  }
});


// Add this to your auth-routes.js for testing
router.get('/test-simple', async (req, res) => {
    try {
        console.log('Simple test route called');
        res.json({ 
            message: 'Auth route working!', 
            timestamp: new Date().toISOString() 
        });
    } catch (error) {
        console.error('Test route error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/test-db-simple', async (req, res) => {
    try {
        console.log('Testing database connection...');
        const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as admin_count FROM admin');
        console.log('Database test successful');
        res.json({ 
            success: true, 
            currentTime: result.rows[0].current_time,
            adminCount: result.rows[0].admin_count
        });
    } catch (error) {
        console.error('Database test failed:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            code: error.code
        });
    }
});


// LOGIN
router.post('/login', async (req, res) => {
  try {

    console.log("LOGIN CALLED");
console.log("HEADERS:", req.headers);
console.log("BODY:", req.body);


    const { email, password } = req.body;
    const adminData = await pool.query('SELECT * FROM admin WHERE admin_email = $1', [email]);

    if (adminData.rows.length === 0) {
      return errorResponse(res, "Email is incorrect", 401);
    }

    const admin = adminData.rows[0];

    if (!admin.active) {
      return errorResponse(res, "Please verify your email before logging in.", 401);
    }

    const validPassword = await bcrypt.compare(password, admin.admin_password);
    if (!validPassword) {
      return errorResponse(res, "Incorrect password", 401);
    }

    let tokens = jwtTokens(admin);

    res.cookie('refresh_token', tokens.refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // only secure in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});


    return successResponse(res, "Login successful", tokens);
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, error.message, 500);
  }
});

// VERIFY EMAIL
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.send(`
        <html>
          <head><title>Verification Failed</title></head>
          <body>
            <h2>❌ Verification token is required</h2>
          </body>
        </html>
      `);
    }

    const tokenResult = await pool.query(
      "SELECT admin_id FROM admin_verification_token WHERE token = $1",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.send(`
        <html>
          <head><title>Verification Failed</title></head>
          <body>
            <h2>❌ Invalid or expired token</h2>
            <p>Please request a new verification email.</p>
          </body>
        </html>
      `);
    }

    const adminId = tokenResult.rows[0].admin_id;

    // Update user to active
    await pool.query("UPDATE admin SET active = true WHERE admin_id = $1", [adminId]);
    // Delete the verification token
    await pool.query("DELETE FROM admin_verification_token WHERE token = $1", [token]);

    // Display HTML success page
    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; background-color: #f5f5f5; }
            .container { background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: inline-block; }
            .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ Email Verified Successfully!</div>
            <p>Your account has been activated. You can now log in.</p>
            <p>You can close this window and return to your application.</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h2>❌ Something went wrong</h2>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

// TEST ROUTE
router.get("/test", (req, res) => {
  return successResponse(res, "Auth routes are working!", {
    timestamp: new Date(),
    fullUrl: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

// REFRESH TOKEN (stub)
router.post('/refresh_token', (req, res) => {

try {
     const {refreshToken} = req.body;

     if(!refreshToken){
        return errorResponse(res,"No refresh token provided",401);
     }

     jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err,user)=>{
        if(err){
            return errorResponse(res,"Invalid refresh token",403)
        }
        const tokens = jwtTokens(user);
        return successResponse(res, "Token refreshed", tokens); 
     })

} catch (error) {
  return errorResponse(res,err.message,500);
}


});

// DELETE REFRESH TOKEN (stub)
router.delete('/refresh_token', (req, res) => {
  return successResponse(res, "Refresh token deleted");
});

export default router;
