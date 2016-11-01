"use strict";

var
    async       = require('async'),
    aws         = require('../lib/aws'),
    exprs       = require('../lib/exprs'),
    conf        = require('../lib/conf'),
    STATS       = { },
    UPDATING    = false;

// TODO:

// Start the live update
function updateLive() {
    setTimeout(function(){
        console.log("LIVE");
        return updateData(function(){
            analyseData();
            return updateLive();
        });
    }, conf.liveUpdateTimeout || 30000);
}

// Update live data
function updateData(callback) {
    if ( UPDATING )
        return;
    UPDATING = true;

    console.log("Reading live data...");

    // For each region in the configuration
    async.map(conf.regions,
        function(region, nextRegion){

            // For each metric type in the configuration
            async.map(Object.keys(conf.metrics),
                function(metric, nextMetric) {
                    return aws.cloudwatch.getLastSamples(region, conf.metrics[metric], 2, function(err,data){
                        if ( err ) {
                            console.log("Error getting live '"+metric+"': ",err);
                            return next(null,false);
                        }

                        if ( !STATS[region][metric] )
                            STATS[region][metric] = {};
                        data.forEach(function(row){
                            var when = row.Timestamp.getTime()/1000;
                            STATS[region][metric][when] = row.Value;
                        });
                        return nextMetric(null,true);
                    });
                },
                function(err,res) {
                    return nextRegion(null,true);
                }
            );
        },
        function(err){
            if ( err ) {
                console.log("Error getting live data: ", err);
                console.log("Not analysing data");
                return;
            }
            console.log("Live data was read");

            UPDATING = false;
            return callback(null,true);
        }
    );

}


// Analyse live data
function analyseData(callback) {

    // Evaluate the expressions for each region (for now)
    conf.regions.forEach(function(REGION){
        var action = null;

        // Evaluate every expression in the configuration
        conf.triggers.forEach(function(trigger){
            if ( !trigger._expr || !trigger._action ) {
                console.log("No trigger expr/action on trigger, ignoring...");
                return;
            }

            // Evaluate
            trigger._aliases = {};
            trigger._lastRV = exprs.eval(trigger._expr, {data: STATS, aliases: trigger._aliases, region: REGION});

            // Should trigger the action?
            if ( trigger._lastRV )
                action = trigger;
        });

        // Should it take some action?
        if ( action ) {
            console.log("RUNNING ACTION: ", action._action);
            runTriggerAction(action);
        }

    });

}


// Import all the data
function importHistory(callback) {
    console.log("Importing history...");

    // For each region in the configuration
    async.map(conf.regions,
        function(region, nextRegion){

            // For each metric type in the configuration
            async.map(Object.keys(conf.metrics),
                function(metric, nextMetric){
                    aws.cloudwatch.getLastSamples(region, conf.metrics[metric], 7200, function(err, data){
                        if ( !STATS[region] )
                            STATS[region] = {};
                        if ( !STATS[region][metric] )
                            STATS[region][metric] = {};
                        data.forEach(function(row){
                            var when = row.Timestamp.getTime()/1000;
                            STATS[region][metric][when] = row.Value;
                        });
                        return nextMetric(null,true);
                    });
                },
                function(err){
                    if ( err ) {
                        console.log("Error importing metrics: ", err);
                        return process.exit(-1);
                    }

                    // Done
                    return nextRegion(null,true);
                }
            );

        },
        function(err, res){
            console.log("Done");
            return callback(err,res);
        }
    );
}

// Run a trigger's action
function runTriggerAction(trigger) {
    console.log(trigger._action);
}


/*
 The magic starts here
 */

// Parse trigger expressions
conf.triggers.forEach(function(t){
    if ( t.expr )
        t._expr = exprs.parse(t.expr);
    if ( t.action )
        t._action = exprs.parse(t.action);
});


// Import the history and start live updates
importHistory(function(err){
    if ( err ) {
        console.log("Error importing history data: ", err);
        return process.exit(-1);
    }

    analyseData();
    updateLive();
});