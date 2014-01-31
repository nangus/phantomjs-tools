#!/usr/bin/env phantomjs
/***********************************************************
 * Author: @mervinej
 * Licence: MIT
 * Date: 11/27/2013
 *
 *  Run with:
 *
 *  $ phantomjs ./external.js ./urls.txt [./excluded.txt]
 *
 *  or
 *
 *  $ phantomjs ./external.js \
 *     "http://foo.com, http://foo.com/bar" \
 *     "exclude1.example.com, exclude2.example.com"
 *
 *  '--json' returns JSON output for parsing with Phapper
 *  (http://github.com/jmervine/phapper).
 *
 *  Note: As a bonus, I left the page timing as well from
 *  the example script I started this from.
 *
 ***********************************************************/

var webpage = require('webpage');
var system  = require('system');
var util    = require('../common/util.noj.1');
var args    = system.args.copyArgs();


function usage() {
    console.log('Usage: % <URL(s)>|<URL(s) file> [<EXCLUDE(s)|EXCLUDE(s) file>] [--json] [--mysql URL]');
    phantom.exit();
}

if (args.length === 0) {
    usage();
}

var json            = args.getArg(['--json', '-j'], false);
var abortExternal   = args.getArg(['--abort', '-a'], false);
var mysql           = args.getArg(['--mysql', '-m'], true);
var runs            = args.getArg(['-r'],['--runs'] , true) || 1;
var limit           = parseInt(args.getArg(['--limit', '-l'], true)) || 5;
var addresses       = util.parsePaths(args.shift());
var excludes        = util.parsePaths(args.shift());
var finished        = 0;

if (addresses.length === 0) {
    usage();
}

function flattenAndTallySuccesses(reqs) {
    var ret = [];
    reqs.forEach(function(req) {
        if (req.responded) {
            url = util.domain(req.url);
            var exists = false;
            var index = 0;
            ret.forEach(function(u) {
                if (u.url === url) {
                    exists = true;
                    ret[index].count++;
                }
                index++;
            });
            if (!exists) {
                ret.push({ referer: util.domain(req.referer), url: url, count: 1 });
            }
        }
    });
    return ret;
}

function flattenAndTallyFailures(reqs) {
    var ret = [];
    reqs.forEach(function(req) {
        if (!req.responded) {
            url = req.url;
            var exists = false;
            var index = 0;
            ret.forEach(function(u) {
                if (u.url === url) {
                    exists = true;
                    ret[index].count++;
                }
                index++;
            });
            if (!exists) {
                ret.push({ referer: util.domain(req.referer), url: url, count: 1 });
            }
        }
    });
    return ret;
}

var results     = [];
var running     = 1;
var writingHttp = 0;

function launcher(runs) {
    if(runs) running--;
    while(running < limit && addresses.length > 0){
        running++;
        collectData(addresses.shift());
    }
    if(running < 1 && addresses.length < 1 && writingHttp < 1){
        var urlsDone={};
        //console.dir(phantom.cookies);
        //console.dir(phantom.cookies);
        if (json) {
            //console.dir(results);
        }
        //console.dir(urlsDone);
        phantom.exit();
    }
}

function collectData(address) {
    excludes.push(util.domain(address));
    var domain=util.fullDomain(address);
    var t = Date.now();
    var page = webpage.create();
    var requests = [];
    var cookCount=0;

    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('FAIL to load the address');
        } else {
            t=Date.now()-t;
            console.log("page load time "+t)
        }
        (page.close||page.release)();
        launcher(true);
    });
    page.onError=function(error){ };
    page.onResourceRequested = function(data, request) {
        var tim=Date.now()-t;
        console.log(tim);
        if(abortExternal){
            if(data.method && (data.url.indexOf(domain) == 0 || -1 != data.url.indexOf('jquery.min.js'))){
                console.log('did not skip '+data.url)
            }else{
                console.log('did     skip '+data.url)
                console.log(data.url);
                request.abort();
            }
        }
    };
    page.onResourceError = function(resourceError) {
            console.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
            console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
    };
}
launcher(true);
