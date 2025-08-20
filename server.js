import express from "express";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;
const app = express();
app.use(cors());
//app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pool = new Pool({
  connectionString: process.env.DB_KEY,
  ssl: { rejectUnauthorized: false }
});
const transporter = nodemailer.createTransport({
  service:"gmail",
  secure: true, // true for port 465
  auth: {
    user: "sri200279@gmail.com", // your Gmail address
    pass: "xfxp exnq laya ncbd"  // App Password
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP server is ready:", success);
  }
});

app.get("/",(req,res)=>{
  res.sendFile(__dirname+"/admin.html");
})

// 📁 Ensure payments.json exists
app.post("/submit-payment", async (req, res) => {
  const { name, email, upiRef } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO payments (name, email, upiRef) VALUES ($1, $2, $3) RETURNING *",
      [name, email, upiRef]
    );
    res.json({ success: true, payment: result.rows[0] });
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/payments", async (req, res) => {
  const result = await pool.query("SELECT * FROM payments");
  res.json(result.rows);
});


app.post("/approve-payment",  async(req, res) => {
  const { id: paymentId } = req.query;
 try {
    // Mark payment verified
     if (!id) return res.status(400).json({ error: "paymentId is required" });
    await pool.query("UPDATE payments SET verified = true WHERE id = $1", [id]);

    // Generate credentials
    const studentId = "student" + Math.floor(Math.random() * 1000);
    const password = "pass" + Math.floor(Math.random() * 1000);

    // Save user
    await pool.query(
      "INSERT INTO users (id, password) VALUES ($1, $2)",
      [studentId, password]
    );

    // Fetch payment for email
    const paymentRes = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
   if (!paymentRes) {
      return res.status(404).json({ error: "Payment not found" });
    }
    const payment = paymentRes.rows[0];
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    console.log("Sending mail to:", payment.email);
    // Send email
    await transporter.sendMail({
      from: "sri200279@gmail.com",
      to: payment.email,
      subject: "Your Login Credentials",
      text: `Hello ${payment.name},\n\nYour login details:\nID: ${studentId}\nPassword: ${password}`
    });

    res.json({ success: true, message: "Payment approved and user created" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/check-login", async (req, res) => {
  const { id, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE userid = $1 AND password = $2",
      [id, password]
    );
    if (result.rows.length > 0) {
      res.json({ success: true, message: "Login successful", user: result.rows[0] });
    } else {
      res.json({ success: false, message: "Invalid ID or Password" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/reject-payment/:id", async (req, res) => {
  const paymentId = req.params.id;
  try {
    await pool.query("UPDATE payments SET verified = false WHERE id = $1", [paymentId]);
    res.json({ success: true, message: "Payment rejected" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/init", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        upiRef VARCHAR(100),
        verified BOOLEAN DEFAULT false
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(50) UNIQUE,
        password VARCHAR(50)
      );
    `);

    res.json({ success: true, message: "Tables created or already exist ✅" });
  } catch (err) {
    console.error("Init error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));








































