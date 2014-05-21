  
var db = require('../config');
var Promise = require('bluebird');
var mongoose = require('mongoose');

var reportSchema = new mongoose.Schema({
  username: String,
  key: String,
  minutes: Number,
  MaxArtistPlays: Number,
  MaxArtist: String,
  MaxArtistArt: String,
  MaxSongPlays: Number,
  MaxSongArtist: String,
  MaxSong: String,
  MaxSongArt: String,
  total: Number
});

module.exports = mongoose.model('Report', reportSchema);
