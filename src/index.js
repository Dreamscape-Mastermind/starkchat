import { getAllUserWallets, initDatabase } from "./db.js";
import {
  handleJoin,
  handleSignature,
  handleStart,
  handleWallet,
} from "./commands.js";

import TelegramBot from "node-telegram-bot-api";
import { connect } from "./starknet.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const groupId = process.env.TELEGRAM_GROUP_ID;

if (!token || !groupId) {
  console.error("TELEGRAM_BOT_TOKEN and TELEGRAM_GROUP_ID are required");
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

// Store user states
const userStates = new Map();

// Initialize database and Starknet connection
const provider = connect();
await initDatabase();

// Command handlers
bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/join/, (msg) => handleJoin(bot, msg, userStates));

// Handle messages
bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const userState = userStates.get(userId);

  if (userState === "WAITING_FOR_WALLET") {
    await handleWallet(bot, msg, provider, userStates);
  } else if (userState === "WAITING_FOR_SIGNATURE") {
    await handleSignature(bot, msg, provider, userStates);
  }
});

// Periodic member verification (every 24 hours)
setInterval(async () => {
  try {
    const userWallets = await getAllUserWallets();

    for (const { user_id, wallet_address } of userWallets) {
      const hasAccess = await checkTokenBalance(provider, wallet_address);

      if (!hasAccess) {
        try {
          await bot.banChatMember(groupId, user_id);
          await bot.unbanChatMember(groupId, user_id); // Immediately unban to allow rejoining
          await bot.sendMessage(
            user_id,
            "You have been removed from the group because you no longer meet the token requirement. You can rejoin once you have the required tokens."
          );
        } catch (error) {
          console.error(`Error removing user ${user_id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error in periodic verification:", error);
  }
}, 24 * 60 * 60 * 1000);

console.log("Bot is running...");
