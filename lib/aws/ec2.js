"use strict";

// Read the submodules
['elb', 'autoscaling', 'instances'].forEach(function(mod){
    exports[mod] = require('./ec2/'+mod);
});

