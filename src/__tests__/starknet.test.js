import { describe, expect, test, beforeEach, vi } from 'vitest';
import { connect, checkTokenBalance, verifySignature } from '../starknet.js';
import { Contract, Provider, stark } from 'starknet';

// Mock starknet
vi.mock('starknet', () => {
  return {
    Provider: vi.fn().mockImplementation(() => ({
      getClassAt: vi.fn().mockResolvedValue({
        abi: JSON.stringify([{
          members: [
            { name: "low", offset: 0, type: "felt" },
            { name: "high", offset: 1, type: "felt" },
          ],
          name: "Uint256",
          size: 2,
          type: "struct",
        }])
      })
    })),
    Contract: vi.fn().mockImplementation((abi, address) => ({
      balanceOf: vi.fn()
    })),
    stark: {
      hashMessage: vi.fn(),
      getPublicKey: vi.fn(),
      computeAddress: vi.fn()
    },
    constants: {}
  };
});

describe('Starknet Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STARKNET_NETWORK = 'mainnet-alpha';
  });

  describe('connect', () => {
    test('should create provider with mainnet by default', () => {
      connect();
      expect(Provider).toHaveBeenCalledWith({
        sequencer: { network: 'mainnet-alpha' }
      });
    });

    test('should use network from env if provided', () => {
      process.env.STARKNET_NETWORK = 'testnet-alpha';
      connect();
      expect(Provider).toHaveBeenCalledWith({
        sequencer: { network: 'testnet-alpha' }
      });
    });

    test('should throw error if provider creation fails', () => {
      Provider.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
      expect(() => connect()).toThrow('Network error');
    });
  });

  describe('checkTokenBalance', () => {
    const mockProvider = new Provider();
    const mockAddress = '0x123';
    const mockContract = {
      balanceOf: vi.fn()
    };

    beforeEach(() => {
      Contract.mockImplementation(() => mockContract);
    });

    test('should return true if balance meets minimum', async () => {
      mockContract.balanceOf.mockResolvedValueOnce({
        balance: { low: '2000000000000000000', high: '0' }
      });
      
      const result = await checkTokenBalance(mockProvider, mockAddress);
      expect(result).toBe(true);
    });

    test('should return false if balance below minimum', async () => {
      mockContract.balanceOf.mockResolvedValueOnce({
        balance: { low: '500000000000000000', high: '0' }
      });
      
      const result = await checkTokenBalance(mockProvider, mockAddress);
      expect(result).toBe(false);
    });

    test('should throw error on contract error', async () => {
      mockContract.balanceOf.mockRejectedValueOnce(new Error('Contract error'));
      
      await expect(checkTokenBalance(mockProvider, mockAddress))
        .rejects
        .toThrow('Contract error');
    });
  });

  describe('verifySignature', () => {
    const mockAddress = '0x123';
    const mockSignature = '0x456';
    const mockMessage = 'Test message';
    const mockHash = '0x789';
    const mockPublicKey = '0xabc';

    beforeEach(() => {
      stark.hashMessage.mockReturnValue(mockHash);
      stark.getPublicKey.mockReturnValue(mockPublicKey);
    });

    test('should return true for valid signature', async () => {
      stark.computeAddress.mockReturnValue(mockAddress);
      
      const result = await verifySignature(mockAddress, mockSignature, mockMessage);
      expect(result).toBe(true);
    });

    test('should return false for invalid signature', async () => {
      stark.computeAddress.mockReturnValue('0xdifferent');
      
      const result = await verifySignature(mockAddress, mockSignature, mockMessage);
      expect(result).toBe(false);
    });

    test('should return false on verification error', async () => {
      stark.getPublicKey.mockImplementationOnce(() => {
        throw new Error('Verification error');
      });
      
      const result = await verifySignature(mockAddress, mockSignature, mockMessage);
      expect(result).toBe(false);
    });
  });
}); 