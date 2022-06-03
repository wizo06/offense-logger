const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("../config/config.json");

const commands = [
  new SlashCommandBuilder()
    .setName("log")
    .setDescription("Log an offense that a user made")
    .addUserOption((option) =>
      option
        .setName("offender")
        .setDescription("The user that committed the offense")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("punishment")
        .setDescription("The action that you took to punish the user")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel where the offense took place")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("rule")
        .setDescription("The rule that was broken by this offense")
        .setRequired(true)
        .addChoices(
          { name: "1. No doxxing.", value: 1 },
          {
            name: "2. No discriminatory comments. An immediate ban if violated.",
            value: 2,
          },
          { name: "3. No politics or religion.", value: 3 },
          { name: "4. No posting comments in irrelevant channels.", value: 4 },
          { name: "5. No buying/selling/trading/sharing accounts.", value: 5 },
          { name: "6. No spamming chat.", value: 6 },
          {
            name: "7. NSFW content must be posted as a spoiler and only in the appropriate channel. ",
            value: 7,
          },
          {
            name: "8. No gory/disturbing content. Immediate ban if this is violated.",
            value: 8,
          },
          {
            name: "9. No pictures of spiders. An immediate ban if violated.",
            value: 9,
          },
          {
            name: "10. No mentioning of other Vtubers (exception: ongoing collabs).",
            value: 10,
          },
          {
            name: "11. No self advertisement allowed unless given the permission to.",
            value: 11,
          },
          {
            name: "12. No attention seeking, harassment, bullying, stirring up drama, or any other disruptive behavior.",
            value: 12,
          },
          {
            name: "13. Keep English only in #general-english and Korean in #general-korean.",
            value: 13,
          },
          {
            name: "14. No badmouthing other streamers, content creators, and anybody in general.",
            value: 14,
          },
          {
            name: "15. No sharing of personal information. Any attempts will be an immediate ban.",
            value: 15,
          },
          {
            name: "16. Ping Yui only if it's an emergency. Otherwise, only mods may ping me if needed.",
            value: 16,
          },
          { name: "17. No sharing invite links to random people.", value: 17 }
        )
    )
    .addStringOption((option) =>
      option
        .setName("notes")
        .setDescription(
          "Optional additional notes that you would like to provide"
        )
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("screenshot")
        .setDescription("Optional screenshot that you would like to provide")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("user")
    .setDescription("Looks up a user's offenses")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user in question")
        .setRequired(true)
    ),
];

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
