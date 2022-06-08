const { discord } = require(process.cwd() + "/config/config.json");
const { client } = require(process.cwd() + "/internal/discord");

const main = async () => {
  try {
    await client.login(discord.token);
  } catch (e) {
    console.error(e);
  }
};

main();
