/**
 * 自定义事件分发器
 */
var eventDispatcher = new function(){
  this.events = {};

  this.dispatchEvent = function(eventType, data){
        var handlers = eventDispatcher.events[eventType];
      if(handlers && handlers instanceof Array && handlers.length > 0){
          handlers.forEach(function(handler){
              if(handler && typeof handler === "function"){
                  handler({data: data});
              }
          })
      }
  }

  this.on = function (type, handler){
      var handlers = eventDispatcher.events[type];
      if(!handlers){
          handlers = eventDispatcher.events[type] = [];
      }
      if(handlers.indexOf(handler) === -1){
          handlers.push(handler);
      }
  }

    this.un = function(type, handler){
        var handlers = eventDispatcher.events[type];
        if(handlers){
            if(!handler){
                handlers.length = 0;
            }else if(handlers.indexOf(handler) > -1){
               var index = handlers.indexOf(handler);
               handlers.splice(index, 1);
            }
        }
    }
};


window.eventDispatcher = window.eventDispatcher || eventDispatcher;