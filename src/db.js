import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
  url: process.env.DATABASE_URL || "http://127.0.0.1:8080",
  authToken: process.env.DATABASE_AUTH_TOKEN, // only needed for remote Turso instances
});

export async function initDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_wallets (
        user_id INTEGER PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function saveUserWallet(userId, walletAddress) {
  try {
    await db.execute({
      sql: "INSERT OR REPLACE INTO user_wallets (user_id, wallet_address) VALUES (?, ?)",
      args: [userId, walletAddress],
    });
  } catch (error) {
    console.error("Error saving user wallet:", error);
    throw error;
  }
}

export async function getUserWallet(userId) {
  try {
    const result = await db.execute({
      sql: "SELECT wallet_address FROM user_wallets WHERE user_id = ?",
      args: [userId],
    });
    return result.rows[0]?.wallet_address;
  } catch (error) {
    console.error("Error fetching user wallet:", error);
    throw error;
  }
}

export async function getAllUserWallets(batchSize = 100) {
  try {
    const result = await db.execute(
      `SELECT user_id, wallet_address FROM user_wallets LIMIT ?`,
      [batchSize]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching all user wallets:", error);
    throw error;
  }
}
