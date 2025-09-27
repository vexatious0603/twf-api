// form-routes.js
import express from "express";
import pool from "../db.js";

import { authenticateToken } from "../middleware/authorization.js";
import { successResponse, errorResponse } from "../utils/response.js"; // ✅ reuse helpers

import multer from "multer";
import { s3 } from "../utils/s3.js";


const myBucket = process.env.AWS_BUCKET_NAME


const upload = multer({
  storage:multer.memoryStorage(),
  limits:{fileSize : 5* 1024 * 1024},
});





const router = express.Router();


router.post("/test-upload", upload.single("file"), (req, res) => {
  console.log(req.file);
  res.json(req.file);
});

// 📌 Submit form
router.post("/submitForm", upload.single("file"), async (req, res) => {
  try {
    console.log("FILE DEBUG:", req.file);

     // Check if file exists
    if (!req.file) {
      return errorResponse(res, "No file uploaded. Please select a file.", 400);
    }

    const {
      userName, userMobile, userEmail, userAge, userAddress,
      userAadhar, userMonthlyIncome, userElectricityBill,
      receivedAssistance, residenceType, assistanceType, referredBy,
    } = req.body;

    // upload to S3 using promise
    const params = {
      Bucket: "twf-documents-bucket",
      Key: Date.now() + "-" + req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const data = await s3.upload(params).promise(); // ✅ no callback
    const pdfUrl = data.Location; // correct key

    // insert into db
    const formData = await pool.query(
      `INSERT INTO user_forms
        (user_name, user_mobile, user_email, user_age, user_address, user_aadhar,
         user_monthly_income, user_electricity_bill, received_assistance, residence_type,
         assistance_type, referred_by, pdf_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
       RETURNING *`,
      [
        userName, userMobile, userEmail, userAge, userAddress,
        userAadhar, userMonthlyIncome, userElectricityBill,
        receivedAssistance, residenceType, assistanceType, referredBy,
        pdfUrl,
      ]
    );

    return successResponse(res, "Form submitted successfully", formData.rows[0]);
  } catch (err) {
    console.error("Error:", err);
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
