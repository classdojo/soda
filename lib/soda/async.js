var Queue = require("./queue");

exports.forEach = function(arrayOrCount, each, done) {

  var count, stack;

  if(typeof arrayOrCount == "number") {
    count = arrayOrCount;
  } else {
    count = arrayOrCount.length;
    stack = arrayOrCount;
  }

  var numRunning = count,
  called = false;

  function onDone() {
    if(called) return;
    called = true;
    done.apply(null, arguments);
  }

  for(var i = count; i--;) {
    each(stack ? stack[i] : i, function(err) {
      if(err) {
        return onDone(err);
      }
      if(!--numRunning) onDone();
    });
  }
}


exports.forEachSeries = function(arrayOrCount, each, done) {
  var q = new Queue();
  exports.forEach(arrayOrCount, function(item, next) {
    q.add(function(err, nextItem) {
      each(item, function() {
        next.apply(this, arguments);
        nextItem();
      });
    }); 
  }, done);
}

exports.map = function(count, each, done) {
  var map = [];
  exports.forEach(count, function(i, next) {
    each(i, function(err, item) {
      if(err) return next(err);
      map.push(item);
      next();
    })
  }, function(err) {
    if(err) return done(err);
    done(err, map);
  });
}