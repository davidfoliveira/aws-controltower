var
    autoscaling = require('../../../lib/aws/autoscaling');

autoscaling.getAutoscalingGroup('eu-central-1', 'JacquardProd-JacquardDirectEuCentral1AutoScalingGroup-16GPUELWUZ74S', function(err,asg) {
	console.log(err);
	console.log(asg);
});
