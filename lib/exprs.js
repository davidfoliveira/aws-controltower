"use strict";

var
    utils = require('./utils');


// Parses an expression
exports.parse = function(exprStr) {

    // Convert the $ function name
    exprStr = exprStr.replace(/\$\(/g,"self.$(input, ");

    // Convert + NUM% in *1.NUM
    exprStr = exprStr.replace(/\s*\+\s*(\d+)%/g,"*1.$1").replace(/\s*\-\s*(\d+)%/g,function(all,pct){ return "*"+((100-parseFloat(pct))/100)});

    return exprStr;
};


// Evaluates an expression and returns it's return value
exports.eval = function(expr, input) {
 
    var
        self = this;

    try {
        return eval(expr);
    }
    catch(ex) {
        console.log("Error evaluating expression '"+expr+"': ",ex);
        throw ex;
        return false;
    }
}


// Returns a new context (and concatenates the results)
function Context(type, value, vars, ALIASES) {

    var
        ctx = this;

    // Initializes the context data
    ctx._alias   = null;
    ctx._type    = type || "data";
    ctx._rset    = (type == "data")  ? (value || {})   : {};
    ctx._value   = (type == "value") ? (value || null) : null;
    ctx._vars    = vars  || {};

    /*
     The context functions
     */

    // Set the alias name
    ctx.alias = function(name) {
        this._alias = name;
        ALIASES[name] = this;
        return this;
    };

    // Context conversion to string (this is going to be used for arithmetic operators: > < ==, etc..)

    ctx.toString = function() {
        return (ctx._type == "data")  ? JSON.stringify(ctx.values()) :
               (ctx._type == "value") ? ctx.value :
               null;
    };

    // Context convert to number
    ctx.toNumber = function() {
        return (this._type == "data")  ? this.sum()._value :
               (this._type == "value") ? this._value :
               null;
    };
    ctx.valueOf = ctx.toNumber;

    // Returns the value of a variable
    ctx.getVar = function(varName) {
        return ctx._vars[varName];
    };

    // Return the list (array) of the moments
    ctx.moments = function() {
        return Object.keys(ctx._rset).sort().reverse();
    };

    // Return the list (array) of the values
    ctx.values = function() {
        var vals = [];
        ctx.moments().forEach(function(moment){
            vals.push(ctx._rset[moment]);
        });
        return vals;
    };

    // Get a moment value
    ctx.get = function(moment) {
        return ctx._rset[moment];
    };

    // Get a moment value
    ctx.set = function(moment, value) {
        ctx._rset[moment] = value;
        return value;
    };

    // Returns the average of the values
    ctx.average = function() {
        var
            moments = ctx.moments(),
            sum = 0;

        moments.forEach(function(moment){
            sum += ctx.get(moment);
        });
        console.log(ctx._vars.query+".average(): ",sum / moments.length);
        return new Context("value", sum / moments.length, ctx._vars, ALIASES);
    };

    // Sums all the values
    ctx.sum = function() {
        var
            sum = 0;

        ctx.moments().forEach(function(moment){
            sum += ctx.get(moment);
        });
        console.log(ctx._vars.query+".sum(): ",sum);
        return new Context("value", sum, ctx._vars, ALIASES);
    };

    // Slices data
    ctx.period = function(start, length) {
        var
            res = new Context("data", {}, ctx._vars, ALIASES),
            end = start + length;

        // Copy the samples
        ctx.moments().slice(start, end).forEach(function(moment){
            res.set(moment, ctx.get(moment));
        });
        res._vars.query += ".period("+start+","+length+")";

        return res;
    };

}


// Our selector function
exports.$ = function(input, query) {

    var
        initialQuery = query,
        STATS        = input.data,
        type         = "data";

    // A query type
    if ( query.match(/^(\w+):/) ) {
        type = RegExp.$1;
        query = query.replace(/^\w+:/,"");
    }

    if ( !query.match(/^([^ ]+?)(?:\@([\w\-]+))?$/) )
        throw new Error("Error parsing query $("+query+"). Expection type:name and got '"+query+"'");

    var
        name   = RegExp.$1,
        region = RegExp.$2 || input.region;

    // $("data:something")
    if ( type == "data" ) {
        if ( !STATS[region] )
            throw new Error("No data for region '"+region+"'.");
        if ( !STATS[region][name] )
            throw new Error("No data for metric '"+name+"' at '"+region+"'.");
        return new Context("data", STATS[region][name], {region: region, query: initialQuery}, input.aliases || {});
    }

    throw new Error("Unknown selector '"+type+":"+name+"'");
};