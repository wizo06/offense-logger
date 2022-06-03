const { Client, Intents, MessageAttachment } = require("discord.js");
const { token } = require("../config/config.json");
const { db } = require("./firebase.js");
const { table, getBorderCharacters } = require("table");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "log") {
    await interaction.deferReply();

    const offender = interaction.options.getUser("offender", true);
    const punishment = interaction.options.getString("punishment", true);
    const channel = interaction.options.getChannel("channel", true);
    const rule = interaction.options.getInteger("rule", true);
    const notes = interaction.options.getString("notes", false);
    const screenshot = interaction.options.getAttachment("screenshot", false);

    await db
      .collection("offenses")
      .doc()
      .set({
        timestamp: Math.floor(interaction.createdTimestamp / 1000),
        offenderId: offender.id,
        channelId: channel.id,
        punishment: punishment,
        loggedBy: interaction.user.id,
        rule: rule,
        notes: notes,
        screenshotUrl: screenshot ? screenshot.url : null,
      });

    const snapshot = await db
      .collection("offenses")
      .where("offenderId", "==", offender.id)
      .where("rule", "==", rule)
      .get();

    let strikeNumber = "";
    if (snapshot.size == 1) strikeNumber = "ONE STRIKE";
    if (snapshot.size == 2) strikeNumber = "TWO STRIKES";
    if (snapshot.size == 3) strikeNumber = "THREE STRIKES";
    if (snapshot.size >= 4) strikeNumber = "FOUR OR MORE STRIKES";

    await interaction.editReply({
      files: [new MessageAttachment(`./assets/${rule}.png`)],
      embeds: [
        {
          title: strikeNumber,
          description: notes,
          color: 0xff0000,
          thumbnail: {
            url: `attachment://${rule}.png`,
          },
          image: {
            url: screenshot ? screenshot.url : null,
          },
          author: {
            name: offender.tag,
            iconURL: offender.avatarURL(),
          },
          fields: [
            {
              name: "Offender",
              value: `<@${offender.id}>`,
              inline: true,
            },
            {
              name: "Offender's account created at",
              value: `<t:${Math.floor(offender.createdTimestamp / 1000)}>`,
              inline: true,
            },
            { name: "-", value: "-" },
            {
              name: "Channel",
              value: `<#${channel.id}>`,
              inline: true,
            },
            {
              name: "Punishment",
              value: punishment,
              inline: true,
            },
            { name: "-", value: "-" },
            {
              name: "Logged by",
              value: `<@${interaction.user.id}>`,
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
    });
  }

  if (interaction.commandName === "user") {
    await interaction.deferReply();

    const user = interaction.options.getUser("user");

    const snapshot = await db
      .collection("offenses")
      .where("offenderId", "==", user.id)
      .get();

    const data = [];
    for (let index = 1; index <= 25; index++) {
      // todo: replace 25 with rules that are fetched from db
      // todo: use uuid for rules' doc.id and store the number in the doc instead
      // todo: add a isImmediatelyBannable bool
      const strikes = snapshot.docs.filter(
        (x) => x.data().rule == index
      ).length;
      data.push([strikes, index]);
    }
    const config = {
      singleLine: true,
      border: getBorderCharacters("norc"),
    };
    const formattedTable = table(data, config);

    await interaction.editReply({
      embeds: [
        {
          title: `Total offenses: ${snapshot.size}`,
          description: [
            "Strikes | Rule",
            `\`\`\``,
            formattedTable,
            `\`\`\``,
          ].join("\n"),
          color: 0x0000ff,
          thumbnail: {
            url: user.avatarURL(),
          },
          fields: [
            { name: "User", value: `<@${user.id}>` },
            {
              name: "User's account created at",
              value: `<t:${Math.floor(user.createdTimestamp / 1000)}>`,
            },
          ],
        },
      ],
    });
  }
});

client.once("ready", () => {
  console.log("Ready!");
});

client.login(token);
