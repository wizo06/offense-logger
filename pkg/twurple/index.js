const { ApiClient } = require("@twurple/api");
const { ClientCredentialsAuthProvider } = require("@twurple/auth");
const { twitch } = require(process.cwd() + "/config/config.json");

const authProvider = new ClientCredentialsAuthProvider(twitch.clientId, twitch.clientSecret);
const apiClient = new ApiClient({ authProvider });

module.exports = {
  apiClient,
};
