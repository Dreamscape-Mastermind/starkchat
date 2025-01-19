import { getAllUserWallets, initDatabase } from "./db.js";
import {
  handleJoin,
  handleSignature,
  handleStart,
  handleWallet,
} from "./commands.js";

import TelegramBot from "node-telegram-bot-api";
import { connect } from "./starknet.js";
import { cookieJar } from "./cookies.js";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const groupId = process.env.TELEGRAM_GROUP_ID;
const frontendUrl = process.env.FRONTEND_URL;

if (!token || !groupId || !frontendUrl) {
  console.error(
    "TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_ID and FRONTEND_URL are required"
  );
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(token, {
  polling: true,
  request: { jar: cookieJar },
});

// Initialize express app
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Store challenges
const challenges = new Map();

// Initialize database and Starknet connection
const provider = connect();
await initDatabase();

// API endpoints
app.post("/api/verify", async (req, res) => {
  const { userId, walletAddress, signature } = req.body;

  try {
    const challenge = challenges.get(userId);
    if (!challenge) {
      return res.status(400).json({ error: "Challenge not found" });
    }

    const isValid = await verifySignature(walletAddress, signature, challenge);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const hasAccess = await checkTokenBalance(provider, walletAddress);
    if (!hasAccess) {
      return res.status(403).json({ error: "Insufficient token balance" });
    }

    // Generate invite link
    const inviteLink = await bot.createChatInviteLink(groupId, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 86400,
    });

    res.json({ success: true, inviteLink: inviteLink.invite_link });

    // Clean up
    challenges.delete(userId);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/challenge/:userId", (req, res) => {
  const { userId } = req.params;
  const challenge = crypto.randomBytes(32).toString("hex");
  challenges.set(userId, challenge);
  res.json({ challenge });
});

// Bot command handlers
bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/join/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const verificationUrl = `${frontendUrl}/verify/${userId}`;
  await bot.sendMessage(
    chatId,
    `Please visit this link to verify your wallet and join the group:\n\n${verificationUrl}`
  );
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("Bot is running...");
