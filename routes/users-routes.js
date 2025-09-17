import express from "express";
import pool from "../db.js";
import bcrypt from "bcrypt";
import { authenticateToken } from "../middleware/authorization.js";
import crypto from "crypto";
import transporter from "../utils/emailConfig.js";
import { successResponse, errorResponse } from "../utils/response.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await pool.query("SELECT * FROM admin");
    return successResponse(res, "Admins fetched successfully", users.rows);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

router.post("/registerAdmin", async (req, res) => {
  try {
    const verificationToken = crypto.randomBytes(64).toString("hex");

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newAdmin = await pool.query(
      "INSERT INTO admin(admin_name, trust_name, admin_mobile, admin_email, admin_password) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        req.body.adminName,
        req.body.trustName,
        req.body.adminMobile,
        req.body.adminEmail,
        hashedPassword,
      ]
    );

    const adminId = newAdmin.rows[0].admin_id;

    await pool.query(
      "INSERT INTO admin_verification_token(admin_id, token) VALUES($1, $2)",
      [adminId, verificationToken]
    );

    const verificationLink = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;

    console.log(verificationLink);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: req.body.adminEmail,
      subject: "Verify Your Email Address",
      html: `
        <h2>Welcome!</h2>
        <p>Click the link to verify:</p>
        <a href="${verificationLink}">Verify Email</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    return successResponse(
      res,
      "Registration successful! Please verify your email.",
      {
        email: req.body.adminEmail,
        ...(process.env.NODE_ENV === "development" && {
          dev_verification_link: verificationLink,
        }),
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse(res, error.message, 500);
  }
});

router.delete("/delete", async (req, res) => {
  try {
    await pool.query("DELETE FROM admin");
    return successResponse(res, "All admins deleted", null, 200);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
});

export default router;
