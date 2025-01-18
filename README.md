# starkchat
StarkChat is a community based telegram app for moderating telegram chats for Starknet based communities


I've set up the basic structure for the Telegram Bot with the following features:

Basic command handling (/start and /join)
Wallet address collection and basic validation
Placeholder for token balance checking
State management for user interactions
To get started:

Create a bot with @BotFather on Telegram and get your bot token
Replace your_bot_token_here in the .env file with your actual bot token
Run npm start to start the bot

I've implemented the following improvements:

Token Balance Checking:

Added ERC20 contract integration
Configurable token address and minimum balance
Real balance checking against the contract
Wallet Ownership Verification:

Challenge-response signature verification
Secure random challenge generation
Signature validation using Starknet utilities
Group Access Management:

Single-use invite links that expire in 24 hours
Automatic member verification every 24 hours
Removal of members who no longer meet requirements
To use the bot:

Update the .env file with:

Your Telegram bot token
Your group ID
The token contract address
Minimum required balance (in wei)
Make the bot an admin in your group with permissions to:

Ban users
Create invite links
Manage members
The verification flow is now:

User starts with /join
User provides wallet address
User signs a challenge message
Bot verifies signature and token balance
If successful, user receives a single-use invite link

I've made the following improvements:

Added Database Storage:

Using Turso (libSQL) for persistent storage
Store user wallet addresses
Track when users joined
Improved Verification Flow:

Store pending wallet addresses during verification
Save verified wallet addresses to database
Clean up temporary data after verification
Enhanced Periodic Verification:

Query all user wallets from database
Check token balance for each user
Remove users who no longer meet requirements
To complete the setup:

Create a Turso database and get your database URL
Update the .env file with your database URL
Start the bot with npm start
The bot will now:

Store verified wallet addresses
Periodically check all members' token balances
Remove members who fall below the required balance
Allow removed members to rejoin when they meet requirements again



This Cairo contract implements:

Standard ERC-20 functionality:

Transfer tokens
Check balances
Approve spending
Transfer from approved accounts
Additional features:

Minting capability (owner only)
Decimals set to 18 (standard for most tokens)
Full event emission for transfers and approvals
To use this contract:

Deploy it to Starknet with parameters:

name: "Telegram Access Token"
symbol: "TAT"
initial_supply: Amount of tokens to mint initially
recipient: Address to receive initial supply
Update your bot's .env file with:


TOKEN_ADDRESS=<deployed_contract_address>
MIN_BALANCE=1000000000000000000  # 1 token (18 decimals)
The bot will use this contract's balance_of function to check if users meet the minimum token requirement for group access.
