import express from "express";
import pool from "../db.js";
import transporter from "../utils/emailConfig.js";

import Joi from "joi";
import validator from "../utils/validator.js";
import multer from "multer";
import { authenticateToken } from "../middleware/authorization.js";
import { successResponse, errorResponse } from "../utils/response.js"; // ✅ reuse helpers

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 📌 Submit form
router.post("/submitForm", upload.single("pdfFile"), async (req, res) => {
    try {
      const { error, value } = validator(req.body);
      if (error) return errorResponse(res, error, 400);

      const {
        userName, userMobile, userEmail, userAge, userAddress,
        userAadhar, userMonthlyIncome, userElectricityBill,
        receivedAssistance, residenceType, assistanceType, referredBy,
      } = value;

      const pdfPath = req.file ? req.file.path : null;

      const formData = await pool.query(
        `INSERT INTO user_forms
          (user_name, user_mobile, user_email, user_age, user_address, user_aadhar,
            user_monthly_income, user_electricity_bill, received_assistance, residence_type,
            assistance_type, referred_by, pdf_path)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
        RETURNING *`,
        [
          userName, userMobile, userEmail, userAge, userAddress,
          userAadhar, userMonthlyIncome, userElectricityBill,
          receivedAssistance, residenceType, assistanceType, referredBy,
          pdfPath,
        ]
      );

      return successResponse(res, "Form submitted successfully", formData.rows[0]);
    } catch (err) {
      return errorResponse(res, err.message);
    }
});

// 📌 Get all forms
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM user_forms ORDER BY created_at DESC");
    return successResponse(res, "Forms fetched successfully", result.rows);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// 📌 Search by aadhar
router.get("/search/:aadhar", async (req, res) => {
  try {
    const { aadhar } = req.params;
    const result = await pool.query("SELECT * FROM user_forms WHERE user_aadhar = $1", [aadhar]);
    return successResponse(res, "Search result", result.rows);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// 📌 Get single form by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM user_forms WHERE form_id = $1", [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, "Form not found", 404);
    }
    return successResponse(res, "Form fetched successfully", result.rows[0]);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// 📌 Update assistance field
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedAssistance } = req.body;

    const result = await pool.query(
      `UPDATE user_forms
       SET received_assistance = $1
       WHERE form_id = $2
       RETURNING *`,
      [receivedAssistance, id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Form not found", 404);
    }

    return successResponse(res, "Form updated successfully", result.rows[0]);
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

// Update remarks
router.put("/:id/remarks", async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const result = await pool.query(
      `UPDATE user_forms
       SET remarks = $1
       WHERE form_id = $2
       RETURNING *`,
      [remarks, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



export default router;
