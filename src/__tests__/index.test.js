import { describe, expect, test, beforeEach, vi } from 'vitest';
import { connect } from '../starknet.js';
import { initDatabase, getAllUserWallets } from '../db.js';
import TelegramBot from 'node-telegram-bot-api';

// Mock dependencies
vi.mock('../starknet.js', () => ({
  connect: vi.fn(),
  checkTokenBalance: vi.fn()
}));

vi.mock('../db.js', () => ({
  initDatabase: vi.fn(),
  getAllUserWallets: vi.fn()
}));

vi.mock('node-telegram-bot-api', () => {
  const mockBot = vi.fn().mockImplementation(() => ({
    onText: vi.fn(),
    on: vi.fn(),
    banChatMember: vi.fn(),
    unbanChatMember: vi.fn(),
    sendMessage: vi.fn()
  }));
  return { default: mockBot };
});

describe('Bot Initialization', () => {
  let originalEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_GROUP_ID = '123456789';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  test('should initialize bot with correct configuration', async () => {
    const { initializeBot } = await import('../index.js');
    initializeBot();

    expect(TelegramBot).toHaveBeenCalledWith('test-token', {
      polling: true,
      request: expect.any(Object)
    });
  });

  test('should connect to Starknet provider', async () => {
    const { main } = await import('../index.js');
    await main();
    expect(connect).toHaveBeenCalled();
  });

  test('should initialize database', async () => {
    const { main } = await import('../index.js');
    await main();
    expect(initDatabase).toHaveBeenCalled();
  });
});

describe('Member Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_GROUP_ID = '123456789';
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test('should process all users in batches', async () => {
    // Mock getAllUserWallets for this specific test
    vi.mocked(getAllUserWallets)
      .mockResolvedValueOnce([
        { user_id: '123', wallet_address: '0x123' },
        { user_id: '456', wallet_address: '0x456' }
      ])
      .mockResolvedValue([]); 

    const { verifyMembers } = await import('../index.js');
    const mockBot = {
      banChatMember: vi.fn(),
      unbanChatMember: vi.fn(),
      sendMessage: vi.fn()
    };
    const mockProvider = {};
    const groupId = '123456789';

    const { checkTokenBalance } = await import('../starknet.js');
    vi.mocked(checkTokenBalance).mockResolvedValue(true);

    await verifyMembers(mockBot, mockProvider, groupId);
    
    expect(getAllUserWallets).toHaveBeenCalledWith(50, 0);
    expect(checkTokenBalance).toHaveBeenCalledTimes(2);
  });

  test('should handle errors gracefully', async () => {
    // Mock console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error');
    
    // Mock getAllUserWallets for this specific test
    vi.mocked(getAllUserWallets).mockRejectedValue(new Error('Database error'));

    const { verifyMembers } = await import('../index.js');
    const mockBot = {
      banChatMember: vi.fn(),
      unbanChatMember: vi.fn(),
      sendMessage: vi.fn()
    };
    
    await verifyMembers(mockBot, {}, '123456789');
    
    expect(getAllUserWallets).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching user wallets:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('Environment Validation', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env = {};
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('should throw error if bot token is missing', async () => {
    process.env.TELEGRAM_GROUP_ID = '123456789';
    
    const { validateConfig } = await import('../index.js');
    expect(validateConfig()).toBeTruthy();
  });

  test('should throw error if group ID is missing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    
    const { validateConfig } = await import('../index.js');
    expect(() => { validateConfig(); }).toThrowError('TELEGRAM_GROUP_ID');
  });

  test('should throw error if bot token is empty string', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '   ';
    process.env.TELEGRAM_GROUP_ID = '123456789';
    
    const { validateConfig } = await import('../index.js');
    expect(() => { validateConfig(); }).toThrowError('TELEGRAM_BOT_TOKEN');
  });

  test('should throw error if group ID is empty string', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_GROUP_ID = '   ';
    
    const { validateConfig } = await import('../index.js');
    expect(() => { validateConfig(); }).toThrowError('TELEGRAM_GROUP_ID');
  });
}); 