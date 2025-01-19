import { ArgentTMA } from '@argent/tma-wallet';
import dotenv from 'dotenv';

dotenv.config();

// Initialize ArgentTMA instance
export function initArgentTMA() {
  return ArgentTMA.init({
    environment: process.env.STARKNET_NETWORK === 'mainnet-alpha' ? 'mainnet' : 'sepolia',
    appName: "StarkChat Token Verifier",
    appTelegramUrl: `https://t.me/${process.env.BOT_USERNAME}`,
    sessionParams: {
      // Allow only token balance checking
      allowedMethods: [
        {
          contract: process.env.TOKEN_ADDRESS,
          selector: "balanceOf",
        }
      ],
      validityDays: 1, // Short session validity since we only need to check balance
    },
  });
}

// Check if address is an Argent TMA wallet
export async function isArgentTMAWallet(address) {
  try {
    const argentTMA = initArgentTMA();
    const hasWallet = await argentTMA.hasWallet(address);
    return hasWallet;
  } catch (error) {
    console.error('Error checking Argent TMA wallet:', error);
    return false;
  }
}

// Get balance for Argent TMA wallet
export async function checkArgentTMABalance(userId) {
  try {
    const argentTMA = initArgentTMA();
    const connection = await argentTMA.connect();
    
    if (!connection) {
      throw new Error('Failed to connect to Argent TMA wallet');
    }

    const { account } = connection;
    
    if (account.getSessionStatus() !== "VALID") {
      throw new Error('Invalid session');
    }

    // Get account address
    const address = account.address;
    
    return { address, account };
  } catch (error) {
    console.error('Error checking Argent TMA balance:', error);
    throw error;
  }
} 