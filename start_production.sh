#!/bin/sh

/usr/local/share/npm/bin/forever start --append -p /chachachat -l log/forever.log -o log/out.log -e log/err.log server.js