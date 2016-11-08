"use strict";

var
    aws         = require('../../aws');


// The global resource select function
exports.select = function(region, selector, callback) {

    var
        self  = this,
        names = selector.name ? [selector.name] : [];

    // Get ELBs by name or get them all to filter later
    return self.getELBsByName(region, names, function(err, list){
        if ( err ) {
            console.log("Error gettings ELBs by name '"+JSON.stringify(names)+"': ", err);
            return callback(err, null);
        }

        

        console.log(JSON.stringify(list));

        return callback(null, list);
    });

};


// Get a list of ELBs by their names
exports.getELBsByName = function(region, names, callback) {

    var
        elb;

    // Get module set up for the requested region
    elb = aws.getRegionModule(region, 'ELB');

    // Describe ELBs
    // return elb.describeLoadBalancers({LoadBalancerNames: names}, function(err, list) {
    //     if ( err ) {
    //         console.log("Error getting ELBs by name: ", err);
    //         return callback(err, null);
    //     }

    //     return callback(null, list.LoadBalancerDescriptions || []);
    // });
    return callback(null, [{"LoadBalancerName":"Test","DNSName":"Test-787403620.eu-west-1.elb.amazonaws.com","CanonicalHostedZoneName":"Test-787403620.eu-west-1.elb.amazonaws.com","CanonicalHostedZoneNameID":"Z32O12XQLNTSW2","ListenerDescriptions":[{"Listener":{"Protocol":"HTTP","LoadBalancerPort":80,"InstanceProtocol":"HTTP","InstancePort":80},"PolicyNames":[]}],"Policies":{"AppCookieStickinessPolicies":[],"LBCookieStickinessPolicies":[],"OtherPolicies":[]},"BackendServerDescriptions":[],"AvailabilityZones":["eu-west-1b","eu-west-1c","eu-west-1a"],"Subnets":["subnet-175ad960","subnet-39b21660","subnet-cad248af"],"VPCId":"vpc-15d27c70","Instances":[{"InstanceId":"i-bc89942b"}],"HealthCheck":{"Target":"HTTP:80/index.html","Interval":30,"Timeout":5,"UnhealthyThreshold":2,"HealthyThreshold":10},"SourceSecurityGroup":{"OwnerAlias":"881829141866","GroupName":"default"},"SecurityGroups":["sg-c0773fa5"],"CreatedTime":"2016-11-01T23:19:33.640Z","Scheme":"internet-facing"}]);

};


// Get an ELB by it's name
exports.getELB = function(region, name, callback) {

    return this.getELBsByName(region, [name], function(err, list){
        if ( err ) {
            console.log("Error listing ELBs by name: ", err);
            return callback(err, null);
        }

        // Not found?
        if ( list.length == 0 ) {
            console.log("Couldn't find any ELB named '"+name+"'");
            return callback(null, null);
        }

        console.log("Found the ELB named '"+name+"', returning it!");
        return callback(null, list[0]);
    });

};


// Get the tag list for each of the specifiec ELB
exports.getELBTags = function(region, names, callback) {

    throw new Error("TODO: Implement me");

};
