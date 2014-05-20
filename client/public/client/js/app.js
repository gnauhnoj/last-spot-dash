var app = angular.module('last-spot-dash', ['ngRoute']);
 

app.config(function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $routeProvider
    .when('/', {
      templateUrl : '/public/client/templates/home.html',
      controller : 'loginArea'
    })

    .when('/buildGraph', {
      templateUrl: '/public//client/templates/dash.html',
      controller: 'dashArea'
    })

    .when('/getstats', {
      templateUrl: '/public/client/templates/dash.html',
      controller: 'getStats'
    })
});

app.controller('loginArea', function($scope, $http) {
});

app.controller('getStats', function($scope, $http) {
  console.log('get request sent');
  $http.get('/buildGraph')
    .success(function(data,status,headers,config) {
      console.log('DataBACK', data);
      // data.sort
      $scope.MaxArtist = data.MaxArtist;
      $scope.MaxArtistArt = data.MaxArtistArt;
      $scope.MaxArtistPlays = data.MaxArtistPlays;
      $scope.MaxSong = data.MaxSong;
      $scope.MaxSongArtist = data.MaxSongArtist;
      $scope.MaxSongPlays = data.MaxSongPlays;
      $scope.minutes = Math.round(data.minutes);
      $scope.username = data.username;
      $scope.MaxSongArt = data.MaxSongArt;
      $scope.total = data.total;
    }).error(function(data) {
      console.log('errors', data);
    });

});

app.controller('dashArea', function($scope, $http) {

});