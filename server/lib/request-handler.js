var request = require('request');
var LastfmAPI = require('lastfmapi');
var db = require('../../client/app/config');
var Report = require('../../client/app/models/report.js');

var partials = require('express-partials');
var express = require('express');


var LASTFM_API_KEY = exports.LASTFM_API_KEY = '061fcc49510b182e98f96633aca83d35'; 
var LASTFM_API_SECRET = exports.LASTFM_API_SECRET ='ac2c7d41c479f4a9dfd496f3e13b9c7c';

var lfm = exports.lfm = new LastfmAPI({
  'api_key' : LASTFM_API_KEY,
  'secret' : LASTFM_API_SECRET
});