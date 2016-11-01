"use strict";

var
    AWS             = require('aws-sdk'),
    async           = require('async'),
    conf            = require('./conf'),
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
        res  = [];

    // If the query is not parsed, parse it.
    if ( typeof query == "string" )
        query = self.$(query);

    console.log("QUERY: ", query);

    // For each query part
    return async.mapSeries(query.query,
        function(part, nextPart){

            if ( part.type ) {
                // We have a resource type! Let's go straight there!
                return selectResourcesByType(part.type, part, function(err, rss){
                    if ( err ) {
                        console.log("Error selecting resources for type '"+type+"' and part: ", part);
                        return next(err, null);
                    }
                    res = rss;

                    return nextPart(null, rss.length);
                });
            }
            else {
                // No resource type, we have to try every type
                return selectResourcesNoType(part, function(err, rss){
                    if ( err ) {
                        console.log("Error selecting resources of any type for part: ", part);
                        return next(err, null);
                    }
                    res = rss;

                    return nextPart(null, rss.length);
                });
            }

        },
        function(err) {
            if ( err ) {
                console.log("Error getting resources for the supplied query: ", err);
                return callback(err, null);
            }
console.log("RES: ", res);
            console.log("Found "+res.length+" resources for the supplied query");
            return callback(null, res);
        }
    );

};


// Select resource by there type (it's much faster than getting everything just to find what's got the same name/tag)
function selectResourcesByType(type, selector, callback) {

    var
        regions = selector.region ? [selector.region] : conf.regions,
        res = [];

    console.log("Finding resources of type "+type+" matching selector ", selector);

    // For each region
    async.map(regions,
        function(region, nextRegion){

            // Search on current resource type
            return rssModules[type].select(region, selector, function(err, rss){
                if ( err ) {
                    console.log("Error selecting resources by type '"+type+"' for part: ", part);
                    return nextRegion(err, null);
                }

                // Add the resources to the global list
                res = res.concat(rss);

                return nextRegion(null, rss.length);
            });

        },
        function(err) {
            if ( err ) {
                console.log("Error selecting resources by type: ", err);
                return callback(err, null);
            }

            console.log("Found "+res.length+" resources of type "+type);
            return callback(null, res);
        }
    );

}


// Select resources without a type - we have to go through all the types
function selectResourcesNoType(selector, callback) {

    var
        res = [];

    console.log("Finding resources of any type matching selector ", selector);

    // We do not have a resource type :-( We have to get everything.
    return async.map(Object.keys(rssModules),
        function(type, nextRssType) {
            return selectResourcesByType(type, selector, function(err, rss){
                if ( err ) {
                    console.log("Error finding resources for type '"+type+"': ", err);
                    return nextRssType(err, null);
                }

                res = res.concat(rss);
                return nextRssType(null, rss.length);
            });
        },
        function(err){
            if ( err ) {
                console.log("Error finding resources of every type: ", err);
                return callback(err, null);
            }

            console.log("Found "+res.length+" resources of all types");
            return callback(null, res);
        }
    );

}


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
        while ( query.match(/^([#\.@])([\w\-]+)/) ) {
            var
                type = RegExp.$1,
                data = RegExp.$2;

            if ( type == "#" ) {
                if ( expr.name )
                    throw new Error("Filtering twice on name: "+query);
                expr.name = data;
            }
            if ( type == "@" ) {
                if ( expr.region )
                    throw new Error("Filtering twice on region: "+query);
                expr.region = data;
            }
            else {
                if ( expr.tag == null )
                    expr.tag = [];
                expr.tag.push(data);
            }
            query = query.replace(/^([#\.@][\w\-]+)/, "");
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