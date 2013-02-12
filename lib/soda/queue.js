var Queue = module.exports = function() {
  this.stack = [];
}


Queue.prototype.add = function(fn) {
  var self = this;

  this.stack.push(function(err) {
    function onDone(err) {
      if(self.stack.length) {
        self.stack.shift()(err); 
      } else {
        self._running = false;
      }
    }
    
    try {
      fn(err, onDone);
    } catch(e) {
      onDone(e);
    }
  });


  if(!this._running) {
    this._running = true;
    this.stack.shift()();
  }

  return this;
}


Queue.prototype.before = function(fn) {
  var n = this.stack.length;
  fn();
  var newItems = this.stack.splice(n, this.stack.length);
  this.stack = newItems.concat(this.stack);
}




