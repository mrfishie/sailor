var app = angular.module('sailor', ['ngRoute', 'hljs', 'picardy.fontawesome', 'angular-anchorjs']);

app.config(function($routeProvider) {
    $routeProvider
            .when('/', {
                templateUrl: 'templates/pages/home.html'
            })
            .when('/getStarted', {
                templateUrl: 'templates/pages/getStarted.html'
            })
            .when('/documentation/:docpage?', {
                templateUrl: 'templates/pages/documentation.html',
                controller: 'documentation'
            })
            .otherwise({
                templateUrl: 'templates/pages/404.html'
            })
});

app.controller('main', function($scope, $location) {
    // Get the class for navigation links
    $scope.navClass = function(url) {
        if ($scope.pathMatches(url)) return "active";
        return "";
    };

    $scope.pathMatches = function(path) {
        var currentPath = $scope.getPath();
        if (path[0] === '#') path = path.substr(1);
        if (path === '/') return currentPath === '/';
        return currentPath.indexOf(path) === 0;
    };

    // Gets the current URL
    $scope.getPath = function() {
        return $location.path();
    };

    $scope.buttons = [
        {
            'navIcon': 'check',
            'navText': 'Get Started',
            'bigIcon': 'book',
            'bigText': 'Check out the guide',
            'url': '#/getStarted',
            'footerVisible': true
        },
        {
            'navIcon': 'list',
            'navText': 'Documentation',
            'bigIcon': 'list',
            'bigText': 'Read the documentation',
            'url': '#/documentation',
            'footerVisible': true
        },
        {
            'navIcon': 'github',
            'navText': 'Github',
            'bigIcon': 'github',
            'bigText': 'View on Github',
            'url': 'http://github.com/mrfishie/sailor',
            'target': '_blank',
            'footerVisible': false
        }
    ];

    $scope.$on('$routeChangeStart', function(event, next, current) {
        var visibleButtons = 0;
        for (var i = 0; i < $scope.buttons.length; i++) {
            var button = $scope.buttons[i];

            if (visibleButtons < 2 && !$scope.pathMatches(button.url)) {
                button.footerVisible = true;
                visibleButtons++;
            } else button.footerVisible = false;
        }
    });
});

app.controller('documentation', ['$scope', '$location', '$routeParams', function($scope, $location, $routeParams) {
    var classes = $scope.classes = [];

    console.log($routeParams, $location.hash());
    if ($routeParams.docpage && !$location.hash()) $location.hash('class-' + $routeParams.docpage);

    this.addClass = function(cls) {
        classes.push(cls);
    }
}]);