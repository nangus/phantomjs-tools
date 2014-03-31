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
    console.log('Usage: external.js <URL(s)>|<URL(s) file> [<EXCLUDE(s)|EXCLUDE(s) file>] [--json] [--mysql URL]');
    phantom.exit();
}

if (args.length === 0) {
    usage();
}

var json        = args.getArg(['--json', '-j'], false);
var mysql       = args.getArg(['--mysql', '-m'], true);
var limit       = parseInt(args.getArg(['--limit', '-l'], true)) || 5;
var addresses   = util.parsePaths(args.shift());
var excludes    = util.parsePaths(args.shift());
var finished    = 0;

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
    console.log('running '+running+ ' writingHttp ' + writingHttp + ' runs '+runs);
    if(runs) running--;
    while(running < limit && addresses.length > 0){
        running++;
        collectData(addresses.shift());
    }
    if(running < 1 && addresses.length < 1 && writingHttp < 1){
        if (json) {
            console.dir(results);
        }
        phantom.exit();
    }
}

function collectData(address) {
    excludes.push(util.domain(address));

    var t = Date.now();
    var page = webpage.create();
    var requests = [];

    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('FAIL to load the address');
        } else {
            t = Date.now() - t;

            var successes = flattenAndTallySuccesses(requests).sort(util.reqSort);
            var failures  = flattenAndTallyFailures(requests).sort(util.reqSort);

            if (mysql) {
                writingHttp++;
                util.doJSON(address, t, successes, failures, function(res) {
                    util.pushMysql(mysql,res);
                });
            } else if (json) {
                util.doJSON(address, t, successes, failures, function(res) {
                    results.push(res);
                });
            } else {
                util.doTEXT(address, t, successes, failures, function(res) {
                    res.forEach(function(url) {
                        console.log('* ' + url.referer + '\n  -> ' + url.url + ' [' + url.count + ']');
                    });
                });
            }
        }

        (page.close||page.release)();
        launcher(true);
    });
    page.onResourceRequested = function(data, request) {
        if (!util.isLocal(excludes, data.url)) {
            requests.push({ referer: util.referer(data.headers), url: data.url, id: data.id });
        }
    };

    page.onResourceReceived = function(response) {
        if (!util.isLocal(excludes, response.url)) {
            var index = 0;
            requests.forEach(function(request) {
                if (request.url === response.url && request.id === response.id) {
                    requests[index].responded = true;
                }
                index++;
            });
        }
    };
}

launcher(true);
