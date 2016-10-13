#!/usr/bin/env node

var
    fs    = require('fs'),
    CONF  = require('../conf/controltower.conf'),
    exprs = require('../lib/exprs');

// Parse trigger expressions
CONF.triggers.forEach(function(t){
    if ( t.expr )
        t._expr = exprs.parse(t.expr);
    if ( t.action )
        t._action = exprs.parse(t.action);
});

// Read the data file
var data = fs.readFileSync('./test/data/stats.json','utf-8');
var STATS = JSON.parse(data);
var REGION = "eu-west-1";

// Evaluate some expressions
//console.log(exprs.$({data: STATS, region: REGION}, "requests@eu-west-1").average());

// Evaluate every expression in the configuration
CONF.triggers.forEach(function(trigger){
    if ( !trigger._expr || !trigger._action ) {
        console.log("No trigger expr/action on trigger, ignoring...");
        return;
    }

    // Evaluate
    trigger._lastRV = eval(trigger._expr);
    console.log(trigger._expr+"  => "+trigger._lastRV);
});
