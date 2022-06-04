const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { clientId, guildId, token } = require("../config/config.json");
const { db } = require("./firebase.js");

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    const snapshot = await db
      .collection("rules")
      .orderBy("number", "asc")
      .get();
    const choices = snapshot.docs.map((x) => {
      return {
        name: `${x.data().number}. ${x.data().shortName}`,
        value: x.data().number,
      };
    });

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
            .addChoices(...choices)
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
            .setDescription(
              "Optional screenshot that you would like to provide"
            )
            .setRequired(false)
        ),

      new SlashCommandBuilder()
        .setName("user")
        .setDescription("Commands to look up a user's offenses")
        .addSubcommand((sc) =>
          sc
            .setName("summary")
            .setDescription("Looks up a user's summary of offenses")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user in question")
                .setRequired(true)
            )
        )
        .addSubcommand((sc) =>
          sc
            .setName("history")
            .setDescription("Looks up a user's history of offenses")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user in question")
                .setRequired(true)
            )
        ),
      new SlashCommandBuilder()
        .setName("rules")
        .setDescription("Show all rules"),
    ];

    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
