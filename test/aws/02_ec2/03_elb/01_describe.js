var
    elb = require('../../../../lib/aws/ec2/elb');

elb.getELBsByName('eu-central-1', [], function(err,asg) {
	console.log(err);
	console.log(asg);
});
