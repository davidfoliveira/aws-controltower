"use strict";

var
    async       = require('async'),
    aws         = require('../aws'),
    utils       = require('../utils');


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
exports.getAutoscalingGroupsByName = function(region, names, callback) {

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

    return this.getAutoscalingGroupsByName(region, [name], function(err, list){
        if ( err ) {
            console.log("Error listing autoscaling groups by name: ", err);
            return callback(err, null);
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
exports.scale = function(region, asg, numberOrImpact, opts, callback) {

    var
        self            = this,
        isImpact        = numberOrImpact.toString().match(/^\s*[+\-]|%\s*$/),
        asgNames        = [],
        asgByName       = {},
        needToFetch     = [],
        desiredByASG    = {},
        autoscaling;

    // Validate arguments
    if ( !region || !asg || !numberOrImpact )
        throw new Error("We need at least a region, autoscaling group and a number/asg_impact")
    numberOrImpact = numberOrImpact.toString();
    if ( !numberOrImpact.match(/^\s*[+\-]\s*\d+\s*$|^\s*[+\-]\s*(\d+(?:\.\d+)?)%\s*$|^\s*\d+\s*$/) )
        throw new Error("Don't know what to do with this number/impact string '"+numberOrImpact+"'");

    // Autocomplete arguments
    if ( !opts && !callback ) {
        callback = function(){};
        opts = {};
    }
    if ( typeof opts == "function" ) {
        callback = opts;
        opts = {};
    }
    if ( !opts )
        opts = {};

    // Get module set up for the requested region
    autoscaling = aws.getRegionModule(region, 'AutoScaling');

    // Check the asg input and mark the ASG groups we need to retrieve in case we get a relative impact
    // we accept a simple string with the ASG name
    if ( typeof asg == "string" ) {
        asgNames = [asg];
        needToFetch.push(asg);
        console.log("Need to fetch because it's a string");
    }
    // we accept an ASG object
    else if ( typeof asg == "object" && asg.AutoScalingGroupName ) {
        asgNames.push(asg.AutoScalingGroupName);
        if ( asg.DesiredCapacity == null ) {
            console.log("Need to fetch because it's got a null DC");
            needToFetch.push(asg.AutoScalingGroupName);
        }
        else
            asgByName[asg.AutoScalingGroupName] = asg;
    }
    // we accept an array of things
    else if ( asg instanceof Array ) {
        asg.forEach(function(asgElm){
            // containing a string with an ASG name
            if ( typeof asgElm == "string" ) {
                asgNames.push(asgElm);
                console.log("Need to fetch because it's a string");
                needToFetch.push(asgElm);
            }
            // cotaining an ASG object
            else if ( typeof asgElm == "object" && asg.AutoScalingGroupName ) {
                asgNames.push(asgElm.AutoScalingGroupName);
                if ( asgElm.DesiredCapacity == null ) {
                    console.log("Need to fetch because it's got a null DC");
                    needToFetch.push(asgElm.AutoScalingGroupName);
                }
                else
                    asgByName[asgElm.AutoScalingGroupName] = asgElm;
            }
        });
    }

    console.log("Scaling "+asgNames.length+" ASG's at "+region+" to "+numberOrImpact);

    // If we need to fetch some ASG
    return utils.when(isImpact && needToFetch.length > 0,
        function(next) {
            console.log("Resolving "+needToFetch.length+" autoscaling groups...");

            // Describe autoscaling groups
            return self.getAutoscalingGroupsByName(region, needToFetch, function(err, asgList) {
                if ( err ) {
                    console.log("Error getting resolving autoscaling groups by name: ", err);
                    return callback(err,null);
                }

                // Hash ASG's by Name
                asgList.forEach(function(asgItem){
                    asgByName[asgItem.AutoScalingGroupName] = asgItem;
                });

                return next(null,true);
            });
        },
        function() {
            // Set ASG's desired capacity
            if ( isImpact ) {
                var impact = numberOrImpact.toString();
                Object.keys(asgByName).forEach(function(asgName){
                    var asgItem = asgByName[asgName];
                    if ( numberOrImpact.match(/^\s*\+\s*(\d+)\s*$/) )
                        asgItem.DesiredCapacity += parseInt(RegExp.$1);
                    else if ( numberOrImpact.match(/^\s*\-\s*(\d+)\s*$/) )
                        asgItem.DesiredCapacity -= parseInt(RegExp.$1);
                    else if ( numberOrImpact.match(/^\s*\-\s*(\d+(?:\.\d+)?)\s*%\s*$/) )
                        asgItem.DesiredCapacity *= (100-parseFloat(RegExp.$1))/100;
                    else if ( numberOrImpact.match(/^\s*\+\s*(\d+(?:\.\d+)?)\s*%\s*$/) )
                        asgItem.DesiredCapacity *= 1+(parseFloat(RegExp.$1)/100);
                    desiredByASG[asgName] = Math.round(asgItem.DesiredCapacity);
                });
            }
            else if ( numberOrImpact.toString().match(/\s*(\d+)\s*$/) ) {
                var num = RegExp.$1;
                asgNames.forEach(function(asgName){
                    desiredByASG[asgName] = parseInt(num);
                });
            }

            // Change the number of desired instances
            async.map(asgNames,
                function(asgName, next){
                    var params = {
                        AutoScalingGroupName:   asgName,
                        DesiredCapacity:        desiredByASG[asgName],
                        HonorCooldown:          opts.honorCooldown || false
                    };
                    console.log("Setting ASG '"+asgName+"' desired capacity to "+desiredByASG[asgName]+"...");

                    // Dry run?
                    if ( opts.dryRun )
                        return next(null, desiredByASG[asgName]);

                    // Really set the desired capacity
                    return autoscaling.setDesiredCapacity(params, function(err, res){
                        if ( err ) {
                            console.log("Error setting ASG '"+asgName+"' desired capacity to "+desiredByASG[asgName]+": ", err);
                            return callback(err,null);
                        }
                        console.log("Successfully set ASG '"+asgName+"' desired capacity to "+desiredByASG[asgName]);
                        return next(null, desiredByASG[asgName]);
                    });
                },
                function(err, res){
                    if ( err ) {
                        console.log("Error scaling the supplied ASG's: ", err);
                        return callback(err, null);
                    }

                    console.log("Successfully scaled the supplied ASG's to "+res.join(', ')+"!");
                    return callback(null, res);
                }
            );
        }
    );

};
