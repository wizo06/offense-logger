const { ApiClient } = require("@twurple/api");
const { ClientCredentialsAuthProvider } = require("@twurple/auth");
const { clientId, clientSecret } = require(process.cwd() + "/config/config.json");

const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

module.exports = {
  apiClient,
};
