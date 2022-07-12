const { ApiClient } = require('@twurple/api');
const { getTokenInfo } = require('@twurple/auth');
const { CommandInteraction } = require('discord.js');

const config = require('../../config/config.json');
const { randomUUID } = require('crypto');
const { DB } = require('../db/db');
const discordRules = require('../../config/discordRules.json');
const { logger } = require('../../pkg/logger/logger');
const tokens = require('../../config/tokens.json');
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
          name: `Offense ID: ${offense._id}`,
          value: `Offender: <@${offense.offenderId}> | ${rule.number}. ${rule.shortName}
          Reported by: <@${offense.reporterId}> | Time of report: ${convertTimestampNumberToDiscordTimestampFormat(offense.timestamp)}`,
        };
      });

      await interaction.editReply({
        embeds: [
          {
            title: 'DISCORD OFFENSES',
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
            embeds: buildDiscordOffenseEmbed({
              description: offenseDoc.notes,
              userTag: userTag,
              userAvatarURL: userAvatarURL,
              imageURL: offenseDoc.screenshotUrl,
              footerText: `Offense ID: ${offenseDoc._id}`,
              offenderId: offenseDoc.offenderId,
              userCreatedTimestamp: userCreatedTimestamp,
              userJoinedTimestamp: userJoinedTimestamp,
              channelId: offenseDoc.channelId,
              punishment: offenseDoc.punishment,
              reporterId: offenseDoc.reporterId,
              timestamp: offenseDoc.timestamp,
              rule: rule,
            }),
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
        _id: randomUUID(),
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

      await this.dbClient.upsertDocument('discordUsers', userId, {
        userTag,
        userAvatarURL,
        userCreatedTimestamp,
        userJoinedTimestamp,
      });

      const rule = discordRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: buildDiscordOffenseEmbed({
              description: offenseDoc.notes,
              userTag: userTag,
              userAvatarURL: userAvatarURL,
              imageURL: offenseDoc.screenshotUrl,
              footerText: `Offense ID: ${offenseDoc._id}`,
              offenderId: offenseDoc.offenderId,
              userCreatedTimestamp: userCreatedTimestamp,
              userJoinedTimestamp: userJoinedTimestamp,
              channelId: offenseDoc.channelId,
              punishment: offenseDoc.punishment,
              reporterId: offenseDoc.reporterId,
              timestamp: offenseDoc.timestamp,
              rule: rule,
            }),
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

      const updateMask = {};
      if (offender) updateMask.offenderId = offender.id;
      if (punishment) updateMask.punishment = punishment;
      if (channel) updateMask.channelId = channel.id;
      if (ruleNumber) updateMask.rule = ruleNumber;
      if (notes) updateMask.notes = notes;
      if (screenshot) updateMask.screenshotUrl = screenshot.url;
      if (reporter) updateMask.reporterId = reporter.id;

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
            embeds: buildDiscordOffenseEmbed({
              description: offenseDoc.notes,
              userTag: userTag,
              userAvatarURL: userAvatarURL,
              imageURL: offenseDoc.screenshotUrl,
              footerText: `Offense ID: ${offenseDoc._id}`,
              offenderId: offenseDoc.offenderId,
              userCreatedTimestamp: userCreatedTimestamp,
              userJoinedTimestamp: userJoinedTimestamp,
              channelId: offenseDoc.channelId,
              punishment: offenseDoc.punishment,
              reporterId: offenseDoc.reporterId,
              timestamp: offenseDoc.timestamp,
              rule: rule,
            }),
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
                title: 'DISCORD RULES',
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

      const usersId = await this.dbClient.distinct('discordOffenses', 'offenderId');

      const users = [];
      for (const userId of usersId) {
        const { userCreatedTimestamp } = await this.#getDiscordUserMetadata(interaction, userId);
        users.push({ userId, userCreatedTimestamp });
      }

      await interaction
          .editReply({
            embeds: [
              {
                title: 'DISCORD USERS',
                color: 0x5865f2,
                description: users
                    .map((user) => {
                      return `<@${user.userId}> Account Created: ${convertTimestampNumberToDiscordTimestampFormat(
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

      await this.dbClient.upsertDocument('discordUsers', userId, {
        userTag,
        userAvatarURL,
        userCreatedTimestamp,
        userJoinedTimestamp,
      });

      await interaction
          .editReply({
            embeds: buildDiscordUserEmbed({
              userTag: userTag,
              userAvatarURL: userAvatarURL,
              userId: userId,
              userCreatedTimestamp: userCreatedTimestamp,
              userJoinedTimestamp: userJoinedTimestamp,
            }),
          });
    } catch (e) {
      logger.error(e);
      await interaction.editReply({ content: e.message });
    }
  };

  /**
   * @typedef getDiscordUserMetadataResponse
   * @type {object}
   * @property {string} userId
   * @property {string} userTag
   * @property {string|null} userAvatarURL
   * @property {number} userCreatedTimestamp
   * @property {number|null} userJoinedTimestamp
   */

  /**
   * @param {CommandInteraction} interaction
   * @param {string} userId
   * @return {Promise<getDiscordUserMetadataResponse>}
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
          userId: user._id.toString(),
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

      const fields = [];
      for (const offense of offenses) {
        const rule = twitchRules.filter((x) => x.number === offense.rule)[0];

        const { userName } = await this.#getTwitchUserMetadata(offense.offenderId, '', false);
        fields.push({
          name: `Offense ID: ${offense._id}`,
          value: `Offender: (${offense.offenderId})${userName} | ${rule.number}. ${rule.shortName}
          Reported by: <@${offense.reporterId}> | Time of report: ${convertTimestampNumberToDiscordTimestampFormat(offense.timestamp)}`,
        });
      }

      await interaction.editReply({
        embeds: [
          {
            title: 'TWITCH OFFENSES',
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
        userId,
        userName,
        userCreationDate,
        userProfilePictureUrl,
        userFollowsBroadcaster,
        userFollowBroadcasterDate,
        userSubscriptionTier,
        userSubscriptionGifterName,
      } = await this.#getTwitchUserMetadata(offenseDoc.offenderId, '', false);

      const rule = twitchRules.filter((x) => x.number === offenseDoc.rule)[0];

      await interaction
          .editReply({
            embeds: buildTwitchOffenseEmbed({
              description: offenseDoc.notes,
              userId: userId,
              userName: userName,
              authorIconURL: userProfilePictureUrl,
              imageURL: offenseDoc.screenshotUrl,
              footerText: `Offense ID: ${offenseDoc._id}`,
              userCreationDate: userCreationDate,
              userFollowsBroadcaster: userFollowsBroadcaster,
              userFollowBroadcasterDate: userFollowBroadcasterDate,
              userSubscriptionTier: userSubscriptionTier,
              userSubscriptionGifterName: userSubscriptionGifterName,
              punishment: offenseDoc.punishment,
              reporterId: offenseDoc.reporterId,
              timestamp: offenseDoc.timestamp,
              rule: rule,
            }),
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
        _id: randomUUID(),
        timestamp: interaction.createdTimestamp,
        offenderId: userId,
        punishment: punishment,
        reporterId: reporter ? reporter.id : interaction.user.id,
        rule: ruleNumber,
        notes: notes,
        screenshotUrl: screenshot ? screenshot.url : null,
      });

      await this.dbClient.upsertDocument('twitchUsers', userId, {
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
            embeds: buildTwitchOffenseEmbed({
              description: offenseDoc.notes,
              userId: userId,
              userName: userName,
              authorIconURL: userProfilePictureUrl,
              imageURL: offenseDoc.screenshotUrl,
              footerText: `Offense ID: ${offenseDoc._id}`,
              userCreationDate: userCreationDate,
              userFollowsBroadcaster: userFollowsBroadcaster,
              userFollowBroadcasterDate: userFollowBroadcasterDate,
              userSubscriptionTier: userSubscriptionTier,
              userSubscriptionGifterName: userSubscriptionGifterName,
              punishment: offenseDoc.punishment,
              reporterId: offenseDoc.reporterId,
              timestamp: offenseDoc.timestamp,
              rule: rule,
            }),
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

      const updateMask = {};
      if (offender) updateMask.offenderId = userId;
      if (punishment) updateMask.punishment = punishment;
      if (ruleNumber) updateMask.rule = ruleNumber;
      if (notes) updateMask.notes = notes;
      if (screenshot) updateMask.screenshotUrl = screenshot.url;
      if (reporter) updateMask.reporterId = reporter.id;

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
            embeds: buildTwitchOffenseEmbed({
              description: offenseDoc.notes,
              userId: userId,
              userName: userName,
              authorIconURL: userProfilePictureUrl,
              imageURL: offenseDoc.screenshotUrl,
              footerText: `Offense ID: ${offenseDoc._id}`,
              userCreationDate: userCreationDate,
              userFollowsBroadcaster: userFollowsBroadcaster,
              userFollowBroadcasterDate: userFollowBroadcasterDate,
              userSubscriptionTier: userSubscriptionTier,
              userSubscriptionGifterName: userSubscriptionGifterName,
              punishment: offenseDoc.punishment,
              reporterId: offenseDoc.reporterId,
              timestamp: offenseDoc.timestamp,
              rule: rule,
            }),
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
                title: 'TWITCH RULES',
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

      const usersId = await this.dbClient.distinct('twitchOffenses', 'offenderId');

      const users = [];
      for (const userId of usersId) {
        const { userName, userCreationDate } = await this.#getTwitchUserMetadata(userId, '', false);
        users.push({ userName, userCreationDate });
      }

      await interaction
          .editReply({
            embeds: [
              {
                title: 'TWITCH USERS',
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
      } = await this.#getTwitchUserMetadata('', user, true);
      if (err) {
        await interaction.editReply({ content: `User ${user} not found in Twitch` });
        return;
      }

      await this.dbClient.upsertDocument('twitchUsers', userId, {
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

      await interaction
          .editReply({
            embeds: buildTwitchUserEmbed({
              userName,
              userProfilePictureUrl,
              userId,
              userCreationDate,
              userFollowsBroadcaster,
              userFollowBroadcasterDate,
              userSubscriptionTier,
              userSubscriptionGifterName,
            }),
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
      const tokenInfo = await getTokenInfo(tokens.accessToken, config.twitch.clientId);

      // Get offender metadata from twitch
      const user = (userId) ?
      await this.twitchClient.users.getUserById(userId) :
      await this.twitchClient.users.getUserByName(username);
      if (!user) throw new Error('getUserByName() error');

      const broadcaster = await this.twitchClient.users.getUserByName('umikoyui');
      if (!broadcaster) throw new Error(user.id);

      const subscription = (tokenInfo.scopes.includes('channel:read:subscriptions')) && (tokenInfo.userName == broadcaster.name) ?
      await this.twitchClient.subscriptions.getSubscriptionForUser(broadcaster.id, user.id)
          .catch(() => {
            throw new Error(user.id);
          }) :
      null;

      const followsBroadcaster = await user.follows(broadcaster.id);
      const follow = await user.getFollowTo(broadcaster.id)
          .catch(() => {
            throw new Error(user.id);
          });

      return Promise.resolve({
        userId: user.id,
        userName: user.name,
        userDisplayName: user.displayName,
        userCreationDate: user.creationDate,
        userProfilePictureUrl: user.profilePictureUrl,
        userFollowsBroadcaster: followsBroadcaster,
        userFollowBroadcasterDate: follow?.followDate,
        userSubscriptionTier: subscription?.tier,
        userSubscriptionIsGift: subscription?.isGift,
        userSubscriptionGifterId: subscription?.gifterId,
        userSubscriptionGifterName: subscription?.gifterName,
        err: null,
      });
    } catch (userId) {
      if (throwIfUserNotFound && Object.prototype.toString.call(userId) === '[object Error]') {
        logger.error(userId);
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
        const user = await this.dbClient.getDocument('twitchUsers', userId.message);

        return Promise.resolve({
          userId: user._id.toString(),
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
const convertTimestampNumberToDiscordTimestampFormat = (x) => {
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

/**
 * @return {Array}
 */
const buildDiscordOffenseEmbed = ({
  description,
  userTag,
  userAvatarURL,
  imageURL,
  footerText,
  offenderId,
  userCreatedTimestamp,
  userJoinedTimestamp,
  channelId,
  punishment,
  reporterId,
  timestamp,
  rule,
}) => {
  return [
    {
      title: 'DISCORD OFFENSE',
      description: description,
      color: 0x5865f2,
      author: {
        name: userTag,
        iconURL: userAvatarURL,
      },
      image: {
        url: imageURL,
      },
      footer: {
        text: footerText,
      },
      fields: [
        {
          name: 'Offender',
          value: `<@${offenderId}>`,
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
          value: `<#${channelId}>`,
          inline: true,
        },
        {
          name: 'Punishment',
          value: punishment,
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
        {
          name: 'Reported by',
          value: `<@${reporterId}>`,
          inline: true,
        },
        {
          name: 'Time of report',
          value: convertTimestampNumberToDiscordTimestampFormat(timestamp),
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
  ];
};

/**
 * @return {Array}
 */
const buildDiscordUserEmbed = ({
  userTag,
  userAvatarURL,
  userId,
  userCreatedTimestamp,
  userJoinedTimestamp,
}) => {
  return [
    {
      title: 'DISCORD USER',
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
  ];
};

/**
 * @return {Array}
 */
const buildTwitchOffenseEmbed = ({
  description,
  userId,
  userName,
  authorIconURL,
  imageURL,
  footerText,
  userCreationDate,
  userFollowsBroadcaster,
  userFollowBroadcasterDate,
  userSubscriptionTier,
  userSubscriptionGifterName,
  punishment,
  reporterId,
  timestamp,
  rule,
}) => {
  return [
    {
      title: 'TWITCH OFFENSE',
      description: description,
      color: 0x9146ff,
      author: {
        name: userName,
        iconURL: authorIconURL,
      },
      image: {
        url: imageURL,
      },
      footer: {
        text: footerText,
      },
      fields: [
        {
          name: 'Offender',
          value: `(${userId})${userName}`,
          inline: true,
        },
        {
          name: 'Account Created',
          value: convertTimestampNumberToDiscordTimestampFormat(userCreationDate.getTime()),
          inline: true,
        },
        {
          name: 'Follow Date',
          value: (userFollowsBroadcaster) ? convertTimestampNumberToDiscordTimestampFormat(userFollowBroadcasterDate.getTime()) : 'N/A',
          inline: true,
        },
        {
          name: 'Subscription Tier',
          value: (userSubscriptionTier) ? userSubscriptionTier : 'N/A',
          inline: true,
        },
        {
          name: 'Subscription Gifted by',
          value: (userSubscriptionGifterName) ? userSubscriptionGifterName : 'N/A',
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
        {
          name: 'Punishment',
          value: punishment,
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
          value: `<@${reporterId}>`,
          inline: true,
        },
        {
          name: 'Time of report',
          value: convertTimestampNumberToDiscordTimestampFormat(timestamp),
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
  ];
};

/**
 * @return {Array}
 */
const buildTwitchUserEmbed = ({
  userName,
  userProfilePictureUrl,
  userId,
  userCreationDate,
  userFollowsBroadcaster,
  userFollowBroadcasterDate,
  userSubscriptionTier,
  userSubscriptionGifterName,
}) => {
  return [
    {
      title: 'TWITCH USER',
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
          name: 'Follow Date',
          value: (userFollowsBroadcaster) ? convertTimestampNumberToDiscordTimestampFormat(userFollowBroadcasterDate.getTime()) : 'N/A',
          inline: true,
        },
        {
          name: 'Subscription Tier',
          value: (userSubscriptionTier) ? userSubscriptionTier : 'N/A',
          inline: true,
        },
        {
          name: 'Subscription Gifted by',
          value: (userSubscriptionGifterName) ? userSubscriptionGifterName : 'N/A',
          inline: true,
        },
      ],
    },
  ];
};
