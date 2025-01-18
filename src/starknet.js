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
    const contract = new Contract(tokenAbi, TOKEN_ADDRESS, provider);
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
