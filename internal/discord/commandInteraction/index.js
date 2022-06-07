const { handleDiscordCommandInteraction } = require(process.cwd() + "/internal/discord/commandInteraction/discord.js")
const { handleTwitchCommandInteraction } = require(process.cwd() + "/internal/discord/commandInteraction/twitch.js")

const handleCommandInteraction = async (interaction) => {
  if (interaction.commandName === "discord") {
    handleDiscordCommandInteraction(interaction);
    return;
  }

  if (interaction.commandName === "twitch") {
    handleTwitchCommandInteraction(interaction);
    return;
  }
}

module.exports = {
  handleCommandInteraction,
}