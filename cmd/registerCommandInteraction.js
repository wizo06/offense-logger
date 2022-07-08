const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { logger } = require('../pkg/logger');
const { discord } = require('../config/config.json');
const discordRules = require('../config/discordRules.json');
const enums = require('../internal/enums');
const twitchRules = require('../config/twitchRules.json');

const discordCommand = {
  type: enums.APPLICATION_COMMAND_TYPES.CHAT_INPUT,
  name: 'discord',
  description: 'Discord',
  options: [
    {
      type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
      name: 'offenses',
      description: 'Discord Offenses',
      options: [
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'list',
          description: '🔍 List offenses (sorted by most recent offenses)',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'offender',
              description: 'The user that committed the offense',
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'get',
          description: '🔍 Get an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'id',
              description: 'The ID of the offense',
              required: true,
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'create',
          description: '📝 Create an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'offender',
              description: 'The user that committed the offense',
              required: true,
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'punishment',
              description: 'The action that you took to punish the user',
              required: true,
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.CHANNEL,
              name: 'channel',
              description: 'The channel where the offense took place',
              required: true,
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.INTEGER,
              name: 'rule',
              description: 'The rule that was broken by the user',
              required: true,
              choices: discordRules
                  .sort((a, b) => a.number - b.number)
                  .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.number })),
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'notes',
              description: 'Additional notes that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.ATTACHMENT,
              name: 'screenshot',
              description: 'Screenshot that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'reporter',
              description:
                'The mod who is reporting this offense. Leave empty unless reporting on behalf of another mod',
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'update',
          description: '♻️ Update an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'id',
              description: 'The ID of the offense',
              required: true,
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'offender',
              description: 'The user that committed the offense',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'punishment',
              description: 'The action that you took to punish the user',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.CHANNEL,
              name: 'channel',
              description: 'The channel where the offense took place',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.INTEGER,
              name: 'rule',
              description: 'The rule that was broken by the user',
              choices: discordRules
                  .sort((a, b) => a.number - b.number)
                  .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.number })),
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'notes',
              description: 'Additional notes that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.ATTACHMENT,
              name: 'screenshot',
              description: 'Screenshot that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'reporter',
              description:
                'The mod who is reporting this offense. Leave empty unless reporting on behalf of another mod',
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'delete',
          description: '🗑️ Delete an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'id',
              description: 'The ID of the offense',
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
      name: 'rules',
      description: 'Discord Rules',
      options: [
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'list',
          description: '📜 List rules',
        },
      ],
    },
    {
      type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
      name: 'users',
      description: 'Discord Users',
      options: [
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'list',
          description: '👥 List users that have been reported',
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'get',
          description: '👤 Get information about a specific user (even if they have not been reported before).',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'user',
              description: 'The user that you want the information of',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};

const twitchCommand = {
  type: enums.APPLICATION_COMMAND_TYPES.CHAT_INPUT,
  name: 'twitch',
  description: 'Twitch',
  options: [
    {
      type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
      name: 'offenses',
      description: 'Twitch Offenses',
      options: [
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'list',
          description: '🔍 List offenses (sorted by most recent offenses)',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'offender',
              description: 'The user that committed the offense',
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'get',
          description: '🔍 Get an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'id',
              description: 'The ID of the offense',
              required: true,
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'create',
          description: '📝 Create an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'offender',
              description: 'The user that committed the offense',
              required: true,
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'punishment',
              description: 'The action that you took to punish the user',
              required: true,
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.INTEGER,
              name: 'rule',
              description: 'The rule that was broken by the user',
              required: true,
              choices: twitchRules
                  .sort((a, b) => a.number - b.number)
                  .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.number })),
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'notes',
              description: 'Additional notes that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.ATTACHMENT,
              name: 'screenshot',
              description: 'Screenshot that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'reporter',
              description:
                'The mod who is reporting this offense. Leave empty unless reporting on behalf of another mod',
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'update',
          description: '♻️ Update an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'id',
              description: 'The ID of the offense',
              required: true,
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'offender',
              description: 'The user that committed the offense',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'punishment',
              description: 'The action that you took to punish the user',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.INTEGER,
              name: 'rule',
              description: 'The rule that was broken by the user',
              choices: twitchRules
                  .sort((a, b) => a.number - b.number)
                  .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.number })),
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'notes',
              description: 'Additional notes that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.ATTACHMENT,
              name: 'screenshot',
              description: 'Screenshot that you would like to provide',
            },
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.USER,
              name: 'reporter',
              description:
                'The mod who is reporting this offense. Leave empty unless reporting on behalf of another mod',
            },
          ],
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'delete',
          description: '🗑️ Delete an offense',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'id',
              description: 'The ID of the offense',
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
      name: 'rules',
      description: 'Twitch Rules',
      options: [
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'list',
          description: '📜 List rules',
        },
      ],
    },
    {
      type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND_GROUP,
      name: 'users',
      description: 'Twitch Users',
      options: [
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'list',
          description: '👥 List users that have been reported',
        },
        {
          type: enums.APPLICATION_COMMAND_OPTION_TYPES.SUB_COMMAND,
          name: 'get',
          description: '👤 Get information about a specific user (even if they have not been reported before).',
          options: [
            {
              type: enums.APPLICATION_COMMAND_OPTION_TYPES.STRING,
              name: 'user',
              description: 'The user that you want the information of',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};

const rest = new REST({ version: '9' }).setToken(discord.token);
(async () => {
  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(discord.clientId, discord.guildId), {
      body: [discordCommand, twitchCommand],
    });

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error(error);
  }
})();
