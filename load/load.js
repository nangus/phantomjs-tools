#!/usr/bin/env phantomjs
var util    = require('../common/util.noj.1'),
    webpage = require('webpage'),
    system  = require('system'),
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
var limit           = parseInt(args.getArg(['--limit', '-l'], true)) || 5;
var addressPasses   = util.parsePaths(args.shift());
var excludes        = util.parsePaths(args.shift());
var addresses       = [];
var running         = 1;
var runTime         = Date.now();
var requestCount    = 0;
var validRequest    = 0;
var invalidRequest  = 0;

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
        var tt=Date.now()-runTime;
        var rps=Math.round((requestCount/tt)*1000000)/1000;
        console.dir({"totalTime":tt,
            "requests":requestCount,
            "requestsPerSecond":rps,
            "validRequests":validRequest,
            "invalidRequests":invalidRequest,
            "requestsPerSecond":rps});
        phantom.exit();
    }
};


function collectData(address){
    var timers=[];
    requestCount++;
    var page = require('webpage').create();
    var domain=util.fullDomain(address);
    var t = Date.now();
    page.onResourceError = function(resourceError) { };
    page.onError=function(error){ };
    page.onResourceRequested = function(requestData, request) {
        //console.log("time ",(Date.now()-t));
        if(requestData.method && (requestData.url.indexOf(domain) == 0 || -1 != requestData.url.indexOf('jquery.min.js'))){
            if(-1 == requestData.url.indexOf('jquery.min.js')){
                timers[requestData.id]=Date.now();
                requestCount++;
            }
        }else{
            if(abortExternal){
                //console.log('Aborting: ' + requestData['url']);
                request.abort();
            }else{
                requestCount++;
            }
        }
    };
    page.onResourceReceived = function(res){
        if(res.url && timers[res.id]){
            if(res.status < 300){
                validRequest++;
            }else{
                invalidRequest++;
            }
            console.log(Date.now()-timers[res.id],"\t",res.status,"\t",res.url);
            //timers[res.id]=0;
            //console.log(Date.now()-timers[res.id])
            //console.log(res.status);
        }
        //console.dir(res);
        //console.log(res.id);
        //console.log(res.status);
    };
    page.open(address, function(status) {
        var tim=Date.now()-t;
        //console.log('completed in '+tim+' address '+address);
        if (status === 'success') {
        } else {
            console.log('Unable to load the address!');
        }
        (page.close||page.release)();
        launcher(true);
    });
};
launcher(true);

