import { Provider, Contract, stark, constants } from 'starknet';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const MIN_BALANCE = process.env.MIN_BALANCE || '1000000000000000000'; // 1 token by default

// ABI for ERC20 token
const tokenAbi = [
  {
    members: [
      {
        name: "low",
        offset: 0,
        type: "felt"
      },
      {
        name: "high",
        offset: 1,
        type: "felt"
      }
    ],
    name: "Uint256",
    size: 2,
    type: "struct"
  },
  {
    inputs: [
      {
        name: "account",
        type: "felt"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "Uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export function connect() {
  return new Provider({
    sequencer: {
      network: process.env.STARKNET_NETWORK || 'mainnet-alpha'
    }
  });
}

export async function checkTokenBalance(provider, address) {
  try {
    const contract = new Contract(tokenAbi, TOKEN_ADDRESS, provider);
    const { balance } = await contract.balanceOf(address);
    return balance.gte(MIN_BALANCE);
  } catch (error) {
    console.error('Error checking token balance:', error);
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
    console.error('Error verifying signature:', error);
    return false;
  }
}