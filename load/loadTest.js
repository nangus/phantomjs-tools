#!/usr/bin/env phantomjs
var util    = require('../common/util'),
    webpage = require('webpage'),
    system  = require('system'),
    os      = require('os'),
    args    = system.args.copyArgs();


function usage() {
    console.log('Usage: % <URL(s)>|<URL(s) file> [<EXCLUDE(s)|EXCLUDE(s) file>] [--json] [--mysql URL]');
    phantom.exit();
}

if (system.args.length < 2) {
    usage();
}

var runns           = args.getArg(['-r','--runs'] , true) || 1;
var abortExternal   = args.getArg(['-a','--abort'], false);
var limit           = parseInt(args.getArg(['--limit', '-l'], true)) || os.cpu.length;
var addressPasses   = util.parsePaths(args.shift());
var excludes        = util.parsePaths(args.shift());
var addresses       = [];
var running         = 1;

for(var i =0 ; i<runns;i++){
    addresses=addresses.concat(addressPasses);
}

function launcher(runs) {
    if(runs) running--;
    while(running < limit && addresses.length > 0){
        running++;
        collectData(addresses.shift());
    }
    if(running < 1 && addresses.length < 1 ){
        phantom.exit();
    }
};

function collectData(address){
    var page = require('webpage').create();
    var domain=util.fullDomain(address);
    var t = Date.now();

    page.onResourceError = function(resourceError) { };
    page.onError=function(error){ };

    page.onResourceRequested = function(requestData, request) {
        //console.log("time ",(Date.now()-t));
        if(requestData.method && (requestData.url.indexOf(domain) == 0 || -1 != requestData.url.indexOf('jquery.min.js'))){
        }else{
            if(abortExternal){
                //console.log('Aborting: ' + requestData['url']);
                request.abort();
            }
        }
    };

    page.open(address, function(status) {
        var tim=Date.now()-t;
        console.log('completed in '+tim+' address '+address);
        if (status === 'success') {
        } else {
            console.log('Unable to load the address!');
        }
        (page.close||page.release)();
        launcher(true);
    });

};
launcher(true);

