// db.js
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DB_KEY,
  ssl: { rejectUnauthorized: false } // required on Render
});

export default pool;
