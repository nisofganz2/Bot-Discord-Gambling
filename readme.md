# 🎮 Growtopia Bot Disocrd

A feature-rich Discord bot that implements Growtopia-like currency system (WL, DL, BGL) with gambling and daily rewards.

## ✨ Features

### 💰 Currency System
- **World Lock (WL)**: Basic currency unit
- **Diamond Lock (DL)**: Equal to 100 WL
- **Blue Gem Lock (BGL)**: Equal to 100 DL (10,000 WL)

### 🎲 Games & Features
- **CSN (Casino)**
  - Host gambling games with custom bet amounts
  - Random number generation (1-100)
  - Multiple players can join
  - Automatic winner detection and prize distribution

- **Daily Rewards**
  - Claim 50 WL every 24 hours
  - Visual countdown timer for next claim
  - Embedded messages with reward information

- **Leaderboard System**
  - Top 10 richest players
  - Real-time balance tracking
  - Beautiful embedded display

## 🚀 Commands

| Command | Description |
|---------|-------------|
| `!balance` | Check your current balance |
| `!daily` | Claim your daily reward |
| `!leaderboard` | View the richest players |
| `!csn <amount>` | Start a CSN game with specified bet |
| `!join` | Join an active CSN game |

## 💻 Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your Discord bot token:
   ```
   DISCORD_TOKEN=your_bot_token_here
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## 🔧 Requirements

- Node.js v16.9.0 or higher
- Discord.js v14
- A Discord Bot Token

## 📦 Dependencies

- discord.js: Discord bot framework
- dotenv: Environment variable management

## 🎯 Features in Detail

### CSN Game
The CSN (Casino) game is a gambling system where:
- A host creates a game with a bet amount
- Players can join by matching the bet
- Each participant gets a random number (1-100)
- Highest number wins the total pot
- Results are displayed in an embedded message

### Currency Conversion
Automatic currency conversion between:
- 1 DL = 100 WL
- 1 BGL = 100 DL = 10,000 WL

### Daily Rewards
- 50 WL daily reward
- 24-hour cooldown
- Visual countdown for next available claim
- Embedded messages showing rewards

## 🔒 Security

- Balance tracking per user
- Anti-cheat measures in games
- Cooldown system for daily rewards

## 🎨 Visual Features

- Rich embed messages
- Colored notifications
- Emoji integration
- Formatted currency display