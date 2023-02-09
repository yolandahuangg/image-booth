// external imports
const mongoose = require("mongoose");
const { mongodb } = require("../config.json");

async function dbConnect() {
  // use mongoose to connect this app to our database on mongoDB using the DB_URL (connection string)
  mongoose.set('strictQuery', false);
  mongoose
    .connect(
        mongodb
    )
    .then(() => {
      console.log("[DB] Connected to MongoDB.");
    })
    .catch((error) => {
      console.log("[DB] Failed to connect to MongoDB.");
      console.error(error);
    });
}

module.exports = dbConnect;
