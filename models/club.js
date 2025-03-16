const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  clubName: { type: String, required: true },
  motto: { type: String }
});

module.exports = mongoose.model('Club', clubSchema);
