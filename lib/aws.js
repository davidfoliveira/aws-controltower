var
    AWS             = require('aws-sdk'),
    regionHandlers  = { };


['cloudwatch', 'autoscaling'].forEach(function(mod){
    exports[mod] = require('./aws/'+mod);
});

// Global functions
exports.getRegionModule = function(regionName, awsModule) {

    // Get CW handler for the requested region
    if ( !regionHandlers[region] ) {
        AWS.config.region = region;
        regionHandlers[region+"."+awsModule] = new AWS[awsModule]();
    }
    return regionHandlers[region+"."+awsModule];

};