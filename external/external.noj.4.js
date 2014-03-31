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
    if(runs) running--;
    while(running < limit && addresses.length > 0){
        running++;
        collectData(addresses.shift());
    }
    if(running < 1 && addresses.length < 1 && writingHttp < 1){
        var urlsDone={};
        //console.dir(phantom.cookies);

        //console.dir(phantom.cookies);
        for(i=0;i< phantom.cookies.length;i++){
            if(false && phantom.cookies[i].domain.indexOf('.yellowpages.com') != 0 &&
                phantom.cookies[i].domain.indexOf('www.yellowpages.com') != 0) {
                console.dir(phantom.cookies[i]);
            }
            if(urlsDone[phantom.cookies[i].domain] == undefined){
                urlsDone[phantom.cookies[i].domain]=phantom.cookies[i].name;
            }else{
                urlsDone[phantom.cookies[i].domain]+=','+phantom.cookies[i].name;
            }
        }
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
    console.log(''+address.substring(domain.length));

    var t = Date.now();
    var page = webpage.create();
    var requests = [];
    var cookCount=0;

    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('FAIL to load the address');
        } else {
        }

        (page.close||page.release)();
        launcher(true);
    });
    page.onResourceRequested = function(data, request) {
        if(data.method && data.url.indexOf(domain) == 0){
            var curTim=Date.now()-t;
            curTim=curTim/1000.0;
            if(data.method == "POST"){
                console.log("\t"+data.url.substring(domain.length) +" method="+data.method+ ' contents="iid1=ca2b0cbf-98a2-40fb-b537-b3a3b94b51a0&lid1=6392693&moi1=119&poi1=1&srid1=a1840a1a-fe0e-4d2c-a26c-5d534bad9070&t1=listing&tol1=free&ypid1=6392693&iid2=3297dd3d-e071-4ffe-9385-abcafe3d5c63&lid2=20300840&moi2=119&poi2=2&srid2=01b7d509-301b-4f75-a56a-5ca5dec03688&t2=listing&tol2=free&ypid2=20300840&iid3=b004961e-5cf2-4a8b-b437-b898f1b8a4d7&lid3=470914749&moi3=119&poi3=3&srid3=192ce215-506b-40d9-b905-5f53b54725f8&t3=listing&tol3=free&ypid3=470914749&cp4=31&iid4=ad036c57-c08b-4522-999b-2006728643f1&lid4=7037824&moi4=123&poi4=1&srid4=7107ced9-8fc4-4710-b66a-95da8cf0fcad&t4=coupon&tol4=free&ypid4=7037824&cp5=31&iid5=8df00451-a851-4206-86ae-608213a08003&lid5=474129419&moi5=123&poi5=2&srid5=1a2f7e9a-4c61-49df-ab7c-76e5073f349d&t5=coupon&tol5=free&ypid5=474129419&cp6=31&iid6=37c557bb-0a7d-4da4-bbbf-39a1ebe04da0&lid6=474230131&moi6=123&poi6=3&srid6=dd77f423-3c01-457b-a6e5-557372e6562b&t6=coupon&tol6=free&ypid6=474230131&aid=webyp&eaid=YPU&rid=webyp-4e375e4d-2839-4fb5-88da-6dec484f4e46&enc=1&ptid=localhost&referrer=&ts=143b69897a5&ua=Mozilla%2F5.0+(X11%3B+Linux+x86_64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+Ubuntu+Chromium%2F31.0.1650.63+Chrome%2F31.0.1650.63+Safari%2F537.36&uip=127.0.0.1&url=http%3A%2F%2Flocalhost%3A3000%2F&v=100&version=1.0&vrid=7fc79ae1-f107-4bae-a50b-b312250c085b Response Headersview source"'+
                " think="+curTim);
            }else{
                console.log("\t"+data.url.substring(domain.length) + " think="+curTim);
            }
        }else{
            request.abort();
        }
    };
    page.onResourceReceived = function(response) {
        if(response.url.indexOf('impression')!=-1){
            //console.dir(response);
        }
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
