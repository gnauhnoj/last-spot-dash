var express = require('express');
var partials = require('express-partials');

var handler = require('./server/lib/request-handler');
var lfm = handler.lfm;

var app = express();
var db = require('./client/app/config');
var Report = require('./client/app/models/report.js');
var Song = require('./client/app/models/song.js');
var Artist = require('./client/app/models/artist.js');

var username;
var key;

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/client'));
  app.use(app.router);
});

app.get('/', function(req, res) {
  res.sendfile(__dirname+'/client/public/client/templates/index.html');
});

app.get('/auth', function(req, res) {
  var token = req.query.token;
  console.log(token);

  lfm.authenticate(token, function (err, session) {
    if (err) {
      console.log(err);
    } else {
      username = session.username; 
      key = session.key;

      Report.remove({}, function(err) { 
        console.log('Report collection removed');
      });

      Song.remove({}, function(err) { 
        console.log('Song collection removed');
      });

      Artist.remove({}, function(err) { 
        console.log('Artist collection removed');
      });

      res.redirect('/getstats');
      console.log(username);
      console.log(key);
    }
  });
});

app.get('/getstats', function(req, res) {
  // move to db - TODO: Store user sessions
  var mySessionCreds = {
      'username' : username,
      'key' : key
  };

    // hard coded date - TODO: Add functionality to specify length
    // var dateTime = (new Date().getTime()/ 1000) - (86400*30); // 1 month
    // var dateTime = (new Date().getTime()/ 1000) - (86400*7); // 1 day    
    var dateTime = (new Date().getTime()/ 1000) - (86400); // 1 day
    // var dateTime = (new Date().getTime()/ 1000) - (86400/24); // 1 hour

    console.log(mySessionCreds);
    lfm.setSessionCredentials(mySessionCreds.username, mySessionCreds.key);   

    lfm.user.getRecentTracks({
      user: mySessionCreds.username,
      from: dateTime,
      limit: 200,
      api_key: lfm.api_key
    }, function (err, recentTracks) {
      console.log(recentTracks);
      if (err) {
        console.log('error fetching songs');
        console.log(err);
      } else {

        var report = new Report({
          username: mySessionCreds.username,
          key: mySessionCreds.key,
          total: recentTracks['@attr'].total
        });

        report.save(function(err, report) {
          console.log('New Report Created', report);
          if (err) throw(err);

          var trackArr = recentTracks.track;

          (function(){
            var i = 0;
            function forloop(){
              if(i<trackArr.length){
                var artistName = trackArr[i].artist['#text'];
                var songName = trackArr[i].name;
            
                // look for existing artists
                Artist.findOne({artist: artistName}, function(err, artist) {
                  if (artist) {
                    Artist.update({artist: artistName}, {count: artist.count+1}, function(err,stuff) {
                      if (err) throw(err);
                      console.log('Existing Artist Saved', stuff);

                      // look for existing songs
                      Song.findOne({artist: artistName, title: songName}, function(err, song) {
                        if (song) {
                          Song.update({artist: artistName, title: songName}, {count: song.count+1}, function(err,stuff) {
                            console.log('Existing Song Saved', stuff);
                            i++;
                            forloop();
                          });
                        } else {
                          var song = new Song({
                            artist: artistName,
                            title: songName,
                            count: 1
                          });
                          song.save(function(err, stuff){
                            console.log('New Song Saved', stuff);

                            i++;
                            forloop();
                          });
                        }
                      });

                    });

                  } else {
                    var artist = new Artist({
                      artist: artistName,
                      count: 1,
                    });
                    artist.save(function(err, stuff) {
                      if (err) throw(err);
                      console.log('New Artist Saved', stuff);
                       
                      // look for existing songs
                      Song.findOne({artist: artistName, title: songName}, function(err, song) {
                        if (song) {
                          Song.update({artist: artistName, title: songName}, {count: song.count+1}, function(err,stuff) {
                            console.log('Existing Song Saved', stuff);
                            i++;
                            forloop();
                          });
                        } else {
                          var song = new Song({
                            artist: artistName,
                            title: songName,
                            count: 1
                          });
                          song.save(function(err, stuff){
                            console.log('New Song Saved', stuff);

                            i++;
                            forloop();
                          });
                        }
                      });

                    });
                  };
                });
              }else{
                // console.log('done loading db');
                Song.find({}, function(err, result) {
                  if (err) throw(err);
                  var cont = true; 
                  for (var i = 0; i<result.length; i++) {
                    cont = cont && result[i].load;
                  }
                  // console.log(cont);
                  if (!cont) {
                    forloop();
                  } else {
                    Artist.find({}, function(err, result2) {
                      console.log(result2);
                      if (err) throw(err);
                      var cont2 = true;
                      for(var j = 0; j<result2.length; j++) {
                        cont2 = cont2 && result2[j].load;
                      }
                      if (!cont) {
                        forloop();
                      } else {
                        res.sendfile(__dirname+'/client/public/client/templates/index.html');                        
                      }
                    });
                  }
                });
              }
            }
            forloop();
          })();
        });
      }
    });
});

app.get('/buildGraph', function(req, res){
  console.log('get request sent');
  // do math to update Report

  var replace = {};

  // could use find and do minutes calc but asnyc code...
  Song.find({}).sort('-count').exec(function(err, sortedSongs) {
    console.log(sortedSongs);
    var topSong = sortedSongs[0];
    replace.MaxSong = topSong.title;
    replace.MaxSongPlays = topSong.count;
    replace.MaxSongArtist = topSong.artist;
    replace.minutes = 0;
    replace.total = 0;

    // ISNT GOING TO WORK UNTIL ASYNC
    if(topSong.art) {
      replace.MaxSongArt = topSong.art;      
    }

    for (var count=0; count<sortedSongs.length; count++) {
      replace.minutes += (sortedSongs[count].minutes * sortedSongs[count].count);
      replace.total += sortedSongs[count].count;
    }

    // console.log(countTotal);

    Artist.find({}).sort('-count').exec(function(err, sortedArtists) {
      // console.log(sortedArtists);
      var topArtist = sortedArtists[0];
      replace.MaxArtist = topArtist.artist;
      replace.MaxArtistPlays = topArtist.count;
      if(topArtist.art) {
        replace.MaxArtistArt = topArtist.art;      
      }

      Report.find({}, function(err, report) {
        // console.log(report[0], replace);
        // Report.find({username: report[0].username}, function(err,result) {
        //   console.log(result);
        // });
        Report.update({username: report[0].username}, replace, function (err, result){
          Report.find({username: report[0].username}, function(err, result){
            res.send(200, result[0]);
          });
        });
      });

    });
  });
});


module.exports = app;