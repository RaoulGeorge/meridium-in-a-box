define(function(require) {

	require('angular');
	require('angular-route');

	var view = require('text!./view.html'),
	AngularViewModel = require('spa/angular/angular-view-model');
	
	function HelloAngular() {
        base.call(this, view);
	}

    var base = Object.inherit(AngularViewModel, HelloAngular);

    HelloAngular.prototype.attach = function(region) {
   

        // var helloApp = angular.module("helloApp", []);
		
        base.prototype.attach.call(this, region);
		angular.module('myApp', [])
      	.controller('myCtrl', ['$scope', function ($scope) {
        	debugger
			$scope.name = "Calvin Hobbes";
      	}]);

	    angular.element(function() {
	      angular.bootstrap(document, ['myApp']);
	    });

    };

    HelloAngular.prototype.detach = function() {
    	
    };





	return HelloAngular;
});