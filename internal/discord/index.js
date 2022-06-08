const { Client, Intents } = require("discord.js");
const { logger } = require(process.cwd() + "/pkg/logger");
const { handleCommandInteraction } = require(process.cwd() + "/internal/discord/commandInteraction");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
    }

    if (interaction.isButton()) {
    }

    if (interaction.isCommand()) {
      handleCommandInteraction(interaction);
    }

    if (interaction.isContextMenu()) {
    }

    if (interaction.isMessageComponent()) {
    }

    if (interaction.isMessageContextMenu()) {
    }

    if (interaction.isModalSubmit()) {
    }

    if (interaction.isRepliable()) {
    }

    if (interaction.isSelectMenu()) {
    }

    if (interaction.isUserContextMenu()) {
    }
  } catch (e) {
    logger.error(e);
  }
});

client.once("ready", () => {
  logger.success("Logged in to discord");
});

module.exports = {
  client,
};
