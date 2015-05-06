#!/bin/sh

root="/chachachat"

cd $root
forever stop $root/server.js > /dev/null | exit 0
forever start --append -p $root -l $root/log/forever.log -o $root/log/out.log -e $root/log/err.log $root/server.js
