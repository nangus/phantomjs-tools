#!/usr/bin/env phantomjs

var util    = require('../common/util'),
    webpage = require('webpage'),
    system  = require('system'),
    fs      = require('fs'),
    args    = system.args.copyArgs();


function usage() {
    console.log('Usage: % <URL(s)>|<URL(s) file> --file outputFile [--runs #]'+
    '\n\t--file  - destination file for the httperf wsesslog file'+
    '\n\t--runs  - number of extra runs to preform');
    phantom.exit();
}

if( phantom.version.major <=1 && phantom.version.minor<10){
    console.log('generate session log requires a minium phantomjs version of 1.10');
    usage();
}

if (system.args.length < 2) {
    usage();
}

var runns           = args.getArg(['-r','--runs'] , true) || 1;
var fileOutput      = args.getArg(['-f','--file'] , true) || '';
var limit           = 1;
var addresses       = util.parsePaths(args.shift());
var running         = 1;
var failures        = 0;

if( fileOutput === ''){
    usage();
}
//blank file before start
//fs.write(fileOutput,'','w');

//a simple way to extend the number of times that we want to run
for(var i =0 ; i<runns-1;i++){
    addresses.push(addresses[i]);
}

function launcher(runs) {
    if(failures>5){
        phantom.exit(1);
    }
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
    var session = '';
    var page    = require('webpage').create();
    var domain  = address.match("(^https?\:\/\/[^\/?#]+)(?:[\/?#]|$)")[1];
    var tim     = Date.now();
    page.settings.resourceTimeout = 10000;
    phantom.clearCookies();
    console.log('generating list for '+address);

    //debating dropping these lines they are only really needed when we are aborting requests
    page.onResourceError = function(resourceError) { };
    page.onError=function(error){ };

    //we do not care about the responce
    page.onResourceReceived = function(res){};

    page.onResourceRequested = function(requestData, request) {
        if(requestData.url.indexOf(domain)==0 && requestData.url.indexOf('images') === -1){
            var sesstring='';
            if(requestData.id !== 1){
                sesstring='\t';
            }
            sesstring+=requestData.url.substring(domain.length);
            if(requestData.method === "POST"){
                //this requires version 1.10 of phantomjs
                sesstring+=' method=POST contents="'+requestData.postData+'"';
            }
            if(requestData.id !== 1){
                sesstring+=' think='+((Date.now()-tim)/1000);
            }
            session+=sesstring+'\n';
        }
    };

    page.open(address, function(status) {
        if (status === 'success') {
            fs.write(fileOutput,session+'\n','a');
        } else {
            console.log('Unable to load the address!');
            failures++;
            addresses.push(address);
        }
        (page.close||page.release)();
        launcher(true);
    });
};
//Here we go!
launcher(true);

