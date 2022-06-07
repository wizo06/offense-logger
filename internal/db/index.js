const _ = require(process.cwd() + "/pkg/firebase");
const { getFirestore } = require("firebase-admin/firestore");

module.exports = {
  db: getFirestore(),
};
