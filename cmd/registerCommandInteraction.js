const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { discord } = require(process.cwd() + "/config/config.json");
const { discordCommand } = require(process.cwd() + "/internal/discord/commandInteraction/discord.js");
const { twitchCommand } = require(process.cwd() + "/internal/discord/commandInteraction/twitch.js");

const rest = new REST({ version: "9" }).setToken(discord.token);
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(discord.clientId, discord.guildId), {
      body: [discordCommand, twitchCommand],
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
