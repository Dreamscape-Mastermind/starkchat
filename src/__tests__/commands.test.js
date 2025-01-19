import { describe, expect, test, beforeEach, vi } from 'vitest';
import { handleStart, handleJoin, handleWallet, handleSignature, challenges, pendingWallets } from '../commands.js';
import { saveUserWallet } from '../db.js';
import { checkTokenBalance, verifySignature as verifyStarknetSignature } from '../starknet.js';

// Mock dependencies
vi.mock('../db.js', () => ({
  saveUserWallet: vi.fn()
}));

vi.mock('../starknet.js', () => ({
  checkTokenBalance: vi.fn(),
  verifySignature: vi.fn()
}));

describe('Command Handlers', () => {
  let mockBot;
  let mockMsg;
  let mockUserStates;
  let mockProvider;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock bot
    mockBot = {
      sendMessage: vi.fn().mockResolvedValue({}),
      createChatInviteLink: vi.fn().mockResolvedValue({ invite_link: 'https://t.me/invite/test' })
    };

    // Setup mock message
    mockMsg = {
      chat: { id: 123 },
      from: { id: 456 }
    };

    // Setup mock user states
    mockUserStates = new Map();

    // Setup mock provider
    mockProvider = {};

    // Clear the Maps
    challenges.clear();
    pendingWallets.clear();

    // Setup environment variables
    process.env.TELEGRAM_GROUP_ID = '789';
  });

  describe('handleStart', () => {
    test('should send welcome message', async () => {
      await handleStart(mockBot, mockMsg);
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockMsg.chat.id,
        expect.stringContaining('Welcome!')
      );
    });
  });

  describe('handleJoin', () => {
    test('should set user state and send wallet request', async () => {
      await handleJoin(mockBot, mockMsg, mockUserStates);
      
      expect(mockUserStates.get(mockMsg.from.id)).toBe('WAITING_FOR_WALLET');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockMsg.chat.id,
        expect.stringContaining('Please send your Starknet wallet address')
      );
    });
  });

  describe('handleWallet', () => {
    beforeEach(() => {
      mockMsg.text = '0x1234567890123456789012345678901234567890123456789012345678901234';
    });

    test('should reject invalid wallet address', async () => {
      mockMsg.text = 'invalid-address';
      
      await handleWallet(mockBot, mockMsg, mockProvider, mockUserStates);
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockMsg.chat.id,
        expect.stringContaining('Invalid wallet address')
      );
    });

    test('should proceed with valid wallet address', async () => {
      await handleJoin(mockBot, mockMsg, mockUserStates);
      await handleWallet(mockBot, mockMsg, mockProvider, mockUserStates);
      
      expect(mockUserStates.get(mockMsg.from.id)).toBe('WAITING_FOR_SIGNATURE');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockMsg.chat.id,
        expect.stringContaining('Please sign this message')
      );
    });
  });

  describe('handleSignature', () => {
    beforeEach(() => {
      mockMsg.text = '0xsignature';
      vi.mocked(verifyStarknetSignature).mockResolvedValue(true);
      vi.mocked(checkTokenBalance).mockResolvedValue(true);
      vi.mocked(saveUserWallet).mockResolvedValue();

      // Set up challenge and wallet address
      challenges.set(mockMsg.from.id, 'test-challenge');
      pendingWallets.set(mockMsg.from.id, '0x1234567890123456789012345678901234567890123456789012345678901234');
      mockUserStates.set(mockMsg.from.id, 'WAITING_FOR_SIGNATURE');
    });

    test('should verify signature and check balance', async () => {
      await handleSignature(mockBot, mockMsg, mockProvider, mockUserStates);
      
      expect(verifyStarknetSignature).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        '0xsignature',
        'test-challenge'
      );
      expect(checkTokenBalance).toHaveBeenCalledWith(
        mockProvider,
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      );
    });

    test('should reject if signature verification fails', async () => {
      vi.mocked(verifyStarknetSignature).mockResolvedValueOnce(false);
      
      await handleSignature(mockBot, mockMsg, mockProvider, mockUserStates);
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockMsg.chat.id,
        expect.stringContaining('Invalid signature')
      );
      expect(saveUserWallet).not.toHaveBeenCalled();
    });

    test('should reject if token balance is insufficient', async () => {
      vi.mocked(verifyStarknetSignature).mockResolvedValueOnce(true);
      vi.mocked(checkTokenBalance).mockResolvedValueOnce(false);
      
      await handleSignature(mockBot, mockMsg, mockProvider, mockUserStates);
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        mockMsg.chat.id,
        expect.stringContaining('do not meet the required token holdings')
      );
      expect(saveUserWallet).not.toHaveBeenCalled();
    });
  });
}); 