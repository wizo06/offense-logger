const { Client, CommandInteraction } = require('discord.js');

const { logger } = require('../../pkg/logger');
const { name } = require('../../package.json');
const { Service } = require('../service');

/** WebSocket handles events from Discord */
class WebSocket {
  /**
   *
   * @param {Client} discordClient
   * @param {Service} serviceClient
   */
  constructor(discordClient, serviceClient) {
    this.discordClient = discordClient;
    this.serviceClient = serviceClient;
  }

  /**
   * listenInteractionCreate initiates an event listener for the "interactionCreate" event
   * and routes the event to the appropriate handler.
   */
  listenInteractionCreate() {
    this.discordClient.on('interactionCreate', (interaction) => {
      if (interaction.isAutocomplete()) {}

      if (interaction.isButton()) {}

      if (interaction.isCommand()) {
        this.#handleCommandInteraction(interaction);
      }

      if (interaction.isContextMenu()) {}

      if (interaction.isMessageComponent()) {}

      if (interaction.isMessageContextMenu()) {}

      if (interaction.isModalSubmit()) {}

      if (interaction.isRepliable()) {}

      if (interaction.isSelectMenu()) {}

      if (interaction.isUserContextMenu()) {}
    });
  }

  /**
   * login connects to Discord's websocket.
   * @param {string} token
   */
  async login(token) {
    this.discordClient.on('ready', () => {
      logger.success('Logged into Discord');
      logger.success(`${name} ready!`);
    });
    await this.discordClient.login(token);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  #handleCommandInteraction(interaction) {
    if (interaction.commandName === 'discord') {
      this.serviceClient.handleDiscordCommandInteraction(interaction);
      return;
    }

    if (interaction.commandName === 'twitch') {
      this.serviceClient.handleTwitchCommandInteraction(interaction);
      return;
    }
  }
}

module.exports = { WebSocket };
