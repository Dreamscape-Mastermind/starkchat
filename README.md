# StarkChat 🚀

StarkChat is a Telegram bot that revolutionizes community management for Starknet-based projects by implementing token-gated access control. Perfect for DAOs, NFT communities, and token holders.

## 🌟 Key Features

- **Token-Gated Access Control**
  - Automatic verification of ERC20 token holdings
  - Configurable minimum balance requirements
  - Support for any Starknet ERC20 token

- **Secure Wallet Verification**
  - Cryptographic challenge-response system
  - Starknet signature verification
  - Protection against wallet spoofing

- **Smart Group Management**
  - Time-limited invite links (24h expiration)
  - Daily member verification
  - Automated removal of non-compliant members
  - Seamless user experience

## 🛠️ Tech Stack

- **Backend**: Node.js (v18+)
- **Database**: Turso (libSQL)
- **Blockchain**: Starknet
- **Frontend**: React (for admin dashboard)
- **Infrastructure**: Docker support

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Docker (for local development)
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Starknet Wallet

### Installation

1. Clone and setup:
```bash
git clone https://github.com/Dreamscape-Mastermind/starkchat.git
cd starkchat
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_GROUP_ID=your_group_id
TOKEN_ADDRESS=your_token_contract_address
MIN_BALANCE=1000000000000000000  # 1 token (18 decimals)
STARKNET_NETWORK=sepolia-alpha
DATABASE_URL=your_turso_db_url
```

### Development

Run all services (bot + frontend):
```bash
npm run dev:all
```

Or run services separately:
```bash
# Run bot only
npm run dev

# Run frontend only
npm run dev:frontend
```

### Production
```bash
npm run build:frontend
npm start
```

## 🔑 Token Contract Options

### Ready-to-Use Test Tokens (Sepolia)
- ETH: `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7`
- USDC: `0x005a643907b9a4bc6a55e9069c4fd5fd1f5c79a22470690f75556c4736e34426`

## 🤖 Bot Setup

1. Create bot via [@BotFather](https://t.me/botfather)
2. Set bot permissions:
   - ✅ Ban users
   - ✅ Invite management
   - ✅ Member management

## 👥 User Flow

1. User starts bot (`/start` or `/join`)
2. Provides Starknet wallet
3. Signs verification message
4. Bot checks token balance
5. User receives private invite link

## 🛡️ Security Features

- Single-use invite links
- Cryptographic wallet verification
- Regular balance checks
- Automated member management

## 🧪 Testing

```bash
# Run test suite
npm test

# Run with watch mode
npm run test:watch
```

## 📚 API Documentation

API documentation is available at `/docs` when running the development server.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT

## 🙋‍♂️ Support

- Create an issue on GitHub

---

Built with ❤️ for the Starknet Community
