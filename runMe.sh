#!/bin/bash
rand=$RANDOM
for i in {1..24}; do 
    ./load/load.js 'http://ypcd4.np.wc1.yellowpages.com/atlanta-ga/message' -a --runs 20 --limit 10 > $rand.$i.out&
done
wait
cat $rand.*.out > $rand.out
rm $rand.*.out
grep requestsPerSecond $rand.out|awk '{total+=$2} END {print total}'
