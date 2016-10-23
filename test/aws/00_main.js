#!/usr/bin/env node

var aws = require('../../lib/aws');

console.log(JSON.stringify(aws.$('elb')))
console.log(JSON.stringify(aws.$('#jqd-Prod')))
console.log(JSON.stringify(aws.$('.ble.bli')))
try { console.log(aws.$('#jqd-Prod#jqd-Wtv')) } catch(ex){ console.log(ex); }
console.log(JSON.stringify(aws.$('elb#jqd-Prod.bla.bli')))
console.log(JSON.stringify(aws.$('elb.bla.bli')))
console.log(JSON.stringify(aws.$('elb#jqd-Prod.bla.bli .box.stuff')))
console.log(JSON.stringify(aws.$('elb#jqd-Prod.bla.bli > .box.stuff')))