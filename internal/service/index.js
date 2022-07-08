const { ApiClient } = require('@twurple/api');
const { CommandInteraction } = require('discord.js');

const { DB } = require('../db');
const discordRules = require('../../config/discordRules.json');
const { logger } = require('../../pkg/logger');
const twitchRules = require('../../config/twitchRules.json');

/** Service handles all application logic and business logic */
class Service {
  /**
   * @param {ApiClient} twitchClient
   * @param {DB} dbClient
   */
  constructor(twitchClient, dbClient) {
    this.twitchClient = twitchClient;
    this.dbClient = dbClient;
  }

  /**
   * @param {CommandInteraction} interaction
   */
  handleDiscordCommandInteraction(interaction) {
    const scg = interaction.options.getSubcommandGroup();
    const sc = interaction.options.getSubcommand();

    if (scg === 'offenses' && sc === 'list') {
      this.#handleDiscordOffensesList(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'get') {
      this.#handleDiscordOffensesGet(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'create') {
      this.#handleDiscordOffensesCreate(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'update') {
      this.#handleDiscordOffensesUpdate(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'delete') {
      this.#handleDiscordOffensesDelete(interaction);
      return;
    }

    if (scg === 'rules' && sc === 'list') {
      this.#handleDiscordRulesList(interaction);
      return;
    }

    if (scg === 'users' && sc === 'list') {
      this.#handleDiscordUsersList(interaction);
      return;
    }

    if (scg === 'users' && sc === 'get') {
      this.#handleDiscordUsersGet(interaction);
      return;
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  handleTwitchCommandInteraction(interaction) {
    const scg = interaction.options.getSubcommandGroup();
    const sc = interaction.options.getSubcommand();

    if (scg === 'offenses' && sc === 'list') {
      this.#handleTwitchOffensesList(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'get') {
      this.#handleTwitchOffensesGet(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'create') {
      this.#handleTwitchOffensesCreate(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'update') {
      this.#handleTwitchOffensesUpdate(interaction);
      return;
    }

    if (scg === 'offenses' && sc === 'delete') {
      this.#handleTwitchOffensesDelete(interaction);
      return;
    }

    if (scg === 'rules' && sc === 'list') {
      this.#handleTwitchRulesList(interaction);
      return;
    }

    if (scg === 'users' && sc === 'list') {
      this.#handleTwitchUsersList(interaction);
      return;
    }

    if (scg === 'users' && sc === 'get') {
      this.#handleTwitchUsersGet(interaction);
      return;
    }
  };

  /* Discord */

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordOffensesList(interaction) {
    try {
      await interaction.deferReply();

      // Non-required options
      const offender = interaction.options.getUser('offender', false);

      const offenses = await this.dbClient.listDocuments(
          'discordOffenses',
          offender ? { offenderId: offender.id } : null, // filter or no filter
          { timestamp: -1 },
          25,
      );

      const fields = offenses.map((offense) => {
        const rule = discordRules.filter((x) => x.number === offense.rule)[0];
        return {
          name: `Offense ID: ${offense._id.toHexString()}`,
          value: `Offender: <@${offense.offenderId}> | ${rule.number}. ${rule.shortName}\n
          Reported by: <@${offense.reporterId}> | Time of report: <t:${offense.timestamp}>`,
        };
      });

      await interaction.editReply({
        embeds: [
          {
            title: 'OFFENSES',
            color: 0x5865f2,
            fields: fields,
          },
        ],
      });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordOffensesGet(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const id = interaction.options.getString('id', true).trim();

      const offenseDoc = await this.dbClient.getDocument('discordOffenses', id);

      const {
        userTag,
        userAvatarURL,
        userCreatedTimestamp,
        userJoinedTimestamp,
      } = await this.#getDiscordUserMetadata(interaction, offenseDoc.offenderId);

      const rule = discordRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: [
              {
                title: 'OFFENSE',
                description: offenseDoc.notes,
                color: 0x5865f2,
                author: {
                  name: userTag,
                  iconURL: userAvatarURL,
                },
                image: {
                  url: offenseDoc.screenshotUrl,
                },
                footer: {
                  text: `Offense ID: ${offenseDoc._id.toHexString()}`,
                },
                fields: [
                  {
                    name: 'Offender',
                    value: `<@${offenseDoc.offenderId}>`,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreatedTimestamp),
                    inline: true,
                  },
                  {
                    name: 'Joined Server',
                    value: convertTimestampNumberToDiscordTimestampFormat(userJoinedTimestamp),
                    inline: true,
                  },
                  {
                    name: 'Channel',
                    value: `<#${offenseDoc.channelId}>`,
                    inline: true,
                  },
                  {
                    name: 'Punishment',
                    value: offenseDoc.punishment,
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Reported by',
                    value: `<@${offenseDoc.reporterId}>`,
                    inline: true,
                  },
                  {
                    name: 'Time of report',
                    value: convertTimestampNumberToDiscordTimestampFormat(offenseDoc.timestamp),
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: `${rule.number}. ${rule.shortName}`,
                    value: rule.description,
                    inline: true,
                  },
                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordOffensesCreate(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const offender = interaction.options.getUser('offender', true);
      const punishment = interaction.options.getString('punishment', true);
      const channel = interaction.options.getChannel('channel', true);
      const ruleNumber = interaction.options.getInteger('rule', true);

      // Non-required options
      const notes = interaction.options.getString('notes', false);
      const screenshot = interaction.options.getAttachment('screenshot', false);
      const reporter = interaction.options.getUser('reporter', false);

      const offenseDoc = await this.dbClient.createDocument('discordOffenses', {
        timestamp: interaction.createdTimestamp,
        offenderId: offender.id,
        channelId: channel.id,
        punishment: punishment,
        reporterId: reporter ? reporter.id : interaction.user.id,
        rule: ruleNumber,
        notes: notes,
        screenshotUrl: screenshot ? screenshot.url : null,
      });

      const {
        userId,
        userTag,
        userAvatarURL,
        userCreatedTimestamp,
        userJoinedTimestamp,
      } = await this.#getDiscordUserMetadata(interaction, offenseDoc.offenderId);

      await this.dbClient.createDocument('discordUsers', {
        _id: userId,
        userTag,
        userAvatarURL,
        userCreatedTimestamp,
        userJoinedTimestamp,
      });

      const rule = discordRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: [
              {
                title: 'OFFENSE',
                description: offenseDoc.notes,
                color: 0x5865f2,
                author: {
                  name: userTag,
                  iconURL: userAvatarURL,
                },
                image: {
                  url: offenseDoc.screenshotUrl,
                },
                footer: {
                  text: `Offense ID: ${offenseDoc._id.toHexString()}`,
                },
                fields: [
                  {
                    name: 'Offender',
                    value: `<@${offenseDoc.offenderId}>`,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreatedTimestamp),
                    inline: true,
                  },
                  {
                    name: 'Joined Server',
                    value: convertTimestampNumberToDiscordTimestampFormat(userJoinedTimestamp),
                    inline: true,
                  },
                  {
                    name: 'Channel',
                    value: `<#${offenseDoc.channelId}>`,
                    inline: true,
                  },
                  {
                    name: 'Punishment',
                    value: offenseDoc.punishment,
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Reported by',
                    value: `<@${offenseDoc.reporterId}>`,
                    inline: true,
                  },
                  {
                    name: 'Time of report',
                    value: convertTimestampNumberToDiscordTimestampFormat(offenseDoc.timestamp),
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: `${rule.number}. ${rule.shortName}`,
                    value: rule.description,
                    inline: true,
                  },
                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordOffensesUpdate(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const id = interaction.options.getString('id', true).trim();

      // Non-required options
      const offender = interaction.options.getUser('offender');
      const punishment = interaction.options.getString('punishment');
      const channel = interaction.options.getChannel('channel');
      const ruleNumber = interaction.options.getInteger('rule');
      const notes = interaction.options.getString('notes');
      const screenshot = interaction.options.getAttachment('screenshot');
      const reporter = interaction.options.getUser('reporter');

      const updateMask = {
        offenderId: offender ? offender.id : null,
        punishment: punishment ? punishment : null,
        channelId: channel ? channel.id : null,
        rule: ruleNumber ? ruleNumber : null,
        notes: notes ? notes : null,
        screenshotUrl: screenshot ? screenshot.url : null,
        reporterId: reporter ? reporter.id : null,
      };

      const offenseDoc = await this.dbClient.updateDocument('discordOffenses', id, updateMask);

      const {
        userId,
        userTag,
        userAvatarURL,
        userCreatedTimestamp,
        userJoinedTimestamp,
      } = await this.#getDiscordUserMetadata(interaction, offenseDoc.offenderId);

      await this.dbClient.upsertDocument('discordUsers', userId,
          {
            userTag,
            userAvatarURL,
            userCreatedTimestamp,
            userJoinedTimestamp,
          });

      const rule = discordRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: [
              {
                title: 'OFFENSE',
                description: offenseDoc.notes,
                color: 0x5865f2,
                author: {
                  name: userTag,
                  iconURL: userAvatarURL,
                },
                image: {
                  url: offenseDoc.screenshotUrl,
                },
                footer: {
                  text: `Offense ID: ${offenseDoc._id.toHexString()}`,
                },
                fields: [
                  {
                    name: 'Offender',
                    value: `<@${offenseDoc.offenderId}>`,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreatedTimestamp),
                    inline: true,
                  },
                  {
                    name: 'Joined Server',
                    value: convertTimestampNumberToDiscordTimestampFormat(userJoinedTimestamp),
                    inline: true,
                  },
                  {
                    name: 'Channel',
                    value: `<#${offenseDoc.channelId}>`,
                    inline: true,
                  },
                  {
                    name: 'Punishment',
                    value: offenseDoc.punishment,
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Reported by',
                    value: `<@${offenseDoc.reporterId}>`,
                    inline: true,
                  },
                  {
                    name: 'Time of report',
                    value: convertTimestampNumberToDiscordTimestampFormat(offenseDoc.timestamp),
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: `${rule.number}. ${rule.shortName}`,
                    value: rule.description,
                    inline: true,
                  },
                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordOffensesDelete(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const id = interaction.options.getString('id', true).trim();

      await this.dbClient.deleteDocument('discordOffenses', id);

      await interaction.editReply({ content: '✅ Deleted' });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordRulesList(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      await interaction
          .editReply({
            embeds: [
              {
                title: 'RULES',
                color: 0x5865f2,
                fields: discordRules
                    .sort((a, b) => a.number - b.number)
                    .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.description })),
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordUsersList(interaction) {
    try {
      await interaction.deferReply();

      const users = await this.dbClient.listDocuments(
          'discordUsers',
          null,
          { userTag: 1 },
          70,
      );

      await interaction
          .editReply({
            embeds: [
              {
                title: 'USERS',
                color: 0x5865f2,
                description: users
                    .map((user) => {
                      return `<@${user._id.toHexString()}> Account Created: ${convertTimestampNumberToDiscordTimestampFormat(
                          user.userCreatedTimestamp,
                      )}`;
                    })
                    .join('\n'),
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleDiscordUsersGet(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const user = interaction.options.getUser('user', true);

      const {
        userId,
        userTag,
        userAvatarURL,
        userCreatedTimestamp,
        userJoinedTimestamp,
      } = await this.#getDiscordUserMetadata(interaction, user.id);

      await interaction
          .editReply({
            embeds: [
              {
                title: 'USERS',
                color: 0x5865f2,
                author: {
                  name: userTag,
                  iconURL: userAvatarURL,
                },
                thumbnail: {
                  url: userAvatarURL,
                },
                footer: {
                  text: `User ID: ${userId}`,
                },
                fields: [
                  {
                    name: 'User',
                    value: `<@${userId}>`,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreatedTimestamp),
                    inline: true,
                  },
                  {
                    name: 'Joined Server',
                    value: convertTimestampNumberToDiscordTimestampFormat(userJoinedTimestamp),
                    inline: true,
                  },
                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   * @param {string} userId
   */
  async #getDiscordUserMetadata(interaction, userId) {
    try {
      // Get offender metadata from discord
      if (!interaction?.guild?.available) {
        return Promise.reject(new Error('GUILD_UNAVAILABLE'));
      }

      const guild = await interaction.guild.fetch();

      const member = await guild.members.fetch({ user: userId, force: true, cache: false });

      return Promise.resolve({
        userId: member.user.id,
        userTag: member.user.tag,
        userAvatarURL: member.user.avatarURL(),
        userCreatedTimestamp: member.user.createdTimestamp,
        userJoinedTimestamp: member.joinedTimestamp,
      });
    } catch (e) {
      // Get offender metadata from db if failed to get from discord
      try {
        const user = await this.dbClient.getDocument('discordUsers', userId);

        return Promise.resolve({
          userId: user._id.toHexString(),
          userTag: user.userTag,
          userAvatarURL: user.userAvatarUrl,
          userCreatedTimestamp: user.userCreatedTimestamp,
          userJoinedTimestamp: user.userJoinedTimestamp,
        });
      } catch (e) {
        // Return zero values if failed to get from db
        return Promise.resolve({
          userId: '',
          userTag: '',
          userAvatarURL: '',
          userCreatedTimestamp: 0,
          userJoinedTimestamp: 0,
        });
      }
    }
  };

  /* Twitch */

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchOffensesList(interaction) {
    try {
      await interaction.deferReply();

      // Non-required options
      const offender = interaction.options.getString('offender', false);

      const { userId, err } = (offender) ? await this.#getTwitchUserMetadata('', offender, true) : { userId: '', err: null };
      if (err) {
        await interaction.editReply({ content: `User ${offender} not found in Twitch` });
        return;
      }

      const offenses = await this.dbClient.listDocuments(
          'twitchOffenses',
          offender ? { offenderId: userId } : null, // filter or no filter
          { timestamp: -1 },
          25,
      );

      const fields = offenses.map((offense) => {
        const rule = twitchRules.filter((x) => x.number === offense.rule)[0];
        return {
          name: `Offense ID: ${offense._id.toHexString()}`,
          value: `Offender: <@${offense.offenderId}> | ${rule.number}. ${rule.shortName}\n
          Reported by: <@${offense.reporterId}> | Time of report: <t:${offense.timestamp}>`,
        };
      });

      await interaction.editReply({
        embeds: [
          {
            title: 'OFFENSES',
            color: 0x9146ff,
            fields: fields,
          },
        ],
      });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchOffensesGet(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const id = interaction.options.getString('id', true).trim();

      const offenseDoc = await this.dbClient.getDocument('twitchOffenses', id);

      const {
        userName,
        userCreationDate,
        userProfilePictureUrl,
        userFollowsBroadcaster,
        userFollowBroadcasterDate,
        userSubscriptionTier,
        userSubscriptionIsGift,
        userSubscriptionGifterName,
      } = await this.#getTwitchUserMetadata(offenseDoc.offenderId, '', false);

      const rule = twitchRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: [
              {
                title: 'OFFENSE',
                description: offenseDoc.notes,
                color: 0x9146ff,
                author: {
                  name: userName,
                  iconURL: userProfilePictureUrl,
                },
                image: {
                  url: offenseDoc.screenshotUrl,
                },
                footer: {
                  text: `Offense ID: ${offenseDoc._id.toHexString()}`,
                },
                fields: [
                  {
                    name: 'Offender',
                    value: userName,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreationDate.getTime()),
                    inline: true,
                  },
                  {
                    name: 'Follow Date (empty means "not following")',
                    value: (userFollowsBroadcaster) ? convertTimestampNumberToDiscordTimestampFormat(userFollowBroadcasterDate.getTime()) : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Tier (empty means "not subscribed")',
                    value: (userSubscriptionTier) ? userSubscriptionTier : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Gifted by (empty means "not gifted")',
                    value: (userSubscriptionIsGift) ? userSubscriptionGifterName : '',
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Punishment',
                    value: offenseDoc.punishment,
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Reported by',
                    value: `<@${offenseDoc.reporterId}>`,
                    inline: true,
                  },
                  {
                    name: 'Time of report',
                    value: convertTimestampNumberToDiscordTimestampFormat(offenseDoc.timestamp),
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: `${rule.number}. ${rule.shortName}`,
                    value: rule.description,
                    inline: true,
                  },
                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchOffensesCreate(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const offender = interaction.options.getString('offender', true);
      const punishment = interaction.options.getString('punishment', true);
      const ruleNumber = interaction.options.getInteger('rule', true);

      // Non-required options
      const notes = interaction.options.getString('notes', false);
      const screenshot = interaction.options.getAttachment('screenshot', false);
      const reporter = interaction.options.getUser('reporter', false);

      const {
        userId,
        userName,
        userDisplayName,
        userCreationDate,
        userProfilePictureUrl,
        userFollowsBroadcaster,
        userFollowBroadcasterDate,
        userSubscriptionTier,
        userSubscriptionIsGift,
        userSubscriptionGifterId,
        userSubscriptionGifterName,
        err,
      } = await this.#getTwitchUserMetadata('', offender, true);
      if (err) {
        await interaction.editReply({ content: `User ${offender} not found in Twitch` });
        return;
      }

      const offenseDoc = await this.dbClient.createDocument('twitchOffenses', {
        timestamp: interaction.createdTimestamp,
        offenderId: userId,
        punishment: punishment,
        reporterId: reporter ? reporter.id : interaction.user.id,
        rule: ruleNumber,
        notes: notes,
        screenshotUrl: screenshot ? screenshot.url : null,
      });

      await this.dbClient.createDocument('twitchUsers', {
        _id: userId,
        userName,
        userDisplayName,
        userCreationDate,
        userProfilePictureUrl,
        userFollowsBroadcaster,
        userFollowBroadcasterDate,
        userSubscriptionTier,
        userSubscriptionIsGift,
        userSubscriptionGifterId,
        userSubscriptionGifterName,
      });

      const rule = twitchRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: [
              {
                title: 'OFFENSE',
                description: offenseDoc.notes,
                color: 0x9146ff,
                author: {
                  name: userName,
                  iconURL: userProfilePictureUrl,
                },
                image: {
                  url: offenseDoc.screenshotUrl,
                },
                footer: {
                  text: `Offense ID: ${offenseDoc._id.toHexString()}`,
                },
                fields: [
                  {
                    name: 'Offender',
                    value: userName,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreationDate.getTime()),
                    inline: true,
                  },
                  {
                    name: 'Follow Date (empty means "not following")',
                    value: (userFollowsBroadcaster) ? convertTimestampNumberToDiscordTimestampFormat(userFollowBroadcasterDate.getTime()) : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Tier (empty means "not subscribed")',
                    value: (userSubscriptionTier) ? userSubscriptionTier : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Gifted by (empty means "not gifted")',
                    value: (userSubscriptionIsGift) ? userSubscriptionGifterName : '',
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Punishment',
                    value: offenseDoc.punishment,
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Reported by',
                    value: `<@${offenseDoc.reporterId}>`,
                    inline: true,
                  },
                  {
                    name: 'Time of report',
                    value: convertTimestampNumberToDiscordTimestampFormat(offenseDoc.timestamp),
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: `${rule.number}. ${rule.shortName}`,
                    value: rule.description,
                    inline: true,
                  },
                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchOffensesUpdate(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const id = interaction.options.getString('id', true).trim();

      // Non-required options
      const offender = interaction.options.getString('offender');
      const punishment = interaction.options.getString('punishment');
      const ruleNumber = interaction.options.getInteger('rule');
      const notes = interaction.options.getString('notes');
      const screenshot = interaction.options.getAttachment('screenshot');
      const reporter = interaction.options.getUser('reporter');

      const { userId, err } = (offender) ? await this.#getTwitchUserMetadata('', offender, true) : { userId: '', err: null };
      if (err) {
        await interaction.editReply({ content: `User ${offender} not found in Twitch` });
        return;
      }

      const updateMask = {
        offenderId: offender ? userId : null,
        punishment: punishment ? punishment : null,
        rule: ruleNumber ? ruleNumber : null,
        notes: notes ? notes : null,
        screenshotUrl: screenshot ? screenshot.url : null,
        reporterId: reporter ? reporter.id : null,
      };

      const offenseDoc = await this.dbClient.updateDocument('twitchOffenses', id, updateMask);

      const {
        userName,
        userDisplayName,
        userCreationDate,
        userProfilePictureUrl,
        userFollowsBroadcaster,
        userFollowBroadcasterDate,
        userSubscriptionTier,
        userSubscriptionIsGift,
        userSubscriptionGifterId,
        userSubscriptionGifterName,
      } = await this.#getTwitchUserMetadata(offenseDoc.offenderId, '', false);

      await this.dbClient.upsertDocument('twitchUsers', offenseDoc.offenderId,
          {
            userName,
            userDisplayName,
            userCreationDate,
            userProfilePictureUrl,
            userFollowsBroadcaster,
            userFollowBroadcasterDate,
            userSubscriptionTier,
            userSubscriptionIsGift,
            userSubscriptionGifterId,
            userSubscriptionGifterName,
          });

      const rule = twitchRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: [
              {
                title: 'OFFENSE',
                description: offenseDoc.notes,
                color: 0x9146ff,
                author: {
                  name: userName,
                  iconURL: userProfilePictureUrl,
                },
                image: {
                  url: offenseDoc.screenshotUrl,
                },
                footer: {
                  text: `Offense ID: ${offenseDoc._id.toHexString()}`,
                },
                fields: [
                  {
                    name: 'Offender',
                    value: userName,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreationDate.getTime()),
                    inline: true,
                  },
                  {
                    name: 'Follow Date (empty means "not following")',
                    value: (userFollowsBroadcaster) ? convertTimestampNumberToDiscordTimestampFormat(userFollowBroadcasterDate.getTime()) : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Tier (empty means "not subscribed")',
                    value: (userSubscriptionTier) ? userSubscriptionTier : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Gifted by (empty means "not gifted")',
                    value: (userSubscriptionIsGift) ? userSubscriptionGifterName : '',
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Punishment',
                    value: offenseDoc.punishment,
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: 'Reported by',
                    value: `<@${offenseDoc.reporterId}>`,
                    inline: true,
                  },
                  {
                    name: 'Time of report',
                    value: convertTimestampNumberToDiscordTimestampFormat(offenseDoc.timestamp),
                    inline: true,
                  },
                  {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true,
                  },
                  {
                    name: `${rule.number}. ${rule.shortName}`,
                    value: rule.description,
                    inline: true,
                  },
                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchOffensesDelete(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const id = interaction.options.getString('id', true).trim();

      await this.dbClient.deleteDocument('twitchOffenses', id);

      await interaction.editReply({ content: '✅ Deleted' });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchRulesList(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      await interaction
          .editReply({
            embeds: [
              {
                title: 'RULES',
                color: 0x9146ff,
                fields: twitchRules
                    .sort((a, b) => a.number - b.number)
                    .map((x) => ({ name: `${x.number}. ${x.shortName}`, value: x.description })),
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchUsersList(interaction) {
    try {
      await interaction.deferReply();

      const users = await this.dbClient.listDocuments(
          'twitchUsers',
          null,
          { userName: 1 },
          70,
      );

      await interaction
          .editReply({
            embeds: [
              {
                title: 'USERS',
                color: 0x9146ff,
                description: users
                    .map((user) => {
                      return `${user.userName} Account Created: ${convertTimestampNumberToDiscordTimestampFormat(
                          user.userCreationDate.getTime(),
                      )}`;
                    })
                    .join('\n'),
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {CommandInteraction} interaction
   */
  async #handleTwitchUsersGet(interaction) {
    try {
      await interaction.deferReply();

      // Required options
      const user = interaction.options.getString('user', true);

      const {
        userId,
        userName,
        userCreationDate,
        userProfilePictureUrl,
        userFollowsBroadcaster,
        userFollowBroadcasterDate,
        userSubscriptionTier,
        userSubscriptionIsGift,
        userSubscriptionGifterName,
        err,
      } = await this.#getTwitchUserMetadata('', user, true);
      if (err) {
        await interaction.editReply({ content: `User ${user} not found in Twitch` });
        return;
      }

      await interaction
          .editReply({
            embeds: [
              {
                title: 'USERS',
                color: 0x9146ff,
                author: {
                  name: userName,
                  iconURL: userProfilePictureUrl,
                },
                thumbnail: {
                  url: userProfilePictureUrl,
                },
                footer: {
                  text: `User ID: ${userId}`,
                },
                fields: [
                  {
                    name: 'User',
                    value: userName,
                    inline: true,
                  },
                  {
                    name: 'Account Created',
                    value: convertTimestampNumberToDiscordTimestampFormat(userCreationDate.getTime()),
                    inline: true,
                  },
                  {
                    name: 'Follow Date (empty means "not following")',
                    value: (userFollowsBroadcaster) ? convertTimestampNumberToDiscordTimestampFormat(userFollowBroadcasterDate.getTime()) : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Tier (empty means "not subscribed")',
                    value: (userSubscriptionTier) ? userSubscriptionTier : '',
                    inline: true,
                  },
                  {
                    name: 'Subscription Gifted by (empty means "not gifted")',
                    value: (userSubscriptionIsGift) ? userSubscriptionGifterName : '',
                    inline: true,
                  },

                ],
              },
            ],
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @param {string} userId
   * @param {string} username
   * @param {boolean} throwIfUserNotFound
   */
  async #getTwitchUserMetadata(userId, username, throwIfUserNotFound) {
    try {
      // Get offender metadata from twitch
      const user = (userId) ?
      await this.twitchClient.users.getUserById(userId) :
      await this.twitchClient.users.getUserByName(username);

      const broadcaster = await this.twitchClient.users.getUserByName('umikoyui');
      if (!user) throw new Error('getUserByName() error');
      if (!broadcaster) throw new Error(user.id);

      const subscription = await this.twitchClient.subscriptions.getSubscriptionForUser(broadcaster.id, user.id)
          .catch(() => {
            throw new Error(user.id);
          });

      const followsBroadcaster = await user.follows(broadcaster.id);

      const follow = await user.getFollowTo(broadcaster.id)
          .catch(() => {
            throw new Error(user.id);
          });
      if (!follow) throw new Error(user.id);

      return Promise.resolve({
        userId: user.id,
        userName: user.name,
        userDisplayName: user.displayName,
        userCreationDate: user.creationDate,
        userProfilePictureUrl: user.profilePictureUrl,
        userFollowsBroadcaster: followsBroadcaster,
        userFollowBroadcasterDate: follow.followDate,
        userSubscriptionTier: subscription?.tier,
        userSubscriptionIsGift: subscription?.isGift,
        userSubscriptionGifterId: subscription?.gifterId,
        userSubscriptionGifterName: subscription?.gifterName,
        err: null,
      });
    } catch (userId) {
      if (throwIfUserNotFound && Object.prototype.toString.call(userId) === '[object Error]') {
        return Promise.resolve({
          userId: null,
          userName: null,
          userDisplayName: null,
          userCreationDate: null,
          userProfilePictureUrl: null,
          userFollowsBroadcaster: null,
          userFollowBroadcasterDate: null,
          userSubscriptionTier: null,
          userSubscriptionIsGift: null,
          userSubscriptionGifterId: null,
          userSubscriptionGifterName: null,
          err: new Error('USER NOT FOUND'),
        });
      }

      // Get offender metadata from db if failed to get from twitch
      try {
        const user = await this.dbClient.getDocument('twitchUsers', userId);

        return Promise.resolve({
          userId: user._id.toHexString(),
          userName: user.userName,
          userDisplayName: user.userDisplayName,
          userCreationDate: user.userCreationDate,
          userProfilePictureUrl: user.userProfilePictureUrl,
          userFollowsBroadcaster: user.userFollowsBroadcaster,
          userFollowBroadcasterDate: user.userFollowBroadcasterDate,
          userSubscriptionTier: user.userSubscriptionTier,
          userSubscriptionIsGift: user.userSubscriptionIsGift,
          userSubscriptionGifterId: user.userSubscriptionGifterId,
          userSubscriptionGifterName: user.userSubscriptionGifterName,
          err: null,
        });
      } catch (e) {
        // Return zero values if failed to get from db
        return Promise.resolve({
          userId: '',
          userName: '',
          userDisplayName: '',
          userCreationDate: new Date(),
          userProfilePictureUrl: '',
          userFollowsBroadcaster: false,
          userFollowBroadcasterDate: new Date(),
          userSubscriptionTier: '',
          userSubscriptionIsGift: false,
          userSubscriptionGifterId: '',
          userSubscriptionGifterName: '',
          err: null,
        });
      }
    }
  };
}

module.exports = { Service };

/**
 * @param {number} x - UNIX timestamp in either seconds or milliseconds.
 * @return {string}
 */
const convertTimestampNumberToDiscordTimestampFormat = (x) =>{
  const y = `${x}`;

  // If timestamp has more than 10 digits,
  // then it's in milliseconds. Need to convert to seconds.
  if (y.length > 10) {
    x = parseInt(y);
    x = Math.floor(x / 1000);

    return `<t:${x}:d><t:${x}:t>`;
  }

  return `<t:${x}:d><t:${x}:t>`;
};
