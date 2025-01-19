import { Contract, Provider, constants, stark } from "starknet";

import dotenv from "dotenv";

dotenv.config();

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const MIN_BALANCE = BigInt(process.env.MIN_BALANCE || "1000000000000000000");

const tokenAbi = [
  {
    members: [
      { name: "low", offset: 0, type: "felt" },
      { name: "high", offset: 1, type: "felt" },
    ],
    name: "Uint256",
    size: 2,
    type: "struct",
  },
  {
    inputs: [{ name: "account", type: "felt" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "Uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export function connect() {
  try {
    return new Provider({
      sequencer: {
        network: process.env.STARKNET_NETWORK || "mainnet-alpha",
      },
    });
  } catch (error) {
    console.error("Error connecting to StarkNet provider:", error);
    throw error;
  }
}

export async function checkTokenBalance(provider, address) {
  try {
    const abi = await fetchABI(TOKEN_ADDRESS);
    const contract = new Contract(abi, TOKEN_ADDRESS, provider);
    const { balance } = await contract.balanceOf(address);
    const actualBalance = BigInt(balance.low) + (BigInt(balance.high) << 128n);
    return actualBalance >= MIN_BALANCE;
  } catch (error) {
    console.error("Error checking token balance:", error);
    throw error;
  }
}

export async function verifySignature(address, signature, message) {
  try {
    const messageHash = stark.hashMessage(message);
    const publicKey = stark.getPublicKey(signature, messageHash);
    const recoveredAddress = stark.computeAddress(publicKey);
    return recoveredAddress === address;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

/**
 * Fetches the ABI for a Starknet contract
 * @param {string} contractAddress - The contract address to fetch the ABI for
 * @param {Object} options - Optional configuration
 * @param {string} options.network - Network name ('SN_MAIN' or 'SN_SEPOLIA'), defaults to Sepolia
 * @returns {Promise<Array>} The contract ABI
 */
async function fetchABI(contractAddress, options = {}) {
  // Input validation
  if (!contractAddress?.startsWith('0x')) {
    throw new Error('Invalid contract address format');
  }

  // Default to Sepolia testnet if no network specified
  const network = options.network || 'SN_SEPOLIA';
  
  try {
    // 1. Initialize provider
    const provider = new Provider({ 
      sequencer: { network } 
    });
    
    // 2. Get contract class
    const contractClass = await provider.getClassAt(contractAddress);
    
    // 3. Handle missing ABI case
    if (!contractClass?.abi) {
      throw new Error('No ABI found in contract class');
    }

    // 4. Parse ABI if it's a string (Sierra format) or return directly if already parsed
    const abi = typeof contractClass.abi === 'string' 
      ? JSON.parse(contractClass.abi) 
      : contractClass.abi;

    return abi;

  } catch (error) {
    // Handle common error cases with user-friendly messages
    const errorMessages = {
      'Contract not found': `Contract not found at address ${contractAddress}`,
      'Invalid contract address': 'The provided contract address is invalid',
      'Network error': 'Unable to connect to Starknet. Please check your connection',
      'Invalid response': 'Received invalid data from the network'
    };

    // Match error message or return generic error
    const friendlyMessage = errorMessages[error.message] || 
      `Error fetching ABI: ${error.message}`;

    // Preserve stack trace while providing friendly message
    const enhancedError = new Error(friendlyMessage);
    enhancedError.originalError = error;
    enhancedError.contractAddress = contractAddress;
    enhancedError.network = network;

    throw enhancedError;
  }
}

// Example usage:
// fetchABI('0x123...', { network: 'SN_MAIN' })
//   .then(abi => console.log('ABI:', abi))
//   .catch(error => console.error('Error:', error.message));


