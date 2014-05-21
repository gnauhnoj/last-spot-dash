  
var db = require('../config');
var Promise = require('bluebird');
var mongoose = require('mongoose');

var handler = require('../../../server/lib/request-handler');
var lfm = handler.lfm;


var artistSchema = new mongoose.Schema({
  artist: String,
  count: Number,
  art: String,
  load: Boolean
}); 

artistSchema.post('save',function(next) {
  lfm.artist.getInfo({
    'artist': this.artist,
  }, function(err, artist){
    if (err) throw(err);

    var art; 
    var replace;
    var search = {artist: artist.name};

    if (artist.image) {
      art = artist.image[artist.image.length-1]['#text'];
      replace = {art: art, load: true};
      // console.log(replace);

      model.update(search, replace, function(err, stuff){
        if (err) throw(err);
      });
    }
  });
});

var model = module.exports = mongoose.model('Artist', artistSchema);
