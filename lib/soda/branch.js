Queue = require("./queue"),
async = require("./async");

/**
 */

var Branch = module.exports  = function(options) {

  this.parent   = options.parent;
  this.commands = options.commands;
  this.index    = options.index || 1;
  this.selector = options.selector;
  this.multiple = options.multiple;

  this._prepare();
}


/**
 */

Branch.prototype._prepare = function() {

  var self = this;

  //add all the commands registered with soda
  this.commands.forEach(function(command) {
    self[command] = self._getCommand(command);
  });
}


/**
 */

Branch.prototype._getCommand = function(command) {
  var self = this;
  return function() {
    var args = Array.prototype.slice.call(arguments), orgFn, fn, root = self.root(),
    orgFn;


    if(typeof args[args.length - 1] == "function") {
      orgFn = args.pop();
    } else {
      orgFn = function () { };
    }



    root.
    next(function(err, next) {
      self.getSelectors(function(err, selectors) {
        if(err) return next(err);
        async.forEachSeq(selectors, function(selector, next) {
          root[command + "Async"].apply(root, [selector].concat(args).concat(function(err, text) {
            if(err) return next(err);
            orgFn(text);
            next();
          }));
        }, next);
      });
    });


    

    return self;
  }
}

var findElementsBrowserFn = function() {
  var ret = selenium.browserbot.locateElementsByXPath('[PATH]', selenium.browserbot.getDocument()).toArray();
  var paths = [];

  for(var i = ret.length; i--;) {
    var p = ret[i],
    c = p,
    ci = 0,
    path = [];

    while(p) {
      c = p;
      ci = 1;

      while((c = c.previousSibling) != null) 
        if(c.localName == p.localName)
          ci++;

      if(p.nodeName == "HTML") break;

      path.unshift(p.nodeName.toLowerCase() + "["+ci+"]");

      p = p.parentNode;
    }

    paths.push(path.join("/"));
  }

  return JSON.stringify(paths);
}


function findElement(selector, callback) {
  return function(browser) {
    browser.
    getEvalAsync("("+String(findElementsBrowserFn).replace('[PATH]',selector.replace(/['"]+/g,'\\\''))+")()", function(err, text) {
      if(err) return callback(err);
      callback(null, JSON.parse(text).map(function(path) {
        return "//" + path;
      }));
    })
  }
}


/**
 */

Branch.prototype.getSelectors = function(callback) {

  var self = this, allSelectors = [], root = this.root();

    self.parent.getSelectors(function(err, selectors) {
        if(err) return callback(err);


        async.forEachSeq(selectors, function(selector, next) {
          var thisSelector = selector + "//" + self.selector;
          root.
          and(findElement(thisSelector, function(err, selectors) {
              if(err) return next(err);
              allSelectors = allSelectors.concat(selectors);
              next();
          }));

        }, function(err) {
          callback(err, allSelectors);
        });
    });
}

/**
 */

Branch.prototype.path = function() {
  return this.parent.path() + "//" + this.selector;
}


/**
 */

Branch.prototype.root = function() {
  var p = this;
  while(p.parent) {
    p = p.parent;
  }
  return p;
}

var methods = ["end", "nextSuccess", "next", "nextError", "before"];

methods.forEach(function(method) {
  Branch.prototype[method] = function() {
    var r = this.root();
    r[method].apply(r, arguments);
    return this;
  }
});



/** 
 * join back with the parent element
 */

Branch.prototype.join = function() {
  return this.parent;
}


Branch.mixin = function(prototype) {
  /**
   */

  prototype.element = function(selector) {
    return this._branch(selector, false);
  }

  /**
   */

  prototype.elements = function(selector) {
    return this._branch(selector, true);
  }


  /**
   */

  if(!prototype.path)
  prototype.path = function() {
    return this.selector || "";
  }


  /**
   */

  if(!prototype.getSelectors)
  prototype.getSelectors = function(done) {
    done(null, [""]);
  }

  /**
   */

  prototype._branch = function(selector, multiple) {
    return new Branch({
      parent   : this,
      commands : this.commands,
      selector : selector,
      multiple : multiple
    });
  }

}


Branch.mixin(Branch.prototype);
