const { Client, CommandInteraction } = require('discord.js');
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
