wizard-duel-server
==============

This is wizard-duel-server.



Usage
-----

With installed [nodejs](https://nodejs.org) do
```
npm install
```
to install dependencies
and 
```
node wizard-duel-server.js
```
to run the server.

Server runs on port 9080 so you may use:
```
telnet localhost 9080
```
to test it; send there `{"type":"ping"}` message and you should receive `{"time":12345,"type":"pong"}`
