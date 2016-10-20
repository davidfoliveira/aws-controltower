var
    AWS             = require('aws-sdk'),
    regionHandlers  = { };


['cloudwatch', 'autoscaling'].forEach(function(mod){
    exports[mod] = require('./aws/'+mod);
});

// Global functions
exports.getRegionModule = function(regionName, awsModule) {

    var
        regModKey = regionName + "." + awsModule;

    // Get CW handler for the requested region
    if ( !regionHandlers[regModKey] ) {
        AWS.config.region = regionName;
        return new AWS.AutoScaling();
        regionHandlers[regModKey] = new (AWS[awsModule])();
    }
    return regionHandlers[regModKey];

};


function RootResourceResultSet(data) {

    var
        self = this;

    self._data = data || [];
    self.applySelector = function(type, selector) {
        return self;
    };

    return self;

}


// Resource selector
exports.$ = function(query) {

    var
        initialQuery = query,
        res = new RootResourceResultSet();

    // While do we have a query
    while ( !query.match(/^\s*$/) ) {

        // Resource type
        if ( query.match(/^(\w+)/) ) {
            var
                type = RegExp.$1.toLowerCase();

            // ELB
            if ( type == "elb" ) {
                res = res.applySelector("type", type);
            }
            query = query.replace(/^\w+/, "");
        }

        // Name/ID
        else if ( query.match(/^#([\w\-]+)/) ) {
            var name = RegExp.$1;
            query = query.replace(/^#([\w\-]+)/, "");
            res = res.applySelector("name", name);
        }

        // What?
        else {
            throw new Error("Unknown selector '"+query+"'");
        }
        console.log("Q: ", query);
    }

    return res;

};