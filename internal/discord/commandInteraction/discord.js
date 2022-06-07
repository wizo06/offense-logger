const rules = require(process.cwd() + "/config/rules.json");
const { APPLICATION_COMMAND_TYPES, APPLICATION_COMMAND_OPTION_TYPES } = require(process.cwd() + "/internal/enums");

const discordCommand = {
  type: APPLICATION_COMMAND_TYPES.get("CHAT_INPUT"),
  name: "discord",
  description: "Commands related to offenses that happend in discord",
  options: [
    {
      type: APPLICATION_COMMAND_OPTION_TYPES.get("SUB_COMMAND"),
      name: "log",
      description: "Log an offense that a discord user committed",
      options: [
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("USER"),
          name: "user",
          description: "The user that committed the offense",
          required: true,
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("STRING"),
          name: "punishment",
          description: "The action that you took to punish the user",
          required: true,
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("CHANNEL"),
          name: "channel",
          description: "The channel where the offense took place",
          required: true,
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("INTEGER"),
          name: "rule",
          description: "The rule that was broken by the user",
          required: true,
          choices: rules
            .filter((x) => x.platform === "DISCORD")
            .sort((a, b) => a.number - b.number)
            .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.number })),
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("STRING"),
          name: "notes",
          description: "Additional notes that you would like to provide",
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("ATTACHMENT"),
          name: "screenshot",
          description: "Screenshot that you would like to provide",
        },
      ],
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPES.get("SUB_COMMAND"),
      name: "rules",
      description: "See all discord rules",
    },
    {
      type: APPLICATION_COMMAND_OPTION_TYPES.get("SUB_COMMAND_GROUP"),
      name: "user",
      description: "See the offenses of a discord user",
      options: [
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("SUB_COMMAND"),
          name: "summary",
          description: "See the summary of offenses of a discord user",
          options: [
            {
              type: APPLICATION_COMMAND_OPTION_TYPES.get("USER"),
              name: "user",
              description: "The user in question",
              required: true,
            }
          ]
        },
        {
          type: APPLICATION_COMMAND_OPTION_TYPES.get("SUB_COMMAND"),
          name: "history",
          description: "See the history of offenses of a discord user",
          options: [
            {
              type: APPLICATION_COMMAND_OPTION_TYPES.get("USER"),
              name: "user",
              description: "The user in question",
              required: true,
            }
          ]
        },
      ],
    },
  ],
};

const handleDiscordCommandInteraction = async (interaction) => {
  if (interaction.options.getSubcommand() === "log") {
    return;
  }

  if (interaction.options.getSubcommand() === "rules") {
    return;
  }

  if (interaction.options.getSubcommandGroup() === "user" && interaction.options.getSubcommand() === "summary") {
    return;
  }

  if (interaction.options.getSubcommandGroup() === "user" && interaction.options.getSubcommand() === "history") {
    return;
  }
};

const handleLogSubcommand = async (interaction) => {};

const handleRulesSubcommand = async (interaction) => {};

const handleUserSummary = async (interaction) => {};

const handleUserHistory = async (interaction) => {};

module.exports = {
  discordCommand,
  handleDiscordCommandInteraction,
};
