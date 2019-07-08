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



Session testing and reconnection
-----
In your telnet session try few messages:
```
{"type":"ping"}

{"type":aeta{dg}}

{"type":"unknownMessage"}
```
Now kill the telnet connecton (ctrl+']' & ctrl+d)

reconnect with the old sessionId: connect and send message:
```
{"type":"rejoinSession","sessionId":"8be3dfc36d268f8fb51c20b04a9e1000390392e8"}
```
Your context should be as you left it.