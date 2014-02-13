#!/usr/bin/env phantomjs

var util    = require('../common/util'),
    webpage = require('webpage'),
    system  = require('system'),
    fs      = require('fs'),
    args    = system.args.copyArgs();

function usage() {
    console.log('Usage: % <URL(s)>|<URL(s) file> --file outputFile [--runs #] [--limit #]'+
    '\n\t--file  - destination file for the httperf wsesslog file'+
    '\n\t--runs  - number of extra runs to preform'+
    '\n\t--limit - max concurrent runns to preform');
    phantom.exit();
}

if (system.args.length < 2) {
    usage();
}

var runns           = args.getArg(['-r','--runs'] , true) || 1;
var fileOutput      = args.getArg(['-f','--file'] , true) || '';
var limit           = parseInt(args.getArg(['--limit', '-l'], true)) || 5;
var addresses       = util.parsePaths(args.shift());
var excludes        = util.parsePaths(args.shift());
var running         = 1;

if( fileOutput === ''){
    usage();
}
//blank file before start
fs.write(fileOutput,'','w');

//a simple way to extend the number of times that we want to run
for(var i =0 ; i<runns-1;i++){
    addresses.push(addresses[i]);
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
    var session = '';
    var page    = require('webpage').create();
    var domain  = url.match("(^https?\:\/\/[^\/?#]+)(?:[\/?#]|$)")[1];
    var t       = Date.now();

    //debating dropping these lines they are only really needed when we are aborting requests
    page.onResourceError = function(resourceError) { };
    page.onError=function(error){ };

    //we do not care about the responce
    page.onResourceReceived = function(res){};

    page.onResourceRequested = function(requestData, request) {
        if(requestData.url.indexOf(domain)==0){
            var sesstring='';
            if(requestData.id !== 1){
                sesstring='\t';
            }
            sesstring+=requestData.url.substring(domain.length);
            if(requestData.method === "POST"){
                //this requires version 1.10 of phantomjs
                sesstring+=' method=POST content="'+requestData.postData+'"';
            }
            if(requestData.id !== 1){
                sesstring+=' think='+((Date.now()-t)/1000);
            }
            session+=sesstring+'\n';
        }
    };

    page.open(address, function(status) {
        if (status === 'success') {
            fs.write(fileOutput,session+'\n','a');
        } else {
            console.log('Unable to load the address!');
        }
        (page.close||page.release)();
        launcher(true);
    });
};
//Here we go!
launcher(true);

