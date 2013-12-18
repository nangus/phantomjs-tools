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

var util      = require('../common/util');
var webpage   = require('webpage');
var system    = require('system');
var finished  = 0;

/***********************************************************
 * Add any domains you wish to exclude to this array.
 *
 * Domains added to this Array will be excluded in addition
 * to an domains passed through the second argument.
 ***********************************************************/
var local_domains = [
    // domains to be excluded, e.g.:
    // "www.example.com"
];

function usage() {
    console.log('Usage: external.js <URL(s)>|<URL(s) file> [<EXCLUDE(s)|EXCLUDE(s) file>] [--json]');
    phantom.exit();
}

if (system.args.length === 1) {
    usage();
}

// remove unimportant args
var jsonIndex = system.args.indexOf('--json');
var json = (jsonIndex !== -1);
var args = [];
var i = 0;
system.args.forEach(function(arg) {
    if (i !== 0 && i !== jsonIndex) {
        args.push(arg);
    }
    i++;
});

// parse urls
var addresses = util.parsePaths(args[0]);

// parse excludes
local_domains = local_domains.concat(util.parsePaths(args[1]));

if (!addresses || addresses.length === 0) {
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
                ret.push({ url: url, count: 1 });
            }
        }
    });
    return ret;
}

function flattenAndTallyFailures(reqs) {
    var ret = [];
    reqs.forEach(function(req) {
        if (!req.responded) {
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
                ret.push({ url: url, count: 1 });
            }
        }
    });
    return ret;
}

var results = [];
var limit   = 15;
var running = 1;

function launcher(){
    running--;
    while(running < limit && addresses.length > 0){
        running++;
        collectData(addresses.shift());
    }
    if(running < 1 && addresses.length < 1){
        if (json) {
            console.dir(results);
        }
        phantom.exit();
    }
}

function collectData(address) {
    local_domains.push(util.domain(address));

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

            if (json) {
                util.doJSON(address, t, successes, failures, function(res) {
                    results.push(res);
                });
            } else {
                util.doTEXT(address, t, successes, failures, function(res) {
                    res.forEach(function(url) {
                        console.log('* ' + url.url + ' [' + url.count + ']');
                    });
                });
            }
        }

        (page.close||page.release)();
        launcher();
    });

    page.onResourceRequested = function(data, request) {
        if (!util.isLocal(data.url)) {
            requests.push({ url: data.url, id: data.id });
        }
    };

    page.onResourceReceived = function(response) {
        if (!util.isLocal(response.url)) {
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

launcher();
