const { db } = require(process.cwd() + "/internal/db");
const rules = require(process.cwd() + "/config/rules.json");

(async () => {
  for (const rule of rules) {
    await db.collection("rules").doc().set({
      shortName: rule.shortName,
      description: rule.description,
      number: rule.number,
      isImmediatelyBannable: rule.isImmediatelyBannable,
      platform: rule.platform,
    });
  }
})();
