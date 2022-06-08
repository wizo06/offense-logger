const { logger } = require(process.cwd() + "/pkg/logger");
const { handleDiscordCommandInteraction } = require(process.cwd() + "/internal/discord/commandInteraction/discord.js");
const { handleTwitchCommandInteraction } = require(process.cwd() + "/internal/discord/commandInteraction/twitch.js");

const handleCommandInteraction = async (interaction) => {
  try {
    if (interaction.commandName === "discord") {
      handleDiscordCommandInteraction(interaction);
      return;
    }

    if (interaction.commandName === "twitch") {
      handleTwitchCommandInteraction(interaction);
      return;
    }
  } catch (e) {
    logger.error(e);
  }
};

module.exports = {
  handleCommandInteraction,
};
