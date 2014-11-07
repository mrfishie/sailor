app.directive('documentation', function() {
    return {
        restrict: 'E',
        transclude: true,
        scope: {},
        controller: function($scope, $location) {
            var classes = $scope.classes = [];

            this.addClass = function(cls) {
                classes.push(cls);
            };

            $scope.getClass = function(cls) {
                var hash = $location.hash();
                if (hash.indexOf('func-') === 0 && hash.indexOf('.') !== -1) {
                    var correctClass = hash.substring(5, hash.indexOf('.'));
                    return correctClass === cls.name ? 'active' : '';
                } else {
                    if ($location.path() === '/documentation/') return hash === 'class-' + cls.name ? 'active' : '';
                    return $location.path() === '/documentation/' + cls.name ? 'active' : '';
                }
            }
        },
        template:   '<div class="documentation">' +
                        '<div class="secondNav"><div class="wrapper">' +
                            '<div ng-repeat="class in classes" ng-class="getClass(class)" class="nav-div">' +
                                    '<a ng-href="#/documentation/{{class.name}}" title="{{class.name}} class">{{class.name}}</a>' +
                                    '<div class="nav-functions">' +
                                        '<a ng-repeat="func in class.functions"' +
                                            'ng-href="#/documentation/{{class.name}}#func-{{class.name}}.{{func.name}}"' +
                                            'title="{{class.name}}.{{func.name}} function">' +
                                                '{{func.name}}' +
                                        '</a>' +
                                    '</div>' +
                            '</div>' +
                        '</div></div>' +
                        '<div class="docs" ng-transclude></div>' +
                    '</div>'
    }
});

app.directive('class', function() {
    return {
        restrict: 'E',
        require: '^documentation',
        transclude: true,
        scope: {
            'name': '@'
        },
        controller: function($scope) {
            var functions = this.functions = $scope.functions = [];

            this.addFunction = function(func) {
                functions.push(func);
            };
            this.name = $scope.name;
        },
        link: function(scope, element, attrs, documentation) {
            documentation.addClass(scope);
        },
        template:   '<div class="class" id="class-{{name}}">' +
                        '<div class="class-header"><div class="wrapper class-header"><h1>{{name}}</h1></div></div>' +
                        '<div ng-transclude></div>' +
                    '</div>'
    };
});

app.directive('function', function() {
    return {
        restrict: 'E',
        require: '^class',
        replace: true,
        transclude: true,
        scope: {
            'name': '@',
            'returns': '@',
            'returnDescript': '@'
        },
        link: function(scope, element, attrs, cls) {
            cls.addFunction(scope);
            scope.class = cls;
            this.name = scope.name;
        },
        template:   '<div class="page function"><div class="wrapper">' +
                        '<h2 class="func-name" id="func-{{class.name}}.{{name}}" anchored="/documentation/{{class.name}}">{{class.name}}.{{name}}</h2>' +
                        '<h3 class="func-return" ng-if="returns">Returns <code>{{returns}}</code> <em>{{returnDescript}}</em></h3>' +
                        '<div class="func-descript" ng-transclude></div>' +
                    '</div></div>'
    };
});

app.directive('argument', function($compile) {
    return {
        restrict: 'E',
        require: '^?function',
        replace: true,
        transclude: true,
        scope: {
            'name': '@',
            'type': '@',
            'description': '@'
        },
        link: function(scope, element, attrs, dummy, transcludeFn) {
            var $argDescription = element.children('.arg-descript');

            transcludeFn(scope, function(clone, innerScope) {
                var compiled = $compile(clone)(scope);

                if (compiled.length) $argDescription.append(compiled);
                else $argDescription.addClass('empty');
            });

            scope.optional = attrs.optional !== undefined;
        },
        template:   '<div class="argument">' +
                        '<p class="arg-head">' +
                            '<code><em>{{type}}</em> <strong>{{name}}</strong></code> - ' +
                            '{{description}} <em ng-if="optional">(optional)</em>' +
                        '</p>' +
                        '<div class="arg-descript"></div>' +
                    '</div>'
    };
});

app.directive('description', function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {},
        template:   '<div class="description"><div class="wrapper" ng-transclude></div></div>'
    };
});

app.directive('funcref', function() {
    return {
        restrict: 'E',
        scope: {
            'class': '@',
            'func': '@'
        },
        template:   '<code>' +
                        '<a ng-href="#/documentation/{{class}}#func-{{class}}.{{func}}">' +
                            '{{class}}.{{func}}' +
                        '</a>' +
                    '</code>'
    };
});