#!/bin/bash
rand=$RANDOM
for i in {1..24}; do 
    ./load/load.js 'http://ypcd4.np.wc1.yellowpages.com:3000/atlanta-ga/massage-therapists' -a --runs 15 --limit 10 > $rand.$i.out&
done
wait
cat $rand.*.out > $rand.out
rm $rand.*.out
grep requestsPerSecond $rand.out|awk '{total+=$2} END {print total}'
grep invalidRequests $rand.out|awk '{total+=$2} END {print total}'
grep \[^n\]validRequests $rand.out|awk '{total+=$2} END {print total}'
