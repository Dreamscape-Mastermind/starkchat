import { getAllUserWallets, initDatabase } from "./db.js";
import {
  handleJoin,
  handleSignature,
  handleSignatureCallback,
  handleStart,
  handleWallet,
} from "./commands.js";

import TelegramBot from "node-telegram-bot-api";
import { connect } from "./starknet.js";
import { cookieJar } from "./cookies.js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const groupId = process.env.TELEGRAM_GROUP_ID;

if (!token || !groupId) {
  console.error("TELEGRAM_BOT_TOKEN and TELEGRAM_GROUP_ID are required");
  process.exit(1);
}

const bot = new TelegramBot(token, {
  polling: true,
  request: { jar: cookieJar },
});

const userStates = new Map();
const provider = connect();
await initDatabase();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// Add the new route for signature verification
app.post("/api/verify-signature", async (req, res) => {
  const { signature, challenge, wallet, userId } = req.body;

  try {
    // Call the handleSignatureCallback function
    await handleSignatureCallback(
      signature,
      challenge,
      wallet,
      userId,
      bot,
      provider,
      userStates
    );
    res.status(200).json({ message: "Signature verified successfully." });
  } catch (error) {
    console.error("Error verifying signature:", error);
    res.status(400).json({ message: "Failed to verify signature." });
  }
});

bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/join/, (msg) => handleJoin(bot, msg, userStates));

bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const userState = userStates.get(userId);

  if (userState === "WAITING_FOR_WALLET") {
    await handleWallet(bot, msg, provider, userStates);
  } else if (userState === "WAITING_FOR_SIGNATURE") {
    await handleSignature(bot, msg, provider, userStates);
  }
});

// Periodic member verification
const verifyMembers = async () => {
  try {
    const batchSize = 50;
    let offset = 0;
    let userWallets;

    do {
      userWallets = await getAllUserWallets(batchSize, offset);

      for (const { user_id, wallet_address } of userWallets) {
        const hasAccess = await checkTokenBalance(provider, wallet_address);

        if (!hasAccess) {
          try {
            await bot.banChatMember(groupId, user_id);
            await bot.unbanChatMember(groupId, user_id);
            await bot.sendMessage(
              user_id,
              "You have been removed from the group because you no longer meet the token requirement. You can rejoin once you have the required tokens."
            );
          } catch (error) {
            console.error(`Error removing user ${user_id}:`, error);
          }
        }
      }

      offset += batchSize;
    } while (userWallets.length === batchSize);
  } catch (error) {
    console.error("Error in periodic verification:", error);
  }
};

setInterval(verifyMembers, 24 * 60 * 60 * 1000); // Every 24 hours

console.log("Bot is running...");
