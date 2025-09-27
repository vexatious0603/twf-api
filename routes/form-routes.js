// form-routes.js
import express from "express";
import pool from "../db.js";

import { authenticateToken } from "../middleware/authorization.js";
import { successResponse, errorResponse } from "../utils/response.js"; // ✅ reuse helpers

import multer from "multer";
import { s3 } from "../utils/s3.js";


const myBucket = process.env.AWS_BUCKET_NAME


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});




const router = express.Router();


router.post("/test-upload", upload.single("file"), (req, res) => {
  console.log(req.file);
  res.json(req.file);
});

//📌 Submit form
router.post(
  "/submitForm",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "electricity", maxCount: 1 },
    { name: "income", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("FILES DEBUG:", req.files);

      if (!req.files || Object.keys(req.files).length === 0) {
        return errorResponse(res, "No files uploaded. Please select files.", 400);
      }

      const {
        userName, userMobile, userEmail, userAge, userAddress,
        userAadhar, userMonthlyIncome, userElectricityBill,
        receivedAssistance, residenceType, assistanceType, referredBy,
        familyMembers, // 🔹 added
      } = req.body;

      // insert main form data
      const formData = await pool.query(
        `INSERT INTO user_forms
          (user_name, user_mobile, user_email, user_age, user_address, user_aadhar,
           user_monthly_income, user_electricity_bill, received_assistance, residence_type,
           assistance_type, referred_by, family_members)  -- 🔹 added
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
         RETURNING form_id`,
        [
          userName, userMobile, userEmail, userAge, userAddress,
          userAadhar, userMonthlyIncome, userElectricityBill,
          receivedAssistance, residenceType, assistanceType, referredBy,
          familyMembers, // 🔹 added
        ]
      );

      const formId = formData.rows[0].form_id;

      // loop through each field in req.files
      for (const fieldName in req.files) {
        const file = req.files[fieldName][0];
        const params = {
          Bucket: "twf-documents-bucket",
          Key: Date.now() + "-" + file.originalname,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const data = await s3.upload(params).promise();
        const pdfUrl = data.Location;

        await pool.query(
          `INSERT INTO user_documents (user_form_id, doc_type, doc_url) 
           VALUES ($1,$2,$3)`,
          [formId, fieldName, pdfUrl]
        );
      }

      return successResponse(res, "Form submitted successfully", { formId });
    } catch (err) {
      console.error("Error:", err);
      return errorResponse(res, err.message);
    }
  }
);



// 📌 Get all forms
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        uf.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ud.id,
              'doc_type', ud.doc_type,
              'doc_url', ud.doc_url,
              'uploaded_at', ud.uploaded_at
            )
          ) FILTER (WHERE ud.id IS NOT NULL),
          '[]'
        ) AS documents
      FROM user_forms uf
      LEFT JOIN user_documents ud 
        ON uf.form_id = ud.user_form_id
      GROUP BY uf.form_id
      ORDER BY uf.created_at ASC;
    `);

    return successResponse(res, "Forms with documents fetched successfully", result.rows);
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
    const { assisted } = req.body;

    const result = await pool.query(
      `UPDATE user_forms
       SET assisted = $1
       WHERE form_id = $2
       RETURNING *`,
      [assisted, id]
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
