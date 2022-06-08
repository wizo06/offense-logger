const { logger } = require(process.cwd() + "/pkg/logger");
const rules = require(process.cwd() + "/config/rules.json");
const { APPLICATION_COMMAND_TYPES, APPLICATION_COMMAND_OPTION_TYPES } = require(process.cwd() +
  "/internal/enums/index.js");
const { db } = require(process.cwd() + "/internal/db");
const { apiClient } = require(process.cwd() + "/pkg/twurple");

const twitchCommand = {
  type: APPLICATION_COMMAND_TYPES.CHAT_INPUT,
  name: "twitch",
  description: "Commands related to offenses that happend in twitch",
  options: [
    {
      type: APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
      name: "log",
      description: "Log an offense that a twitch user committed",
      options: [
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.STRING,
          name: "offender",
          description: "The user that committed the offense",
          required: true,
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.STRING,
          name: "punishment",
          description: "The action that you took to punish the user",
          required: true,
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.INTEGER,
          name: "rule",
          description: "The rule that was broken by the user",
          required: true,
          choices: rules
            .filter((x) => x.platform === "TWITCH")
            .sort((a, b) => a.number - b.number)
            .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.number })),
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.STRING,
          name: "notes",
          description: "Additional notes that you would like to provide",
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.ATTACHMENT,
          name: "screenshot",
          description: "Screenshot that you would like to provide",
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.USER,
          name: "mod",
          description: "The mod who is reporting this offense. Leave empty unless reporting on behalf of another mod",
        },
      ],
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
      name: "rules",
      description: "See all twitch rules",
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
      name: "user",
      description: "See the offenses of a twitch user",
      options: [
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: "summary",
          description: "See the summary of offenses of a twitch user",
          options: [
            {
              type: APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: "user",
              description: "The user in question",
              required: true,
            },
          ],
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: "history",
          description: "See the history of offenses of a twitch user",
          options: [
            {
              type: APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: "user",
              description: "The user in question",
              required: true,
            },
          ],
        },
      ],
    },
  ],
};

const handleTwitchCommandInteraction = async (interaction) => {
  try {
    if (interaction.options.getSubcommand() === "log") {
      handleLogSubcommand(interaction);
      return;
    }

    if (interaction.options.getSubcommand() === "rules") {
      handleRulesSubcommand(interaction);
      return;
    }

    if (interaction.options.getSubcommandGroup() === "user" && interaction.options.getSubcommand() === "summary") {
      handleUserSummarySubcommand(interaction);
      return;
    }

    if (interaction.options.getSubcommandGroup() === "user" && interaction.options.getSubcommand() === "history") {
      handleUserHistorySubcommand(interaction);
      return;
    }
  } catch (e) {
    logger.error(e);
  }
};

const handleLogSubcommand = async (interaction) => {
  try {
    logger.info(`${interaction.user.tag}: /${interaction.commandName} ${interaction.options.getSubcommand()}`);

    await interaction.deferReply().catch((e) => {
      logger.error(e);
      throw "DISCORD_ERROR";
    });

    const offender = interaction.options.getString("offender", true);
    const punishment = interaction.options.getString("punishment", true);
    const ruleNumber = interaction.options.getInteger("rule", true);
    const notes = interaction.options.getString("notes");
    const screenshot = interaction.options.getAttachment("screenshot");
    const mod = interaction.options.getUser("mod");

    const user = await apiClient.users.getUserByName(offender).catch((e) => {
      logger.error(e);
      throw "TWITCH_ERROR";
    });

    if (!user) {
      throw "TWITCH_ERROR";
    }

    // Write the offense to db
    await db
      .collection("offenses")
      .doc()
      .set({
        timestamp: Math.floor(interaction.createdTimestamp / 1000),
        offenderId: user.id,
        punishment: punishment,
        loggedBy: mod ? mod.id : interaction.user.id,
        rule: ruleNumber,
        notes: notes,
        screenshotUrl: screenshot ? screenshot.url : null,
        platform: "TWITCH",
      })
      .catch((e) => {
        logger.error(e);
        throw "DB_ERROR";
      });

    // Read the offenses by offenderId to calculate the number of strikes
    const snapshot = await db
      .collection("offenses")
      .where("offenderId", "==", user.id)
      .where("platform", "==", "TWITCH")
      .where("rule", "==", ruleNumber)
      .get()
      .catch((e) => {
        logger.error(e);
        throw "DB_ERROR";
      });

    let strikeNumber = "";
    if (snapshot.size == 1) strikeNumber = "ONE STRIKE";
    if (snapshot.size == 2) strikeNumber = "TWO STRIKES";
    if (snapshot.size == 3) strikeNumber = "THREE STRIKES";
    if (snapshot.size >= 4) strikeNumber = "FOUR OR MORE STRIKES";

    await interaction
      .editReply({
        files: [{ attachment: `./assets/${ruleNumber}.png` }],
        embeds: [
          {
            title: strikeNumber,
            description: notes,
            color: 0xff0000,
            thumbnail: {
              url: `attachment://${ruleNumber}.png`,
            },
            image: {
              url: screenshot ? screenshot.url : null,
            },
            author: {
              name: user.name,
              iconURL: user.profilePictureUrl,
            },
            fields: [
              {
                name: "Offender",
                value: user.name,
                inline: true,
              },
              {
                name: "Offender's account created at",
                value: `<t:${Math.floor(user.creationDate.getTime() / 1000)}>`,
                inline: true,
              },
              {
                name: "⠀",
                value: "⠀",
                inline: true,
              },
              {
                name: "Punishment",
                value: punishment,
                inline: true,
              },
              {
                name: "⠀",
                value: "⠀",
                inline: true,
              },
              {
                name: "⠀",
                value: "⠀",
                inline: true,
              },
              {
                name: "Logged by",
                value: mod ? `<@${mod.id}>` : `<@${interaction.user.id}>`,
                inline: true,
              },
              {
                name: "Timestamp",
                value: `<t:${Math.floor(interaction.createdTimestamp / 1000)}>`,
                inline: true,
              },
              {
                name: "Relative Timestamp",
                value: `<t:${Math.floor(interaction.createdTimestamp / 1000)}:R>`,
                inline: true,
              },
            ],
          },
        ],
      })
      .catch((e) => {
        logger.error(e);
        throw "DISCORD_ERROR";
      });
  } catch (e) {
    logger.error(e);
    if (e === "DB_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "TWITCH_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "DISCORD_ERROR") {
      return;
    }
    await interaction.editReply({ content: "INTERNAL_ERROR" });
  }
};

