const { Client, Intents, MessageAttachment } = require("discord.js");
const { token } = require("../config/config.json");
const { db } = require("./firebase.js");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "log") {
    await interaction.deferReply();

    const offender = interaction.options.getUser("offender", true);
    const punishment = interaction.options.getString("punishment", true);
    const channel = interaction.options.getChannel("channel", true);
    const ruleNumber = interaction.options.getInteger("rule", true);
    const notes = interaction.options.getString("notes", false);
    const screenshot = interaction.options.getAttachment("screenshot", false);

    // Write the offense to db
    await db
      .collection("offenses")
      .doc()
      .set({
        timestamp: Math.floor(interaction.createdTimestamp / 1000),
        offenderId: offender.id,
        channelId: channel.id,
        punishment: punishment,
        loggedBy: interaction.user.id,
        rule: ruleNumber,
        notes: notes,
        screenshotUrl: screenshot ? screenshot.url : null,
      });

    // Read the offenses by offenderId to calculate the number of strikes
    const snapshot = await db
      .collection("offenses")
      .where("offenderId", "==", offender.id)
      .where("rule", "==", ruleNumber)
      .get();

    let strikeNumber = "";
    if (snapshot.size == 1) strikeNumber = "ONE STRIKE";
    if (snapshot.size == 2) strikeNumber = "TWO STRIKES";
    if (snapshot.size == 3) strikeNumber = "THREE STRIKES";
    if (snapshot.size >= 4) strikeNumber = "FOUR OR MORE STRIKES";

    // Read the rules from db to see if the offense is immediately bannable
    const rule = (
      await db.collection("rules").where("number", "==", ruleNumber).get()
    ).docs
      .shift()
      .data();

    await interaction.editReply({
      files: [new MessageAttachment(`./assets/${ruleNumber}.png`)],
      embeds: [
        {
          title: strikeNumber,
          description: notes,
          color: 0xff0000,
          thumbnail: {
            url: `attachment://${ruleNumber}.png`,
          },
          image: {
            url: screenshot ? screenshot.url : null,
          },
          author: {
            name: offender.tag,
            iconURL: offender.avatarURL(),
          },
          footer: {
            text: rule.description,
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
            {
              name: rule.isImmediatelyBannable ? "IMMEDIATELY BANNABLE" : "⠀",
              value: "⠀",
              inline: true,
            },
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
            { name: "⠀", value: "⠀", inline: true },
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

    if (interaction.options.getSubcommand(true) === "summary") {
      const offensesSnapshot = await db
        .collection("offenses")
        .where("offenderId", "==", user.id)
        .get();

      const rulesSnapshot = await db
        .collection("rules")
        .orderBy("number", "asc")
        .get();

      const fields = [
        { name: "User", value: `<@${user.id}>`, inline: true },
        {
          name: "User's account created at",
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}>`,
          inline: true,
        },
      ];
      for (const doc of rulesSnapshot.docs) {
        const numOfStrikes = offensesSnapshot.docs.filter(
          (x) => x.data().rule == doc.data().number
        ).length;

        fields.push({
          name: `${doc.data().number}. ${doc.data().shortName}`,
          value: `${numOfStrikes}`,
        });
      }

      await interaction.editReply({
        embeds: [
          {
            title: `SUMMARY OF OFFENSES`,
            description: `Total offenses: ${offensesSnapshot.size}`,
            color: 0x00ffff,
            author: {
              name: user.tag,
              iconURL: user.avatarURL(),
            },
            fields: fields,
          },
        ],
      });
    }

    if (interaction.options.getSubcommand(true) === "history") {
      const offensesSnapshot = await db
        .collection("offenses")
        .where("offenderId", "==", user.id)
        .get();

      const rulesSnapshot = await db
        .collection("rules")
        .orderBy("number", "asc")
        .get();

      const fields = offensesSnapshot.docs
        .sort((a, b) => b.data().timestamp - a.data().timestamp)
        .slice(0, 25)
        .map((x) => {
          const rule = rulesSnapshot.docs.filter(
            (y) => y.data().number === x.data().rule
          )[0];
          return {
            name: `${rule.data().number}. ${rule.data().shortName}`,
            value: `Timestamp: <t:${x.data().timestamp}> | Logged by: <@${
              x.data().loggedBy
            }>`,
          };
        });

      await interaction.editReply({
        embeds: [
          {
            author: {
              name: user.tag,
              iconURL: user.avatarURL(),
            },
            title: "HISTORY OF OFFENSES",
            description: "25 most recent offenses",
            color: 0x00ffff,
            fields: fields,
          },
        ],
      });
    }
  }

  if (interaction.commandName === "rules") {
    await interaction.deferReply();

    const snapshot = await db
      .collection("rules")
      .orderBy("number", "asc")
      .get();
    const fields = snapshot.docs.map((x) => ({
      name: `${x.data().number}. ${x.data().shortName}`,
      value: x.data().description,
    }));

    await interaction.editReply({
      embeds: [
        {
          title: "RULES",
          fields: fields,
        },
      ],
    });
  }
});

client.once("ready", () => {
  console.log("Ready!");
});

client.login(token);
