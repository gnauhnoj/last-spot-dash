  
var db = require('../config');
var Promise = require('bluebird');
var mongoose = require('mongoose');

// var songSchema = new mongoose.Schema({
//   artist: String,
//   title: String,
//   duration: String
// });

// songSchema.pre('save',function(next) {
//   console.log(this);

//   // var cipher = Promise.promisify(bcrypt.hash);
//   // return cipher(this.password, null,null).bind(this)
//   //   .then(function(hash) {
//   //     this.password = hash;
//   //     next();
//   //   });
// });

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
