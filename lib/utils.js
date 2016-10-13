"use strict";

exports.leftPad = function(num, strSize) {

    var
        len = num.toString().length;

    while ( len++ < strSize ) {
        num = "0" + num;
    }
    return num;

};