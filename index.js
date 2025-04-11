const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const CONVERSION_RATES = {
  WL: 1,
  DL: 100,
  BGL: 10000
};

const userBalances = new Map();
const activeGames = new Map();
const lastDailyClaim = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function formatBalance(wls) {
  const bgl = Math.floor(wls / CONVERSION_RATES.BGL);
  wls %= CONVERSION_RATES.BGL;
  const dl = Math.floor(wls / CONVERSION_RATES.DL);
  wls %= CONVERSION_RATES.DL;
  
  let result = [];
  if (bgl > 0) result.push(`${bgl} BGL`);
  if (dl > 0) result.push(`${dl} DL`);
  if (wls > 0) result.push(`${wls} WL`);
  return result.join(', ') || '0 WL';
}

function getBalance(userId) {
  return userBalances.get(userId) || 0;
}

function canClaimDaily(userId) {
  const lastClaim = lastDailyClaim.get(userId);
  if (!lastClaim) return true;
  
  const now = new Date();
  const timeDiff = now - lastClaim;
  return timeDiff >= 24 * 60 * 60 * 1000;
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const args = message.content.toLowerCase().split(' ');
  const command = args[0];

  if (command === '!balance') {
    const balance = getBalance(message.author.id);
    await message.reply(`Your balance: ${formatBalance(balance)}`);
    return;
  }

  if (command === '!daily') {
    if (!canClaimDaily(message.author.id)) {
      const lastClaim = lastDailyClaim.get(message.author.id);
      const timeLeft = 24 * 60 * 60 * 1000 - (new Date() - lastClaim);
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      
      const embed = new EmbedBuilder()
        .setTitle('❌ Daily Reward')
        .setDescription(`You need to wait ${hoursLeft}h ${minutesLeft}m before claiming again!`)
        .setColor('#ff0000');
      
      await message.reply({ embeds: [embed] });
      return;
    }

    const reward = 50;
    const currentBalance = getBalance(message.author.id);
    userBalances.set(message.author.id, currentBalance + reward);
    lastDailyClaim.set(message.author.id, new Date());

    const embed = new EmbedBuilder()
      .setTitle('🎁 Daily Reward')
      .setDescription(`You received ${formatBalance(reward)}!\nNew balance: ${formatBalance(currentBalance + reward)}`)
      .setColor('#00ff00');

    await message.reply({ embeds: [embed] });
    return;
  }

  if (command === '!leaderboard') {
    const sortedBalances = Array.from(userBalances.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const leaderboardList = await Promise.all(sortedBalances.map(async ([userId, balance], index) => {
      const user = await client.users.fetch(userId);
      return `${index + 1}. ${user.username}: ${formatBalance(balance)}`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('🏆 Richest Players')
      .setDescription(leaderboardList.join('\n'))
      .setColor('#ffd700');

    await message.reply({ embeds: [embed] });
    return;
  }

  if (command === '!addbal' && args.length === 2) {
    const amount = parseInt(args[1]);
    if (!isNaN(amount)) {
      const currentBalance = getBalance(message.author.id);
      userBalances.set(message.author.id, currentBalance + amount);
      await message.reply(`Added ${amount} WL to your balance. New balance: ${formatBalance(getBalance(message.author.id))}`);
    }
    return;
  }

  if (command === '!csn') {
    if (activeGames.has(message.channelId)) {
      await message.reply('There is already an active CSN game in this channel!');
      return;
    }

    const betAmount = parseInt(args[1]);
    if (!args[1] || isNaN(betAmount) || betAmount <= 0) {
      await message.reply('Please specify a valid bet amount: !csn <amount>');
      return;
    }

    const userBalance = getBalance(message.author.id);
    if (userBalance < betAmount) {
      await message.reply(`You don't have enough balance! Your balance: ${formatBalance(userBalance)}`);
      return;
    }

    const game = {
      hoster: message.author.id,
      betAmount: betAmount,
      players: new Set(),
      numbers: new Map(),
    };
    activeGames.set(message.channelId, game);

    const embed = new EmbedBuilder()
      .setTitle('🎲 CSN Game Started!')
      .setDescription(`
        Bet Amount: ${formatBalance(betAmount)}
        Host: ${message.author.username}
        Type !join to participate!
      `)
      .setColor('#00ff00');

    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (command === '!join') {
    const game = activeGames.get(message.channelId);
    if (!game) {
      await message.reply('There is no active CSN game in this channel!');
      return;
    }

    if (game.hoster === message.author.id) {
      await message.reply('Host cannot join their own game!');
      return;
    }

    if (game.players.has(message.author.id)) {
      await message.reply('You have already joined this game!');
      return;
    }

    const userBalance = getBalance(message.author.id);
    if (userBalance < game.betAmount) {
      await message.reply(`You don't have enough balance! Your balance: ${formatBalance(userBalance)}`);
      return;
    }

    game.players.add(message.author.id);
    const number = Math.floor(Math.random() * 100) + 1;
    game.numbers.set(message.author.id, number);

    await message.reply(`You rolled: ${number}`);

    if (game.players.size >= 1) {
      const hostNumber = Math.floor(Math.random() * 100) + 1;
      game.numbers.set(game.hoster, hostNumber);

      let highestNumber = -1;
      let winnerId = null;

      game.numbers.forEach((num, playerId) => {
        if (num > highestNumber) {
          highestNumber = num;
          winnerId = playerId;
        }
      });

      const results = Array.from(game.numbers.entries())
        .map(([playerId, num]) => `${playerId === game.hoster ? 'Host' : 'Player'} ${client.users.cache.get(playerId).username}: ${num}`)
        .join('\n');

      const winner = client.users.cache.get(winnerId);
      const totalPot = game.betAmount * (game.players.size + 1);

      game.players.forEach(playerId => {
        const balance = getBalance(playerId);
        userBalances.set(playerId, balance - game.betAmount);
      });
      const hostBalance = getBalance(game.hoster);
      userBalances.set(game.hoster, hostBalance - game.betAmount);

      const winnerBalance = getBalance(winnerId);
      userBalances.set(winnerId, winnerBalance + totalPot);

      const embed = new EmbedBuilder()
        .setTitle('🎲 CSN Game Results!')
        .setDescription(`
          ${results}
          
          Winner: ${winner.username}
          Prize: ${formatBalance(totalPot)}
        `)
        .setColor('#ffd700');

      await message.channel.send({ embeds: [embed] });
      activeGames.delete(message.channelId);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);