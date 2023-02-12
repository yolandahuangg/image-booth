const mongoose = require("mongoose");
const ImageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Missing name."],
        unique: false
    },
    tags: {
        type: Array,
        required: false,
        unique: false
    },
    user: {
        type: String,
        required: [true, "Missing user."],
        unique: false
    },
    date: {
        type: Number,
        required: [true, "Missing date."],
        unique: false
    }
});

module.exports = mongoose.model.Images || mongoose.model("Images", ImageSchema);