var express = require('express');
var partials = require('express-partials');

var handler = require('./server/lib/request-handler');

var app = express();
var lfm = handler.lfm;
var db = require('./client/app/config');
var Report = require('./client/app/models/report.js');

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
        console.log('collection removed');
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
  // var dateTime = (new Date().getTime()/ 1000) - (86400); // 1 day
  var dateTime = (new Date().getTime()/ 1000) - (86400/24); // 1 hour


  console.log(mySessionCreds);
  lfm.setSessionCredentials(mySessionCreds.username, mySessionCreds.key);   

  lfm.user.getRecentTracks({
    user: mySessionCreds.username,
    from: dateTime,
    limit: 200,
    api_key: lfm.api_key
  }, function (err, recentTracks) {
    // console.log(recentTracks);
    if (err) {
      console.log('error fetching songs');
      console.log(err);
    } else {
      var output = {};
      output.total = recentTracks['@attr'].total;
      output.minutes = 0;

      var artists = {};
      var songs = {};

      output.maxArtist = 0;
      output.maxSong = 0;
      output.maxArtistName;
      output.maxArtistArt;
      output.maxSongName;
      output.maxSongArtist;
      output.maxSongArt;

      // console.log(recentTracks);
      var trackArr = recentTracks.track;
      // console.log(trackArr[0].image);

      for (var count = 0; count < trackArr.length; count++) {
        if (songs[trackArr[count].name]) {
          songs[trackArr[count].name]++;
        } else {
          songs[trackArr[count].name] = 1;
        }

        if (songs[trackArr[count].name] > output.maxSong){
          output.maxSong =  songs[trackArr[count].name];
          output.maxSongName = trackArr[count].name;
          output.maxSongArtist = trackArr[count].artist['#text'];
        }

        if (artists[trackArr[count].artist['#text']]) {
          artists[trackArr[count].artist['#text']]++;
        } else {
          artists[trackArr[count].artist['#text']] = 1;
        }

        if (artists[trackArr[count].artist['#text']] > output.maxArtist){
          output.maxArtist =  artists[trackArr[count].artist['#text']];
          output.maxArtistName = trackArr[count].artist['#text'];
        }
      }      

      (function(){
        var i = 0;
        function forloop(){
          if(i<trackArr.length){
            // console.log(trackArr[i].artist['#text'], trackArr[i].name);
            lfm.track.getInfo({
              'artist' : trackArr[i].artist['#text'],
              'track' : trackArr[i].name
            }, function (err, track) {
              if (err) console.log(err);
              // console.log(track);
              output.minutes = output.minutes+((parseInt(track.duration)/1000)/60);
              i++;
              forloop();
            });
          }else{
            // res.send(200, output);
            // console.log(output);

            lfm.track.getInfo({
              'artist' : output.maxSongArtist,
              'track': output.maxSongName
            }, function(err, track) {
              if (err) throw(err);
              if (track.album && track.album.image) {
                output.maxSongArt = track.album.image[track.album.image.length-1]['#text'];
              }

              lfm.artist.getInfo({
                'artist' : output.maxArtistName,
              }, function(err, artist) {
                if (err) throw(err);
                  output.maxArtistArt = artist.image[artist.image.length-1]['#text'];
                  // console.log(output.maxArtistArt)            

                  var report = new Report({
                    username: mySessionCreds.username,
                    key: mySessionCreds.key,
                    minutes: output.minutes,
                    MaxArtistPlays: output.maxArtist,
                    MaxArtist: output.maxArtistName,
                    MaxArtistArt: output.maxArtistArt,
                    MaxSongPlays: output.maxSong,
                    MaxSongArtist: output.maxSongArtist,
                    MaxSong: output.maxSongName,
                    MaxSongArt: output.maxSongArt,
                    total: output.total
                  });
                  // console.log(report);
                  report.save(function(err, stuff) {
                    if (err) throw(err);
                    // console.log(stuff);
                    // res.location('/buildGraph');
                    res.sendfile(__dirname+'/client/public/client/templates/index.html');
                  });
              });
            });
          }
        }
        forloop();
      })();

      // try db again tmrw...
      // for (var i=0; i<trackArr.length; i++) {
      //   console.log(trackArr[i]);
      //   if (trackArr[i].name && trackArr.artist) {
      //     var song = new Song({
      //       title: trackArr[i].name,
      //       artist: trackArr[i].artist['#text']
      //     });
      //     console.log('saving');
      //     song.save(function(err,stuff) {
      //       if (err) {
      //         throw err;
      //       } else {
      //         console.log(stuff);
      //         res.send(302);
      //       }
      //     });
      //   }
      // }

    }
  });
});

app.get('/buildGraph', function(req, res){
  console.log('get request sent');
  Report.find({}, function(err, report) {
    // console.log(report);
    console.log(report[0]);
    res.send(200, report[0]);
  });
});


module.exports = app;