myApp.controller('summaryController', ['$scope', '$rootScope', '$http', '$filter', 'summaryApi', 'Mixins', 'ngTableParams', function($scope, $rootScope, $http, $filter, summaryApi, Mixins, ngTableParams) {
    $scope.pie_charts = [];
    $scope.average_pie_chart = null;
    $scope.average_line_chart = null;
    $scope.deviation_line_chart = null;
    $scope.tests = null;
    $scope.metrics = null;
    $scope.faces = {};
    $scope.table_sizes = null;
    $scope.autohint_sizes = null;
    $scope.fontaine_fonts = null;
    $scope.fonts_orthography = null;
    $scope.fonts_tables_grouped = null;
    $scope.fontSupportToStyle = {
        'full': 'success',
        'partial': 'info',
        'fragmentary': 'warning',
        'unsupported': 'danger'
    };

    angular.forEach([100, 200, 300, 400, 500, 600, 700, 800, 900], function(weight) {
        $scope.faces[weight] = $rootScope.metadata.fonts.filter(function(face) {
            return face.weight == weight;
        });
    });
    summaryApi.getMetrics().then(function(response) {
        $scope.metrics = response.data;
    });
    summaryApi.getTableSizes().then(function(response) {
        $scope.table_sizes = response.data;
    });
    summaryApi.getAutohintSizes().then(function(response) {
        $scope.autohint_sizes = response.data;
    });
    summaryApi.getFontaineFonts().then(function(response) {
        $scope.fontaine_fonts = response.data;
    });
    summaryApi.getFontsOrthography().then(function(response) {
        $scope.fonts_orthography = response.data;
    });
    summaryApi.getTests().then(function(response) {
        $scope.tests = response.data;
        var watch_list = ['error', 'failure', 'fixed'];
        var watch_tag = 'required';
        var data = [];
        // reformat data for table
        angular.forEach($scope.tests, function(test) {
            angular.forEach($scope.resultMap, function(result_val, result_key) {
                if (watch_list.indexOf(result_key) != -1) {
                    angular.forEach(test[result_key], function(test_obj) {
                        if (test_obj.tags.indexOf(watch_tag) != -1) {
                            var item = {
                                font: test.name,
                                orig_data: test_obj, // keep original data
                                categories: test_obj.tags.join(', '),
                                description: test_obj.methodDoc,
                                result_msg: test_obj.err_msg,
                                result_status: $scope.statusMap[result_key],
                                result_class: result_val
                            };
                            data.push(item);
                        }
                    })
                }
            });
        });

        $scope.testsTableParams = new ngTableParams({
            // show first page
            page: 1,
            // count per page
            count: data.length,
            // initial sorting
            sorting: {
                result_status: 'asc'
            }
        }, {
            // hide page counts control
            counts: [],
            // length of data
            total: data.length,
            getData: function($defer, params) {
                // use build-in angular filter
                var orderedData = params.sorting() ?
                    $filter('orderBy')(data, params.orderBy()) :
                    data;
                params.total(orderedData.length);
                $defer.resolve(orderedData);
            }
        });

        var chartsum = {"success": 0, "failure": 0, "fixed": 0, "error": 0};
        angular.forEach($scope.tests, function(test) {
            var success_len = test['success'].length,
                fixed_len = test['fixed'].length,
                failure_len = test['failure'].length,
                error_len = test['error'].length,
                gdata = google.visualization.arrayToDataTable([
                    ['Tests', '#'],
                    ['Success '+success_len, success_len],
                    ['Fixed '+fixed_len, fixed_len],
                    ['Failed '+failure_len, failure_len],
                    ['Error '+error_len, error_len]
                ]),
                options = {
                    title: test.name,
                    is3D: true,
                    colors: ['#468847', '#3a87ad', '#b94a48', '#c09853']
                };
            $scope.pie_charts.push({data: gdata, options: options, type: "PieChart", displayed: true});
            chartsum = {
                "success": chartsum.success + success_len,
                "error": error_len,
                "failure": chartsum.failure + failure_len,
                "fixed": chartsum.fixed + fixed_len
            }
        });
        if ($scope.tests.length > 1) {
            var success_len = chartsum.success,
                fixed_len = chartsum.fixed,
                failure_len = chartsum.failure,
                error_len = chartsum.error,
                gdata = google.visualization.arrayToDataTable([
                    ['Tests', '#'],
                    ['Success '+success_len, success_len],
                    ['Fixed '+fixed_len, fixed_len],
                    ['Failed '+failure_len, failure_len],
                    ['Error '+error_len, error_len]
                ]),
                options = {
                    title: "Average",
                    is3D: true,
                    colors: ['#468847', '#3a87ad', '#b94a48', '#c09853']
                };
            $scope.average_pie_chart = {data: gdata, options: options, type: "PieChart", displayed: true};
        }
    });
    summaryApi.getFontsTableGrouped().then(function(response) {
        $scope.fonts_tables_grouped = response.data;
        var headings = ["Table", "Average"].concat($scope.fonts_tables_grouped.grouped.fonts);
        var aggregated_table = [];
        aggregated_table.push(headings);
        angular.forEach($scope.fonts_tables_grouped.grouped.tables, function(table) {
            aggregated_table.push(table)
        });

        var average_data = google.visualization.arrayToDataTable(aggregated_table);
        var average_options = {
            title: "Fonts compared to average",
            is3D: true,
            vAxis: {
                title: "Size (bytes)"
            },
            hAxis: {
                slantedText: true
            },
            height: 500
        };
        $scope.average_line_chart = {data: average_data, options: average_options, type: 'LineChart', displayed: true};

        var headings2 = ["Table"].concat($scope.fonts_tables_grouped.delta.fonts);
        var deviation_table = [];
        deviation_table.push(headings2);
        angular.forEach($scope.fonts_tables_grouped.delta.tables, function(table) {
            deviation_table.push(table);
        });

        var data2 = google.visualization.arrayToDataTable(deviation_table);

        var options2 = {
            bar: {groupWidth: "68%"},
            title: "Deviation from an average",
            is3D: true,
            vAxis: {
                title: "Deviation (bytes)"
            },
            hAxis: {
                slantedText: true
            },
            height: 500
        };
        $scope.deviation_line_chart = {data: data2, options: options2, type: 'ColumnChart', displayed: true};

    });


    $scope.isReady = function() {
        return !Mixins.checkAll(
            null, $scope.metrics, $scope.tests, $scope.faces,
            $scope.table_sizes, $scope.autohint_sizes,
            $scope.fontaine_fonts, $scope.fonts_orthography
        )
    };

    $scope.$on('$viewContentLoaded', function() {
//    console.log("$viewContentLoaded");
    });
}]);