const handleRulesSubcommand = async (interaction) => {
  try {
    logger.info(`${interaction.user.tag}: /${interaction.commandName} ${interaction.options.getSubcommand()}`);

    await interaction.deferReply().catch((e) => {
      logger.error(e);
      throw "DISCORD_ERROR";
    });

    await interaction
      .editReply({
        embeds: [
          {
            title: "RULES",
            fields: rules
              .filter((x) => x.platform === "TWITCH")
              .sort((a, b) => a.number - b.number)
              .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.description })),
          },
        ],
      })
      .catch((e) => {
        logger.error(e);
        throw "DISCORD_ERROR";
      });
  } catch (e) {
    logger.error(e);
    if (e === "DB_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "TWITCH_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "DISCORD_ERROR") {
      return;
    }
    await interaction.editReply({ content: "INTERNAL_ERROR" });
  }
};

const handleUserSummarySubcommand = async (interaction) => {
  try {
    logger.info(
      `${interaction.user.tag}: /${
        interaction.commandName
      } ${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}`
    );

    await interaction.deferReply().catch((e) => {
      logger.error(e);
      throw "DISCORD_ERROR";
    });
    const offender = interaction.options.getString("user");

    const user = await apiClient.users.getUserByName(offender).catch((e) => {
      logger.error(e);
      throw "TWITCH_ERROR";
    });

    if (!user) {
      throw "TWITCH_ERROR";
    }

    const offensesSnapshot = await db
      .collection("offenses")
      .where("offenderId", "==", user.id)
      .where("platform", "==", "TWITCH")
      .get()
      .catch((e) => {
        logger.error(e);
        throw "DB_ERROR";
      });

    const fields = [];
    for (const rule of rules.filter((x) => x.platform === "TWITCH").sort((a, b) => a.number - b.number)) {
      const numOfStrikes = offensesSnapshot.docs.filter((offense) => offense.data().rule == rule.number).length;

      fields.push({
        name: `${rule.number}. ${rule.shortName}`,
        value: `${numOfStrikes}`,
      });
    }

    await interaction
      .editReply({
        embeds: [
          {
            title: `SUMMARY OF OFFENSES`,
            description: `**${user.name}** Account Created <t:${Math.floor(
              user.creationDate.getTime() / 1000
            )}>\nTotal offenses: ${offensesSnapshot.size}`,
            color: 0x00ffff,
            author: {
              name: user.name,
              iconURL: user.profilePictureUrl,
            },
            fields: fields,
          },
        ],
      })
      .catch((e) => {
        logger.error(e);
        throw "DISCORD_ERROR";
      });
  } catch (e) {
    logger.error(e);
    if (e === "DB_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "TWITCH_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "DISCORD_ERROR") {
      return;
    }
    await interaction.editReply({ content: "INTERNAL_ERROR" });
  }
};

const handleUserHistorySubcommand = async (interaction) => {
  try {
    logger.info(
      `${interaction.user.tag}: /${
        interaction.commandName
      } ${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}`
    );

    await interaction.deferReply().catch((e) => {
      logger.error(e);
      throw "DISCORD_ERROR";
    });
    const offender = interaction.options.getString("user");

    const user = await apiClient.users.getUserByName(offender).catch((e) => {
      logger.error(e);
      throw "TWITCH_ERROR";
    });

    if (!user) {
      throw "TWITCH_ERROR";
    }

    const offensesSnapshot = await db
      .collection("offenses")
      .where("offenderId", "==", user.id)
      .where("platform", "==", "TWITCH")
      .orderBy("timestamp", "desc")
      .limit(25)
      .get()
      .catch((e) => {
        logger.error(e);
        throw "DB_ERROR";
      });

    const fields = offensesSnapshot.docs.map((offense) => {
      const rule = rules
        .filter((x) => x.platform === "TWITCH")
        .filter((rule) => rule.number === offense.data().rule)[0];
      return {
        name: `${rule.number}. ${rule.shortName}`,
        value: `Timestamp: <t:${offense.data().timestamp}> | Logged by: <@${offense.data().loggedBy}>`,
      };
    });

    await interaction
      .editReply({
        embeds: [
          {
            author: {
              name: user.name,
              iconURL: user.profilePictureUrl,
            },
            title: "HISTORY OF OFFENSES",
            description: "25 most recent offenses",
            color: 0x00ffff,
            fields: fields,
          },
        ],
      })
      .catch((e) => {
        logger.error(e);
        throw "DISCORD_ERROR";
      });
  } catch (e) {
    logger.error(e);
    if (e === "DB_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "TWITCH_ERROR") {
      await interaction.editReply({ content: e });
      return;
    }
    if (e === "DISCORD_ERROR") {
      return;
    }
  }
};

module.exports = {
  twitchCommand,
  handleTwitchCommandInteraction,
};
