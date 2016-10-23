"use strict";

// Read the submodules
['elb', 'autoscaling'].forEach(function(mod){
    exports[mod] = require('./ec2/'+mod);
});

