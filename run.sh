#!/bin/bash

if [ `uname` == "Darwin" ]; then
	( sleep 1; open http://localhost:8000/ ) &
else
	echo 'Browse to http://localhost:8000/'
fi
python -m SimpleHTTPServer 2>/tmp/scrollanim$$.tmp >&2 && rm /tmp/scrollanim$$.tmp && exit
if [ `grep KeyboardInterrupt /tmp/scrollanim$$.tmp | wc -l` -eq 0 ]; then
	cat /tmp/scrollanim$$.tmp
fi
rm /tmp/scrollanim$$.tmp
