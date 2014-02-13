#!/usr/bin/env phantomjs

var util    = require('../common/util'),
    webpage = require('webpage'),
    system  = require('system'),
    args    = system.args.copyArgs();

function usage() {
    console.log('Usage: % <URL(s)>|<URL(s) file>');
    phantom.exit();
}

if (system.args.length < 2) {
    usage();
}

var addr = args.shift();
var page    = require('webpage').create();
page.open(addr, function(status) {
    if (status === 'success') {
        var result=page.evaluate( function(){
            return document.querySelector('a.mip-link').getAttribute('href');
        });
        console.log(result);
    } else {
        console.log('Unable to load the address!');
    }
    (page.close||page.release)();
    phantom.exit();
});

