
/*!
 * Selenium
 * Copyright(c) 2010 LearnBoost (TJ Holowaychuk) <tj@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var http = require('http');

/**
 * Initialize a `Client` with the given `options`.
 * 
 * Options:
 *   
 *   - `host`     Hostname defaulting to localhost
 *   - `port`     Port number defaulting to 4444
 *   - `browser`  Browser name
 *   - `url`      URL string
 * 
 * @params {Object} options
 * @api public
 */

var Client = exports = module.exports = function Client(options) {
  this.host = options.host || 'localhost';
  this.port = options.port || 4444;
  this.browser = options.browser;
  this.url = options.url;
};

Client.prototype.command = function(name, args, fn){
  var client = http.createClient(this.port, this.host);
  var req = client.request('GET'
    , this.commandURL(name, args)
    , { Host: this.host + (this.port ? ':' + this.port : '') });
  req.on('response', function(res){
    console.dir(res.statusCode)
    res.body = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk){ res.body += chunk; });
    res.on('end', function(){
      if (res.body.indexOf('ERROR') === 0) {
        fn(new Error(res.body), res);
      } else {
        fn(null, res);
      }
    });
  });
  req.end();
};

Client.prototype.commandURL = function(name, args){
  args = args.map(function(arg, i){
    return i + 1 + '=' + encodeURIComponent(arg);
  }).join('&');
  return '/selenium-server/driver/?cmd=' + name + '&' + args;
};

/**
 * Shortcut for `new selenium.Client()`.
 *
 * @param {Object} options
 * @return {Client}
 * @api public
 */

exports.createClient = function(options){
  return new Client(options);
};