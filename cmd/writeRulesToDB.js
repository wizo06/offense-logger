const { db } = require(process.cwd() + "/internal/db");

(async () => {
  const rules = [
    // Discord
    {
      shortName: "NO DOXXING",
      description: "No doxxing of any kind related to my irl name, account, etc. I am Yui here.",
      number: 1,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO HATE SPEECH",
      description:
        "No racism, sexism, ableism, transphobia, homophobia, racial slurs, etc. An immediate ban if violated.",
      number: 2,
      isImmediatelyBannable: true,
      platform: "DISCORD",
    },
    {
      shortName: "NO POLITICS OR RELIGION",
      description: "Do not talk about politics or religion.",
      number: 3,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO IRRELEVANT POST IN WRONG CHANNEL",
      description: "Please post to the appropriate channel to keep channel discussion relevant.",
      number: 4,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO RMT OR SHARING ACCOUNTS",
      description: "Do not buy/sell/trade/share accounts.",
      number: 5,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO SPAMMING",
      description: "Do not spam chat. This includes bot commands, ping spamming, and images.",
      number: 6,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO NSFW CONTENT OUTSIDE OF 18+ CHANNEL",
      description: "Any NSFW content must be posted as a spoiler and only posted in the 🔞︱chat channel.",
      number: 7,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO GORE OR DISTURBING CONTENT",
      description: "No gory/disturbing content allowed in this channel. Immediate ban if this is violated.",
      number: 8,
      isImmediatelyBannable: true,
      platform: "DISCORD",
    },
    {
      shortName: "NO PICTURES OF SPIDERS",
      description:
        "Do not post any pictures of spiders in this server. I have severe arachnophobia. An immediate ban if violated.",
      number: 9,
      isImmediatelyBannable: true,
      platform: "DISCORD",
    },
    {
      shortName: "NO RULE BREAKING EVEN IN #MEMES CHANNEL",
      description: "Please do not post any racist/gory/or inappropriate content in 🤣︱memes .",
      number: 10,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO MENTION OF OTHER VTUBERS UNLESS ONGOING COLLAB",
      description: "Do not speak of other Vtubers (exception: ongoing collabs).",
      number: 11,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO SELF ADVERTISEMENT",
      description: "No self advertisement allowed unless given the permission to.",
      number: 12,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO DISRUPTIVE BEHAVIOR OR INSTIGATION",
      description: "No attention seeking, harassment, bullying, stirring up drama, or any other disruptive behavior.",
      number: 13,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "ENGLISH AND KOREAN ONLY IN THEIR RESPECTIVE CHANNELS",
      description: "Please keep English only in 🇺🇸︱general-english and Korean in 🇰🇷︱general-korean.",
      number: 14,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO BADMOUTHING OR SLANDERING OTHER PEOPLE",
      description: "Do not speak negatively about other streamers, content creators, and anybody in general.",
      number: 15,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO SHARING OF PERSONAL INFO",
      description: "Do not share personal information. Any attempts will be an immediate ban.",
      number: 16,
      isImmediatelyBannable: true,
      platform: "DISCORD",
    },
    {
      shortName: "NO PINGING YUI UNLESS EMERGENCY",
      description: "Please ping me only if it's an emergency. Otherwise, only mods may ping me if needed.",
      number: 17,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },
    {
      shortName: "NO SHARING OF DISCORD INVITE LINK TO OUTSIDERS",
      description:
        "This is not a public server and is for my community. Please do not send invite links to random people who do not watch my content.",
      number: 18,
      isImmediatelyBannable: false,
      platform: "DISCORD",
    },

    // Twitch
    {
      shortName: "ONLY ENGLISH OR KOREAN",
      description: "ONLY ENGLISH OR KOREAN",
      number: 1,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO DOXXING",
      description: "No doxxing allowed even if you know my irl name. (Please call me Yui here)",
      number: 2,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO MENTION OF OTHER STREAMERS",
      description: "Don't mention other streamers unless I do first.",
      number: 3,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO MENTION OF VIEWER COUNT",
      description: "Please don't mention viewer count.",
      number: 4,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO SELF PROMOTION",
      description: "No self promotion.",
      number: 5,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO SPOILERS",
      description: "NO SPOILERS when we're talking about animes/movies/shows/dramas and during watch parties.",
      number: 6,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO SPAMMING",
      description: "I'm bad at reading chat so you can spam until I read what you say but don't spam excessively.",
      number: 7,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO POLITICS, RELIGION, HATE SPEECH",
      description: "No politics, religion, homophobia, transphobia, racial slurs, etc.",
      number: 8,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
    {
      shortName: "NO RUDE OR MEAN BEHAVIOR IN CHAT",
      description: "Don't be rude or mean to me and others in chat.",
      number: 9,
      isImmediatelyBannable: false,
      platform: "TWITCH",
    },
  ];

  for (const rule of rules) {
    db.collection("rules").doc().set({
      shortName: rule.shortName,
      description: rule.description,
      number: rule.number,
      isImmediatelyBannable: rule.isImmediatelyBannable,
      platform: rule.platform,
    });
  }
})();
