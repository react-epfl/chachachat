#!/bin/sh

mongod &
redis-server /usr/local/etc/redis.conf &
node server.js