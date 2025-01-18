import crypto from 'crypto';
import { saveUserWallet } from './db.js';

// Store challenges for signature verification
const challenges = new Map();
// Store wallet addresses during verification
const pendingWallets = new Map();

export async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const message = `Welcome! 👋 This bot gates access to our private community based on token holdings.\n\nUse /join to start the verification process.`;
  
  await bot.sendMessage(chatId, message);
}

export async function handleJoin(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Generate a random challenge for signature verification
  const challenge = crypto.randomBytes(32).toString('hex');
  challenges.set(userId, challenge);
  userStates.set(userId, 'WAITING_FOR_WALLET');
  
  const message = `Please send your Starknet wallet address to verify your holdings.\n\nAfter sending your address, you'll need to sign a message to prove ownership.`;
  await bot.sendMessage(chatId, message);
}

async function createInviteLink(bot, groupId) {
  try {
    // Create a single-use invite link that expires in 24 hours
    const invite = await bot.createChatInviteLink(groupId, {
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 86400
    });
    return invite.invite_link;
  } catch (error) {
    console.error('Error creating invite link:', error);
    throw error;
  }
}

export async function handleWallet(bot, msg, provider, userStates) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const walletAddress = msg.text.trim();
  
  // Basic address validation
  if (!walletAddress.startsWith('0x') || walletAddress.length !== 66) {
    await bot.sendMessage(chatId, 'Invalid wallet address. Please send a valid Starknet address.');
    return;
  }
  
  try {
    // Get the challenge for this user
    const challenge = challenges.get(userId);
    if (!challenge) {
      throw new Error('No challenge found');
    }
    
    // Store wallet address for verification
    pendingWallets.set(userId, walletAddress);
    
    // Request signature
    await bot.sendMessage(
      chatId,
      `Please sign this message to verify wallet ownership:\n\n${challenge}\n\nSend the signature in your next message.`
    );
    userStates.set(userId, 'WAITING_FOR_SIGNATURE');
    
  } catch (error) {
    console.error('Error handling wallet:', error);
    await bot.sendMessage(chatId, 'An error occurred. Please try again by using /join');
    userStates.delete(userId);
    challenges.delete(userId);
    pendingWallets.delete(userId);
  }
}

export async function handleSignature(bot, msg, provider, userStates) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const signature = msg.text.trim();
  
  try {
    const challenge = challenges.get(userId);
    const walletAddress = pendingWallets.get(userId);
    
    if (!challenge || !walletAddress) {
      throw new Error('No challenge or wallet address found');
    }
    
    // Verify signature
    const isValid = await verifySignature(walletAddress, signature, challenge);
    if (!isValid) {
      await bot.sendMessage(chatId, 'Invalid signature. Please try again by using /join');
      userStates.delete(userId);
      challenges.delete(userId);
      pendingWallets.delete(userId);
      return;
    }
    
    // Check token balance
    const hasAccess = await checkTokenBalance(provider, walletAddress);
    
    if (hasAccess) {
      // Save verified wallet address
      await saveUserWallet(userId, walletAddress);
      
      // Generate invite link
      const groupId = process.env.TELEGRAM_GROUP_ID;
      const inviteLink = await createInviteLink(bot, groupId);
      
      await bot.sendMessage(
        chatId,
        `Verification successful! Here's your invite link to join the group:\n\n${inviteLink}\n\nThis link will expire in 24 hours and can only be used once.`
      );
    } else {
      await bot.sendMessage(
        chatId,
        'Sorry, you do not meet the required token holdings. You need at least 1 token to join the group.'
      );
    }
  } catch (error) {
    console.error('Error handling signature:', error);
    await bot.sendMessage(chatId, 'An error occurred while verifying your wallet. Please try again later.');
  }
  
  // Clean up
  userStates.delete(userId);
  challenges.delete(userId);
  pendingWallets.delete(userId);
}