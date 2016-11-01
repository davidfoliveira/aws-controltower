"use strict";

var
    AWS             = require('aws-sdk'),
    async           = require('async'),
    regionHandlers  = { },
    rssModules;

// Read the submodules
['cloudwatch', 'ec2'].forEach(function(mod){
    exports[mod] = require('./aws/'+mod);
});

// The module for each resource type
rssModules = {
    asg:    exports.ec2.autoscaling,
    elb:    exports.ec2.elb,
    ec2:    exports.ec2.instances
};

// Global functions
exports.getRegionModule = function(regionName, awsModule) {

    var
        regModKey = regionName + "." + awsModule;

    // Get CW handler for the requested region
    if ( !regionHandlers[regModKey] ) {
        AWS.config.region = regionName;
        regionHandlers[regModKey] = new (AWS[awsModule])();
    }
    return regionHandlers[regModKey];

};


// Gets AWS resources for a parsed query (well, if it's not parsed, parse we it!)
exports.getResources = function(query, callback) {

    var
        self = this,
        res  = null;

    // If the query is not parsed, parse it.
    if ( typeof query == "string" )
        query = self.$(query);

    // For each query part
    return async.mapSeries(query,
        function(part, nextPart){

            // We have a resource type! Let's go straight there!
            if ( part.type ) {
                return rssModules[part.type].select(part, function(err,rss){
                    if ( err ) {
                        console.log("Error selecting resources for part: ", part);
                        return next(err, null);
                    }
                    res = rss;

                    return nextPart(null,rss.length);
                });
            }
            else {

                // We do not have a resource type :-( We have to get everything.
                return async.map(Object.keys(rssModules),
                    function(type, nextRssType) {
                        // Search on current resource type
                        console.log("TYPE: ", type);
                        return rssModules[type].select(part, function(err,typeRss){
                            if ( err ) {
                                console.log("Error selecting resources for part: ", part);
                                return nextRssType(err, null);
                            }

                            // Add the resources to the result list
                            res = res.concat(typeRss);

                            return nextRssType(null, rss.length);
                        });
                    },
                    function(err){
                        if ( err ) {
                            console.log("Error querying resources without an type: ", err);
                            return nextPart(err, null);
                        }
                    }
                );

            }

        },
        function(err){
            if ( err ) {
                console.log("Error getting resources for the supplied query: ", err);
                return callback(err, null);
            }

            console.log("Found "+res.length+" resources for the supplied query");
            return callback(null, res);
        }
    );

};


// Resource selector
// Here we just parse the query (because this is a synchronous function).
// It produces no more results than a parsed query object
// use getResources() to get the results of the parsed query object
exports.$ = function(query) {

    var
        initialQuery = query,
        queryGroups = [];


    // While we do have a query
    while ( !query.match(/^\s*$/) ) {

        var
            expr = { };

        // A resource type
        if ( query.match(/^(\w+)/) ) {
            expr.type = RegExp.$1;
            if ( !rssModules[expr.type] )
                throw new Error("Unsupported resource type: "+expr.type);
            query = query.replace(/^\w+/, "");
        }

        // A name or tag
        while ( query.match(/^([#\.])([\w\-]+)/) ) {
            var
                type = RegExp.$1,
                data = RegExp.$2;

            if ( type == "#" ) {
                if ( expr.name )
                    throw new Error("Filtering twice on name: "+query);
                expr.name = data;
            }
            else {
                if ( expr.tag == null )
                    expr.tag = [];
                expr.tag.push(data);
            }
            query = query.replace(/^([#\.][\w\-]+)/, "");
        }

        // Remove eventual spaces
        query = query.replace(/^\s+/, "");

        // What?
        if ( Object.keys(expr).length == 0 )
            throw new Error("Unknown selector '"+query+"'");

        // Add the expression to the list
        queryGroups.push(expr);

        // A direct child of
        if ( query.match(/^\s*>\s*/) ) {
            queryGroups.push({ link: 'direct-child' });
            query = query.replace(/^\s*>\s*/,"");
        }

    }

    return { _selector: initialQuery, query: queryGroups };

};