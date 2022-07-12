const { ApiClient } = require('@twurple/api');
const { RefreshingAuthProvider } = require('@twurple/auth');
const { Client, Intents } = require('discord.js');
const { promises: fs } = require('fs');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { join } = require('path');

const config = require('../config/config.json');
const { DB } = require('../internal/db/db');
const { logger } = require('../pkg/logger/logger');
const { Service } = require('../internal/service/service');
const tokenData = require('../config/tokens.json');
const { WebSocket } = require('../internal/websocket/websocket');

process.on('uncaughtException', (err, origin) => {
  console.error(err);
  console.error(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(reason);
  console.error(promise);
});

/**
 * main is the entry point of the application
 */
const main = async () => {
  try {
    // Connect to MongoDB
    const uri = `mongodb+srv://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}/?retryWrites=true&w=majority`;
    const mongoClient = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    logger.info('Connecting to MongoDB');
    await mongoClient.connect();

    // DB client
    const db = mongoClient.db(config.mongodb.database);
    logger.info('Initializing DB client');
    const dbClient = new DB(db);

    // Twitch client
    const authProvider = new RefreshingAuthProvider({
      clientId: config.twitch.clientId,
      clientSecret: config.twitch.clientSecret,
      onRefresh: async (newTokenData) => await fs.writeFile(join(__dirname, '../config/tokens.json'), JSON.stringify(newTokenData, null, 4), 'utf8'),
    }, tokenData);
    logger.info('Initializing Twitch client');
    const twitchClient = new ApiClient({ authProvider });

    // Discord client
    logger.info('Initializing Discord client');
    const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });

    // Service client
    logger.info('Initializing Service client');
    const serviceClient = new Service(twitchClient, dbClient);

    // WebSocket client
    logger.info('Initializing WebSocket client');
    const webSocketClient = new WebSocket(discordClient, serviceClient);

    // Start websocket connection with Discord
    webSocketClient.listenInteractionCreate();
    await webSocketClient.login(config.discord.token);
  } catch (e) {
    logger.error(e);
  }
};

main();
