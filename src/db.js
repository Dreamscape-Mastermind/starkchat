import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
  url: process.env.DATABASE_URL || "http://127.0.0.1:8080",
  authToken: process.env.DATABASE_AUTH_TOKEN, // only needed for remote Turso instances
});

// Initialize database tables
export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_wallets (
      user_id INTEGER PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function saveUserWallet(userId, walletAddress) {
  await db.execute({
    sql: "INSERT OR REPLACE INTO user_wallets (user_id, wallet_address) VALUES (?, ?)",
    args: [userId, walletAddress],
  });
}

export async function getUserWallet(userId) {
  const result = await db.execute({
    sql: "SELECT wallet_address FROM user_wallets WHERE user_id = ?",
    args: [userId],
  });
  return result.rows[0]?.wallet_address;
}

export async function getAllUserWallets() {
  const result = await db.execute(
    "SELECT user_id, wallet_address FROM user_wallets"
  );
  return result.rows;
}
