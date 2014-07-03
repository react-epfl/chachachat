#!/bin/sh

forever start --append -p /chachachat -l log/forever.log -o log/out.log -e log/err.log /chachachat/server.js
