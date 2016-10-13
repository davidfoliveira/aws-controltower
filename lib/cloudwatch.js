"use strict";

var
    aws = require('../aws');


// Get the last `numMinutea` samples for a given region and metric path
exports.getLastSamples = function(region, metricPath, numMinutes, callback) {

    var
        self    = this,
        minutes = 2,
        now     = new Date(),
        before  = new Date(now.getTime()-numMinutes*1000);

    // Get the metrics
    return self.getMetrics(region, metricPath, 60, before, now, callback);

};


// Get metrics for a given region, metric path, period size and from and to dates
exports.getMetrics = function(region, metricPath, period, from, to, callback) {

    var
        cloudwatch,
        params;

    // Set the parameters
    params = {
        EndTime:    to,
        MetricName: null,
        Namespace:  null,
        Period:     period || 60,
        StartTime:  from,
        Statistics: [ ],
        Dimensions: [
            {
                Name: null,
                Value: null
            }
        ],
        Unit: null
    };

    // Parse the metric path
    if ( !metricPath.match(/^([^\.]+)\.([^\.]+)\.([^\.]+)\.([^\.]+)\.([^\.]+)\(([^)]+)\)$/) )
        return callback(new Error("Invalid metric path"), null);

    params.Namespace = RegExp.$1;
    params.Dimensions[0].Name  = RegExp.$2;
    params.Dimensions[0].Value = RegExp.$3;
    params.MetricName = RegExp.$4;
    params.Statistics = [RegExp.$5];
    params.Unit = RegExp.$6;

    // Get module set up for the requested region
    cloudwatch = aws.getRegionModule(region, 'Cloudwatch');

    // Call CW
    return cloudwatch.getMetricStatistics(params, function(err, data) {
        if ( err ) {
            console.log("Error getting cloudwatch history metrics: ", err);
            return callback(err,null);
        }

        // Set the value
        data.Datapoints.forEach(function(sample){
            sample.Value = sample[params.Statistics[0]];
        });

        // Return
        return callback(null, data.Datapoints.sort(function(a,b){
            return  (a.Timestamp > b.Timestamp) ? 1 :
                    (b.Timestamp > a.Timestamp) ? -1 :
                    0;
        }));
    });

};