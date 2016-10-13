"use strict";

var
    aws             = require('../aws');


// Get an autoscaling group by it's name
exports.getAutoscalingGroup = function(region, name, callback) {

    // Get module set up for the requested region
    autoscaling = aws.getRegionModule(region, 'AutoScaling');

    // Describe autoscaling groups
    return autoscaling.describeAutoscalingGroups({ name: name }, function(err, list) {
        if ( err ) {
            console.log("Error getting autoscaling group by name: ", err);
            return callback(err,null);
        }

        console.log("res: ", list);
    });

};