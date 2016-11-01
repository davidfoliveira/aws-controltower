#!/usr/bin/env node

var aws = require('../../lib/aws');

console.log(JSON.stringify(aws.$('elb@eu-central-1')))
console.log(JSON.stringify(aws.$('#jqd-Prod@eu-west-1')))
console.log(JSON.stringify(aws.$('.ble.bli')))
try { console.log(aws.$('#jqd-Prod#jqd-Wtv')) } catch(ex){ console.log(ex); }
console.log(JSON.stringify(aws.$('elb#jqd-Prod.bla.bli')))
console.log(JSON.stringify(aws.$('elb.bla.bli')))
console.log(JSON.stringify(aws.$('elb#jqd-Prod.bla.bli .box.stuff')))
console.log(JSON.stringify(aws.$('elb#jqd-Prod.bla.bli > .box.stuff')))

aws.getResources(aws.$("elb"), function(err, res){
	if ( err ) {
		console.log("Error getting all elbs");
		return process.exit(-1);
	}
	console.log(res);
	return process.exit(0);
});
