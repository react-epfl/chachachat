#!/bin/sh

root="/chachachat"

cd $root
forever stop $root/server.js > /dev/null | exit 0
forever start --append --workingDir $root -p $root -l log/forever.log -o log/out.log -e log/err.log server.js
