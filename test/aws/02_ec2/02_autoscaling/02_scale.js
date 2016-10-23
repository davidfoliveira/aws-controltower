var
    autoscaling = require('../../../../lib/aws/ec2/autoscaling');

autoscaling.scale('eu-west-1', ['JacquardPreProd-JacquardDirectEuWest1AutoScalingGroup-193UO71ZHICH2'], '+20%', {dryRun: true}, function(err, res) {
	console.log(err);
	console.log(res);
});


// autoscaling.scale('eu-central-1', [{ AutoScalingGroupName: 'JacquardPreProd-JacquardDirectEuWest1AutoScalingGroup-193UO71ZHICH2', DesiredCapacity: 234 }], '10%', function(err, res) {
// 	console.log(err);
// 	console.log(res);
// });

// autoscaling.scale('eu-central-1', { AutoScalingGroupName: 'JacquardPreProd-JacquardDirectEuWest1AutoScalingGroup-193UO71ZHICH2', DesiredCapacity: 234 }, '10%', function(err, res) {
// 	console.log(err);
// 	console.log(res);
// });
