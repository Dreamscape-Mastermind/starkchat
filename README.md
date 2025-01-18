
# StarkChat

StarkChat is a community-based Telegram bot for moderating Telegram chats for Starknet-based communities. It verifies token holdings to manage group access.

## Prerequisites

- Node.js v18
- Docker (for local development)

### Setting Up Node.js

```bash
# Check Node.js version
node -v

# If needed, install Node.js 18 using nvm
nvm install 18
nvm use 18
```

## Features

- **Token Balance Verification**
  - ERC20 contract integration
  - Configurable token address and minimum balance
  - Real-time balance checking

- **Wallet Ownership Verification**
  - Challenge-response signature verification
  - Secure random challenge generation
  - Signature validation using Starknet utilities

- **Group Access Management**
  - Single-use invite links (24-hour expiration)
  - Automatic member verification every 24 hours
  - Automatic removal of non-compliant members

- **Database Storage**
  - Persistent storage using Turso (libSQL)
  - User wallet tracking
  - Join date tracking

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Dreamscape-Mastermind/starkchat.git
cd starkchat
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following configuration:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_GROUP_ID=your_group_id_here
TOKEN_ADDRESS=your_token_contract_address
MIN_BALANCE=1000000000000000000  # 1 token (18 decimals)
STARKNET_NETWORK=sepolia-alpha
DATABASE_URL=http://127.0.0.1:8080  # For local development
```

## Development Setup

1. Start the local database using Docker:

```bash
docker-compose up -d
```

2. Run the bot in development mode:

```bash
npm run dev
```

## Production Setup

1. Create a Turso database and get your database URL
2. Update the `.env` file with your production database URL
3. Start the bot:

```bash
npm start
```

## Bot Configuration

1. Create a new bot with [@BotFather](https://t.me/botfather) on Telegram
2. Make the bot an admin in your group with the following permissions:
   - Ban users
   - Create invite links
   - Manage members

## User Verification Flow

1. User initiates with `/start` or `/join`
2. User provides Starknet wallet address
3. User signs a challenge message
4. Bot verifies signature and token balance
5. If successful, user receives a single-use invite link

## Smart Contract

The project includes an ERC-20 token contract (`src/token_contract.cairo`) with:

- Standard ERC-20 functionality
- Minting capability (owner only)
- 18 decimal places
- Full event emission

### Contract Deployment

1. Deploy the contract to Starknet with parameters:
   - name: "Telegram Access Token"
   - symbol: "TAT"
   - initial_supply: Amount of tokens to mint initially
   - recipient: Address to receive initial supply

2. Update your bot's `.env` file with the deployed contract address

## License

MIT

## Contributing
