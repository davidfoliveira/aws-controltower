"use strict";

var
    aws         = require('../../aws');


// The global resource select function
exports.select = function(region, selector, callback) {

    return callback(null, [{something: "here"}]);

};
