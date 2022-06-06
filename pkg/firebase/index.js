const { initializeApp, cert } = require("firebase-admin/app");
const serviceAccount = require(process.cwd() + "/config/serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});
