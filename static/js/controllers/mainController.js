angular.module('myApp').controller('mainController', ['$scope', '$rootScope', '$http', '$window' ,'appApi', 'alertsFactory', 'appConfig', 'Mixins', function($scope, $rootScope, $http, $window, appApi, alertsFactory, appConfig, Mixins) {
    appApi.getAppInfo().then(function(dataResponse) {
        $scope.app_info = dataResponse.data;
    });
    appApi.getRepoInfo().then(function(dataResponse) {
        $scope.repo_info = dataResponse.data;
    });
    appApi.getMetadata().then(function(dataResponse) {
        $rootScope.metadata = dataResponse.data;
        $scope.selected_repo = $rootScope.metadata.name;
    });
    appApi.getRepos().then(function(dataResponse) {
        $scope.repos = dataResponse.data;
    });
    // current controller is on top level, so all http
    // errors should come through it
    $scope.alerts = alertsFactory;

    $scope.mixins = Mixins;
    $scope.statusMap = appConfig.statusMap;
    $scope.resultMap = appConfig.resultMap;
    $scope.pangram = appConfig.pangram;

    $scope.onRepoSelect = function ($item, $model, $label) {
        $window.location.href = $item.gh_page;
    };

}]);