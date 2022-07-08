const { ApiClient } = require('@twurple/api');
const { RefreshingAuthProvider } = require('@twurple/auth');
const { Client, Intents } = require('discord.js');
const { promises: fs } = require('fs');
const { MongoClient, ServerApiVersion } = require('mongodb');

const config = require('../config/config.json');
const { DB } = require('../internal/db');
const { logger } = require('../pkg/logger');
const { Service } = require('../internal/service');
const tokenData = require('../config/tokens.json');
const { WebSocket } = require('../internal/websocket');

process.on('uncaughtException', (err, origin) => {
  console.error(err);
  console.error(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(reason);
  console.error(promise);
});

const main = async () => {
  try {
    // Connect to MongoDB
    const uri = `mongodb+srv://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}/?retryWrites=true&w=majority`;
    const mongoClient = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    await mongoClient.connect();
    logger.success('Connected to MongoDB');

    // DB client
    const db = mongoClient.db(config.mongodb.database);
    const dbClient = new DB(db);
    logger.success('Initialized DB client');

    // Twitch client
    const authProvider = new RefreshingAuthProvider({
      clientId: config.twitch.clientId,
      clientSecret: config.twitch.clientSecret,
      onRefresh: async (newTokenData) => await fs.writeFile('../config/tokens.json', JSON.stringify(newTokenData, null, 4), 'utf8'),
    }, tokenData);
    const twitchClient = new ApiClient({ authProvider });
    logger.success('Initialized Twitch client');

    // Discord client
    const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });
    logger.success('Initialized Discord client');

    // Service client
    const serviceClient = new Service(twitchClient, dbClient);
    logger.success('Initialized Service client');

    // WebSocket client
    const webSocketClient = new WebSocket(discordClient, serviceClient);
    logger.success('Initialized WebSocket client');

    // Start websocket connection with Discord
    webSocketClient.listenInteractionCreate();
    await webSocketClient.login(config.discord.token);
  } catch (e) {
    logger.error(e);
  }
};

main();
