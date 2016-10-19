"use strict";

var
    async           = require('async'),
    aws             = require('../aws');


// Find or just return an autoscaling group or a list of them
exports.getAutoscalingGroups = function(region, asgOrName, callback) {

    var
        self = this;

    // Is it an ASG object or a list of objects?
    if ( typeof(asg) == "object" ) {
        return callback(null, [asg]);
    }

    // Is it an ASG name?
    else if ( typeof(asg) == "string" ) {
        return self.getAutoscalingGroup(region, asgOrName, function(err, asg) {
            if ( err ) {
                console.log("Error getting autoscaling group by name '"+asgOrName+"': ", err);
                return callback(err, null);
            }

            if ( asg == null ) {
                console.log("Autoscaling group named '"+asgOrName+"' not found");
                return callback(null, []);
            }

            return callback(null, [asg]);
        });
    }

    // Something else
    else {
        throw new Error("Don't know what to do with ASG:", asg);
    }

};

// Get an autoscaling group by it's name
exports.getAutoscalingGroupByName = function(region, name, callback) {

    // Get module set up for the requested region
    autoscaling = aws.getRegionModule(region, 'AutoScaling');

    // Describe autoscaling groups
    return autoscaling.describeAutoscalingGroups({ name: name }, function(err, list) {
        if ( err ) {
            console.log("Error getting autoscaling group by name: ", err);
            return callback(err,null);
        }

        // Not found?
        if ( list.length == 0 ) {
            console.log("Couldn't find any ASG named '"+name+"'");
            return callback(null, null);
        }

        console.log("Found the ASG named '"+name+"', returning it!");
        return callback(null, list[0]);
    });

};


// Scale up/down an ASG
exports.scale = function(region, asg, numInstOrImpact, callback) {

    var
        self     = this,
        asgNames = [];

    // Get module set up for the requested region
    autoscaling = aws.getRegionModule(region, 'AutoScaling');

    // The asg name
    if ( typeof asg == "string" ) {
        asgNames = [asg];
    }
    else if ( asg instanceof Array ) {
        asg.forEach(function(asgElm){
            if ( typeof asgElm == "string" ) {
                asgNames.push(asgElm);
            }
            else if ( typeof asgElm == "object" ) {
                asgNames.push(asgElm.Name);
            }
        });
    }
    else if ( typeof asg == "object" ) {
        asgNames.push(asgElm.Name);
    }

    async.map(asgNames,
        function(asgName, next){
            // Describe autoscaling groups
            return autoscaling.setDesiredCapacity({AutoScalingGroupName: name}, function(err, list) {
                if ( err ) {
                    console.log("Error getting autoscaling group by name: ", err);
                    return callback(err,null);
                }



            });            
        },
        function(){

        }
    );


};