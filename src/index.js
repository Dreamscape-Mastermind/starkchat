import { getAllUserWallets, initDatabase } from "./db.js";
import {
  handleJoin,
  handleSignature,
  handleStart,
  handleWallet,
} from "./commands.js";

import TelegramBot from "node-telegram-bot-api";
import { connect, checkTokenBalance } from "./starknet.js";
import { cookieJar } from "./cookies.js";
import dotenv from "dotenv";

dotenv.config();

// Separate configuration validation
const validateConfig = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  if (!groupId) {
    throw new Error('TELEGRAM_GROUP_ID is required');
  }

  if (token.trim() === '') {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  if (groupId.trim() === '') {
    throw new Error('TELEGRAM_GROUP_ID is required');
  }

  return true;
};

// Initialize bot with error handling
const initializeBot = () => {
  validateConfig();
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: true,
    request: { jar: cookieJar },
  });
  return bot;
};

// Handle message based on user state
const handleMessage = async (bot, msg, provider, userStates) => {
  try {
    const userId = msg.from?.id;
    if (!userId) {
      console.error('Message received without user ID');
      return;
    }

    const userState = userStates.get(userId);
    switch (userState) {
      case 'WAITING_FOR_WALLET':
        await handleWallet(bot, msg, provider, userStates);
        break;
      case 'WAITING_FOR_SIGNATURE':
        await handleSignature(bot, msg, provider, userStates);
        break;
      default:
        // Ignore messages without relevant state
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    await bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again later.');
  }
};

// Improved member verification with better error handling and batch processing
const verifyMembers = async (bot, provider, groupId) => {
  const batchSize = 50;
  let offset = 0;

  try {
    const maxIterations = 100;
    let iterations = 0;

    while (iterations < maxIterations) {
      let userWallets;
      try {
        userWallets = await getAllUserWallets(batchSize, offset);
      } catch (error) {
        console.error('Error fetching user wallets:', error);
        return; // Exit on database error
      }

      if (!userWallets || userWallets.length === 0) break;

      await Promise.all(
        userWallets.map(async ({ user_id, wallet_address }) => {
          try {
            const hasAccess = await checkTokenBalance(provider, wallet_address);
            if (!hasAccess) {
              await removeUserFromGroup(bot, groupId, user_id);
            }
          } catch (error) {
            console.error(`Error processing user ${user_id}:`, error);
          }
        })
      );

      offset += batchSize;
      iterations++;
    }
  } catch (error) {
    console.error('Error in periodic verification:', error);
  }
};

// Helper function to remove user from group
const removeUserFromGroup = async (bot, groupId, userId) => {
  try {
    await bot.banChatMember(groupId, userId);
    await bot.unbanChatMember(groupId, userId);
    await bot.sendMessage(
      userId,
      'You have been removed from the group because you no longer meet the token requirement. You can rejoin once you have the required tokens.'
    );
  } catch (error) {
    console.error(`Failed to remove user ${userId}:`, error);
    throw error; // Propagate error for handling in calling function
  }
};

// Main function
const main = async () => {
  const bot = initializeBot();
  const provider = connect();
  await initDatabase();

  const userStates = new Map();

  // Set up command handlers
  bot.onText(/\/start/, (msg) => handleStart(bot, msg));
  bot.onText(/\/join/, (msg) => handleJoin(bot, msg, userStates));
  bot.on('message', (msg) => handleMessage(bot, msg, provider, userStates));

  // Start periodic verification
  setInterval(() => verifyMembers(bot, provider, process.env.TELEGRAM_GROUP_ID), 24 * 60 * 60 * 1000);

  console.log('Bot is running...');
  return bot; // Return bot for testing
};

// Run the application if this is the main module and not in test environment
if (import.meta.url === new URL(import.meta.url).href && process.env.NODE_ENV !== 'test') {
  main().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

// Add exports for testing
export { validateConfig, verifyMembers, initializeBot, main };
