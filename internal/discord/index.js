const { Client, Intents } = require("discord.js");
const { logger } = require(process.cwd() + "/pkg/logger");
const service = require(process.cwd() + "/internal/service");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on("interactionCreate", async (interaction) => {
  service.HandleInteraction(interaction);  
});

client.once("ready", () => {
  logger.success("Logged in to discord");
});

module.exports = {
  client,
};
