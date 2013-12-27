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

var page=require('webpage').create();
page.customHeaders={'Content-Type':'application/json'};
var callback=function(status){
    if(timer)window.clearTimeout(timer);
    if (status=='success' || status=='timedout') {
        console.log(page.plainText);
    }else{
        console.log('Failed to load.');
    }
    phantom.exit();
};
var timer=window.setTimeout(callback,5000,'timedout');
var url="http://localhost:5212";
var data={"address":"http://m.yp.com/10016/Collection%2018?q=Collection+18&page=6&g=10016","complete":2009,"requests":[{"url":"i3.ypcdn.com","count":14,"successful":true},{"url":"358100429.log.optimizely.com","count":3,"successful":true},{"url":"c.ypcdn.com","count":2,"successful":true},{"url":"metric.yp.com","count":1,"successful":true},{"url":"www.google-analytics.com","count":1,"successful":true},{"url":"b.scorecardresearch.com","count":1,"successful":true}]};
page.open(url,'post',JSON.stringify(data),callback);
