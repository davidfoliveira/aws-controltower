"use strict";

var
    aws     = require('../aws');


// List autoscaling groups by their names
exports.listAutoscalingGroups = function(region, names, callback) {

    var
        autoscaling;

    // Get module set up for the requested region
    autoscaling = aws.getRegionModule(region, 'AutoScaling');

    // Describe autoscaling groups
    return autoscaling.describeAutoScalingGroups({AutoScalingGroupNames: names}, function(err, list) {
        if ( err ) {
            console.log("Error getting autoscaling group by name: ", err);
            return callback(err,null);
        }

        return callback(null, list.AutoScalingGroups || []);
    });

};


// Get an autoscaling group by it's name
exports.getAutoscalingGroup = function(region, name, callback) {

    return this.listAutoscalingGroups(region, [name], function(err, list){
        if ( err ) {
            console.log("Error listing autoscaling groups by name: ", err);
            return callback(err, null);
        }

        return callback(null, list[0]);
    });

};