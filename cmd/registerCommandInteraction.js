const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require(process.cwd() + "/config/config.json");
const { discordCommand } = require(process.cwd() + "/internal/discord/commandInteraction/discord.js");
const { twitchCommand } = require(process.cwd() + "/internal/discord/commandInteraction/twitch.js");

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: [discordCommand],
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
