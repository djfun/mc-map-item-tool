mc-map-item-tool [![Build Status](https://travis-ci.org/djfun/mc-map-item-tool.png?branch=master)](https://travis-ci.org/djfun/mc-map-item-tool)
================

[nodejs](http://nodejs.org) webtool for converting images to Minecraft map items.

Other code/libraries used: [jquery](http://jquery.com/), [bootstrap](http://twitter.github.com/bootstrap/), [Colour.js](http://stevehanov.ca/blog/index.php?id=116), [cookies.js](https://github.com/ScottHamper/Cookies), [node-nbt](https://github.com/djfun/node-nbt), [archiver](https://github.com/ctalkington/node-archiver), [babel](https://github.com/babel/babel), [lazystream](https://github.com/jpommerening/node-lazystream), [moment](https://github.com/moment/moment), [node-static](https://github.com/cloudhead/node-static)

How to setup and run your own server
------------------------------------
1. Get and install [nodejs](http://nodejs.org)
2. Download the files from this repository
3. Use `npm install` to get the dependencies
4. Optional: Run the tests with `npm test`
5. Run the build process with `npm run build`
6. Optional: Copy `public/`, `lib/` and `package.json` to your server machine and run `npm install --production` there
7. Start the server with `npm start`

If you don't need your own server, you can just use my instance at [http://mc-map.djfun.de](http://mc-map.djfun.de).


License
-------
mc-map-item-tool is licensed under the MIT license.


Tests
-----
Run client and server tests with

    npm test
