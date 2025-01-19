// Set up environment variables for testing
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_GROUP_ID = '123456789';
process.env.TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890123456789012345678901234';
process.env.MIN_BALANCE = '1000000000000000000';
process.env.STARKNET_NETWORK = 'testnet-alpha';

// Handle ES module mocking
jest.unstable_mockModule = jest.createMockFromModule; 