import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

let userDB = {};
try {
  userDB = JSON.parse(fs.readFileSync('./userdata.json', 'utf-8'));
} catch {
  fs.writeFileSync('./userdata.json', '{}');
}

function saveData() {
  fs.writeFileSync('./userdata.json', JSON.stringify(userDB, null, 2));
}

function getUserData(userId) {
  if (!userDB[userId]) {
    userDB[userId] = {
      balance: 0,
      lastDaily: null,
      totalWon: 0,
      totalLost: 0,
      gamesPlayed: 0
    };
    saveData();
  }
  return userDB[userId];
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLeaderboard() {
  return Object.entries(userDB)
    .map(([userId, data]) => ({
      userId,
      balance: data.balance,
      totalWon: data.totalWon || 0,
      totalLost: data.totalLost || 0,
      gamesPlayed: data.gamesPlayed || 0
    }))
    .sort((a, b) => b.balance - a.balance);
}

function updateStats(userData, won, amount) {
  userData.gamesPlayed++;
  if (won) {
    userData.totalWon += amount;
  } else {
    userData.totalLost += amount;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const args = message.content.toLowerCase().split(' ');
  const command = args[0];
  const userData = getUserData(message.author.id);

  switch (command) {
    case '!daily':
      const now = Date.now();
      const lastDaily = userData.lastDaily;
      if (lastDaily && now - lastDaily < 24 * 60 * 60 * 1000) {
        const timeLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - lastDaily)) / (60 * 60 * 1000));
        await message.reply(`Tunggu ${timeLeft} jam lagi ya!`);
        return;
      }
      userData.balance += config.rewards.daily;
      userData.lastDaily = now;
      saveData();
      await message.reply(`Nih ${config.rewards.daily} ${config.currency.symbol}! Sekarang kamu punya ${userData.balance} ${config.currency.symbol}`);
      break;

    case '!work':
      const earned = random(config.rewards.work.min, config.rewards.work.max);
      userData.balance += earned;
      saveData();
      await message.reply(`Nih hasil kerjamu ${earned} ${config.currency.symbol}! Sekarang kamu punya ${userData.balance} ${config.currency.symbol}`);
      break;

    case '!balance':
      const statsEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${message.author.username}`)
        .addFields(
          { name: 'Uang', value: `${userData.balance} ${config.currency.symbol}`, inline: true },
          { name: 'Menang', value: `${userData.totalWon || 0} ${config.currency.symbol}`, inline: true },
          { name: 'Kalah', value: `${userData.totalLost || 0} ${config.currency.symbol}`, inline: true },
          { name: 'Main', value: `${userData.gamesPlayed || 0}x`, inline: true }
        );
      await message.reply({ embeds: [statsEmbed] });
      break;

    case '!leaderboard':
      const leaderboard = getLeaderboard().slice(0, 10);
      const leaderboardEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('Top 10 Terkaya')
        .setDescription(
          leaderboard
            .map((user, index) => {
              const member = message.guild.members.cache.get(user.userId);
              const username = member ? member.user.username : 'Unknown';
              return `${index + 1}. ${username}\n💰 ${user.balance} ${config.currency.symbol}\n📊 ${user.totalWon}/${user.totalLost}`;
            })
            .join('\n\n')
        );
      await message.reply({ embeds: [leaderboardEmbed] });
      break;

    case '!coinflip':
      const bet = parseInt(args[1]);
      if (!bet || bet < config.gambling.coinflip.min_bet || bet > config.gambling.coinflip.max_bet) {
        await message.reply(`Minimal ${config.gambling.coinflip.min_bet} maksimal ${config.gambling.coinflip.max_bet} ${config.currency.symbol}`);
        return;
      }
      if (userData.balance < bet) {
        await message.reply(`Duit kamu kurang! Perlu ${bet} ${config.currency.symbol}`);
        return;
      }
      const win = Math.random() < 0.5;
      if (win) {
        userData.balance += bet;
        updateStats(userData, true, bet);
        await message.reply(`Menang ${bet} ${config.currency.symbol}! Sekarang punya ${userData.balance} ${config.currency.symbol}`);
      } else {
        userData.balance -= bet;
        updateStats(userData, false, bet);
        await message.reply(`Kalah ${bet} ${config.currency.symbol}! Sisa ${userData.balance} ${config.currency.symbol}`);
      }
      saveData();
      break;

    case '!slots':
      const slotBet = parseInt(args[1]);
      if (!slotBet || slotBet < config.gambling.slots.min_bet || slotBet > config.gambling.slots.max_bet) {
        await message.reply(`Minimal ${config.gambling.slots.min_bet} maksimal ${config.gambling.slots.max_bet} ${config.currency.symbol}`);
        return;
      }
      if (userData.balance < slotBet) {
        await message.reply(`Duit kamu kurang! Perlu ${slotBet} ${config.currency.symbol}`);
        return;
      }

      const symbols = config.gambling.slots.symbols;
      const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
      
      let multiplier = 0;
      if (slot1 === slot2 && slot2 === slot3) {
        if (slot1 === "7️⃣") multiplier = config.gambling.slots.multipliers.three_seven;
        else if (slot1 === "💎") multiplier = config.gambling.slots.multipliers.three_diamond;
        else multiplier = config.gambling.slots.multipliers.three_same;
      } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        multiplier = config.gambling.slots.multipliers.two_same;
      }

      const winAmount = slotBet * multiplier;
      userData.balance = userData.balance - slotBet + winAmount;
      
      if (multiplier > 0) {
        updateStats(userData, true, winAmount);
      } else {
        updateStats(userData, false, slotBet);
      }
      
      saveData();

      const result = `${slot1} | ${slot2} | ${slot3}`;
      if (multiplier > 0) {
        await message.reply(`${result}\nMenang ${winAmount} ${config.currency.symbol}! Sekarang punya ${userData.balance} ${config.currency.symbol}`);
      } else {
        await message.reply(`${result}\nKalah ${slotBet} ${config.currency.symbol}! Sisa ${userData.balance} ${config.currency.symbol}`);
      }
      break;

    case '!roulette':
      const rouletteBet = parseInt(args[2]);
      const betType = args[1]?.toLowerCase();
      const validBets = ['red', 'black', 'even', 'odd', 'number'];
      
      if (!betType || !validBets.includes(betType)) {
        await message.reply(`Cara main:\n!roulette red <bet>\n!roulette black <bet>\n!roulette even <bet>\n!roulette odd <bet>\n!roulette number <angka> <bet>`);
        return;
      }

      if (!rouletteBet || rouletteBet < config.gambling.roulette.min_bet || rouletteBet > config.gambling.roulette.max_bet) {
        await message.reply(`Minimal ${config.gambling.roulette.min_bet} maksimal ${config.gambling.roulette.max_bet} ${config.currency.symbol}`);
        return;
      }

      if (userData.balance < rouletteBet) {
        await message.reply(`Duit kamu kurang! Perlu ${rouletteBet} ${config.currency.symbol}`);
        return;
      }

      const number = Math.floor(Math.random() * 37);
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number);
      const isEven = number !== 0 && number % 2 === 0;
      
      let rouletteWin = false;
      let rouletteMultiplier = 0;

      if (betType === 'red' && isRed) {
        rouletteWin = true;
        rouletteMultiplier = config.gambling.roulette.multipliers.red_black;
      } else if (betType === 'black' && !isRed && number !== 0) {
        rouletteWin = true;
        rouletteMultiplier = config.gambling.roulette.multipliers.red_black;
      } else if (betType === 'even' && isEven) {
        rouletteWin = true;
        rouletteMultiplier = config.gambling.roulette.multipliers.even_odd;
      } else if (betType === 'odd' && !isEven && number !== 0) {
        rouletteWin = true;
        rouletteMultiplier = config.gambling.roulette.multipliers.even_odd;
      } else if (betType === 'number' && number === parseInt(args[2])) {
        rouletteWin = true;
        rouletteMultiplier = config.gambling.roulette.multipliers.straight;
      }

      const rouletteWinAmount = rouletteBet * rouletteMultiplier;
      
      if (rouletteWin) {
        userData.balance += rouletteWinAmount;
        updateStats(userData, true, rouletteWinAmount);
        await message.reply(`${number} ${isRed ? '🔴' : '⚫'}\nMenang ${rouletteWinAmount} ${config.currency.symbol}! Sekarang punya ${userData.balance} ${config.currency.symbol}`);
      } else {
        userData.balance -= rouletteBet;
        updateStats(userData, false, rouletteBet);
        await message.reply(`${number} ${isRed ? '🔴' : '⚫'}\nKalah ${rouletteBet} ${config.currency.symbol}! Sisa ${userData.balance} ${config.currency.symbol}`);
      }
      saveData();
      break;

    case '!help':
      const helpEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Commands')
        .addFields(
          { 
            name: 'Uang',
            value: `!daily - ${config.rewards.daily} ${config.currency.symbol} per hari\n!work - Kerja\n!balance - Cek uang\n!leaderboard - Top 10`
          },
          {
            name: 'Games',
            value: `!coinflip <bet>\n!slots <bet>\n!roulette <red/black/even/odd/number> <bet>`
          }
        );
      await message.reply({ embeds: [helpEmbed] });
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);