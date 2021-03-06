define([],function(){

    function CreateKObservableArray(name,parent,scope)
    {
        var _arr = [],
            _subscribers = {},
            /* Need to simplify this */
            _actions = {
                splice:[],
                postsplice:[],
                push:[],
                postpush:[],
                pop:[],
                postpop:[],
                shift:[],
                postshift:[],
                unshift:[],
                postunshift:[],
                fill:[],
                postfill:[],
                reverse:[],
                postreverse:[],
                sort:[],
                postsort:[],
                add:[],
                postadd:[],
                set:[],
                postset:[],
                remove:[],
                postremove:[],
                subscribe:[],
                unsubscribe:[],
                addDataListener:[],
                removeDataListener:[],
                addDataUpdateListener:[],
                removeDataUpdateListener:[],
                addDataCreateListener:[],
                removeDataCreateListener:[],
                addDataRemoveListener:[],
                removeDataRemoveListener:[]
            },

            /* Action/method based events to alter the action being performed */
            _onaction = function(a)
            {
                for(var x=0,_curr=_actions[a.type],len=_curr.length;x!==len;x++)
                {
                    _curr[x](a);
                    if(a._stopPropogration) break;
                }
                return a._preventDefault;
            },

            _loopEvents = function(events,e)
            {
                if(!e._stopPropogration && events)
                {
                for (var x = 0, len = events.length; x !== len; x++) {
                    events[x](e);
                    if (e._stopPropogration) break;
                }
                }
            },

            /* Data based events to alter the data being set */
            _onevent = function(e)
            {
                var _local = e.local[e.listener];
                    if(isObject(_local))
                    {
                      _loopEvents(_local[e.key],e);
                      
                      if(e.listener === '__kblisteners')
                      {
                        _loopEvents(_local['*'],e);
                        
                        e.fromListener = '__kblisteners';
                        e.listener = '__kbparentlisteners';
                        
                        _loopEvents(e.local[e.listener][e.key],e);
                        _loopEvents(e.local[e.listener]['*'],e);
                        
                      }
                      else if(e.listener === '__kbupdatelisteners')
                      {
                         _loopEvents(_local['*'],e);
                        
                        e.fromListener = '__kbupdatelisteners';
                        e.listener = '__kbparentupdatelisteners';
                        
                        _loopEvents(e.local[e.listener][e.key],e);
                        _loopEvents(e.local[e.listener]['*'],e);
                        
                      }
                    }
                    else if(isArray(_local))
                    {
                       _loopEvents(_local,e);
                       _loopEvents(_local['*'],e);
                    }
                    return e._preventDefault;
            };

        /* Event Objects */
        function eventObject(arr,key,action,value,oldValue,args,listener,stopChange)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.local = arr;
            this.key = key;
            this.arguments = args;
            this.type = action;
            this.listener = listener;
            this.name = arr.__kbname;
            this.root = arr.__kbref;
            this.scope = arr.__kbscopeString;
            this.parent = arr.___kbImmediateParent;
            this.value = value;
            this.oldValue = oldValue;
            this.stopChange = stopChange;
        }

        function actionObject(type,prop,ev,args)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.type = type;
            this.key = prop;
            this.event = ev;
            this.args = args;
        }

        /* Main Listening methods */
        function addListener(type,listener)
        {
            var _listeners = _arr[listener];
            return function(prop, func) 
            {
                var e = new eventObject(this, (isObject(_listeners) ? prop : ""), type, (isObject(_listeners) ? this[prop] : ""), (isObject(_listeners) ? this[prop] : ""), arguments, listener),
                    a = new actionObject(type, (isObject(_listeners) ? prop : ""), e, arguments),
                    c;
                if (_onaction(a) !== true) {
                    if(isObject(_listeners))
                    {
                        if(_listeners[a.key] === undefined) _listeners[a.key] = [];
                        c = _listeners[a.key];
                        c.push(a.args[1]);
                    }
                    else if(isArray(_listeners))
                    {
                        if(_listeners['*'] === undefined) _listeners['*'] = [];
                        c = (a.args[1] && a.args[1] === '*' ? _listeners['*'] : _listeners);
                        c.push(a.args[0]);
                    }
                }
                return this;
            }
        }

        function removeListener(type,listener)
        {
            var _listeners = _arr[listener];
            return function(prop,func)
            {
                var e = new eventObject(this,prop,type,this[prop],this[prop],arguments,listener),
                    a = new actionObject(type,prop,e,arguments),
                    c;

                if(_onaction(a) !== true)
                {
                    if(isObject(_listeners))
                    {
                        c = _listeners[a.key];
                        if(c)
                        {
                            for(var x=0,len=c.length;x<len;x++)
                            {
                                if(c[x].toString() === a.args[1].toString())
                                {
                                    c.splice(x,1);
                                    return this;
                                }
                            }
                        }
                    }
                    else if(isArray(_listeners))
                    {
                        if(_listeners['*'] === undefined) _listeners['*'] = [];
                        c = (a.args[1] && a.args[1] === '*' ? _listeners['*'] : _listeners);
                        for(var x=0,len=c.length;x<len;x++)
                        {
                            if(c[x].toString() === a.args[0].toString())
                            {
                                c.splice(x,1);
                                return this;
                            }
                        }
                    }
                }
                return this;
            }
        }

        function addActionListener(action,func)
        {
            if(Object.keys(_actions).indexOf(action) !== -1)
            {
                _actions[action].push(func);
            }
            else
            {
                console.error('There is no action listener by the name: ',action);
            }
            return this;
        }

        function removeActionListener(action,func)
        {
            if(Object.keys(_actions).indexOf(action) !== -1)
            {
                for(var x=0,_curr=_actions[action],len=_curr.length;x!==len;x++)
                {
                    if(_curr[x].toString() === func.toString())
                    {
                        _curr.splice(x,1);
                        return this;
                    }
                }
            }
            else
            {
                console.error('There is no action listener by the name: ',action);
            }
            return this;
        }

        /* Helpers */
        function isObject(v)
        {
            return (typeof v === 'object' && !!v && (v.constructor.toString() === Object.toString()));
        }

        function isArray(v) 
        {
            return (typeof v === 'object' && !!v && (v.constructor.toString() === Array.toString()));
        }

        function isObservable(obj,prop)
        {
            return (Object.getOwnPropertyDescriptor(obj,prop).value === undefined);
        }

        /* Additional functionality */
        function prototype(prop,value)
        {
          if(this[prop] === undefined)
          {
              Object.defineProperty(this.__proto__,prop,setDescriptor(value,true,true));
          }
          else
          {
            console.error('Your attempting to add your prototype with the prop: ',prop,' that already exists');
          }
          return this;
        }

        function stringify()
        {
            var cache = [];
            return JSON.stringify(this,function(key, value) {
                if(isArray(value) || isObject(value)) 
                {
                    if (cache.indexOf(value) !== -1)
                    {
                        return;
                    }
                    cache.push(value);
                }
                return value;
            });
        }

        /*Event based functionality */
        function splice(index,remove,insert)
        {
            var e = new eventObject(this,index,'splice',this[index],undefined,arguments,'__kbdatadeletelisteners'),
                a = new actionObject('splice',index,e,arguments);
            if(_onaction(a) !== true)
            {
                var _ret = [],
                _inserts = Array.prototype.slice.call(arguments),
                _insertLen = (_inserts.length-2),
                _index = 0;
              
                _inserts.splice(0,2);

                if(remove !== 0 && this[((a.key-1)+a.args[1])] !== undefined)
                {
                    for(var x=0,len=a.args[1];x<len;x++)
                    {
                        _index = a.key;
                      
                        e.key = _index;
                        e.type = 'remove';
                        e.value = this[_index];
                        a.type = 'remove';
                      
                        if(_onaction(a) !== true && _onevent(e) !== true)
                        {
                            _ret.push(this[_index]);
                            for(var i=a.key,lenI=(this.length-1);i<lenI;i++)
                            {
                                this[i] = this[(i+1)];
                            }
                            this.length = (this.length-1);
                            a.type = 'postremove';
                            _onaction(a);
                        }
                        else
                        {
                            a.args[1] -= 1;
                        }
                    }
                }
                if(_insertLen !== 0)
                {
                    for(var x=0,len=_insertLen;x<len;x++)
                    {
                        _index = (a.key+(Math.min(1,x)));

                        e.key = _index;
                        e.type = 'add';
                        e.listener = '__kbdatacreatelisteners';
                        e.value = _inserts[x];
                        a.type = 'add';
                        a.key = _index;

                        if(_onaction(a) !== true && _onevent(e) !== true)
                        {
                            var currentLen = this.length;
                            for(var i=this.length,lenI=_index;i>lenI;i--)
                            {
                                if(this[i] === undefined)
                                {
                                    Object.defineProperty(this,i,setBindDescriptor.call(this,this[(i-1)],i));
                                    a.key = i;
                                    a.type = 'postadd';
                                    _onaction(a);
                                }
                                else
                                {
                                    this[i] = this[(i-1)];
                                }
                            }
                            this[_index] = _inserts[x];
                        }
                    }
                }
                a.type = 'postsplice';
                _onaction(a);
            }
            return _ret;
        }

        function push(v)
        {
            var e = new eventObject(this,(this.length),'push',v,undefined,arguments,'__kbdatacreatelisteners'),
                a = new actionObject('push',(this.length),e,arguments);
            if(_onaction(a) !== true)
            {
                e.type = 'add';
                e.value = a.args[0];
                e.key = a.key;
                a.type = 'add';
                if(_onaction(a) !== true && _onevent(e) !== true)
                {
                    Object.defineProperty(this,a.key,setBindDescriptor.call(this,a.args[0],a.key));
                    a.type = 'postadd';
                    _onaction(a);
                    a.type = 'postpush';
                    _onaction(a);
                }
            }
            return this.length;
        }

        function pop()
        {
            var e = new eventObject(this,(this.length-1),'pop',this[(this.length-1)],undefined,arguments,'__kbdatadeletelisteners'),
                a = new actionObject('pop',(this.length-1),e,arguments);
            if(_onaction(a) !== true)
            {
                var _ret = this[(this.length-1)];
                e.type = 'remove';
                a.type = 'remove';
                if(_onaction(a) !== true && _onevent(e) !== true)
                {
                    this.length = (this.length-1);
                    a.type = 'postremove';
                    _onaction(a);
                    a.type = 'postpop';
                    _onaction(a);
                    return _ret;
                }
            }
            return null;
        }

        function shift()
        {
            var e = new eventObject(this,0,'shift',this[0],undefined,arguments,'__kbdatadeletelisteners'),
                a = new actionObject('shift',0,e,arguments);
            
            if(_onaction(a) !== true)
            {
                var _ret = this[a.key];
                e.type = 'remove';
                e.key = a.key;
                a.type = 'remove';
                if(_onaction(a) !== true && _onevent(e) !== true)
                {
                    for(var x=a.key,len=(this.length-1);x<len;x++)
                    {
                        this[x] = this[(x+1)];
                    }
                    this.length = (this.length-1);
                    a.type = 'postremove';
                    _onaction(a);
                    a.type = 'postshift';
                    _onaction(a);
                    return _ret;
                }
            }
            return null;
        }

        function unshift()
        {
            var e = new eventObject(this,0,'unshift',this[0],undefined,arguments,'__kbdatacreatelisteners'),
                a = new actionObject('unshift',0,e,arguments);
            if(_onaction(a) !== true)
            {
                var args = Array.prototype.slice.call(a.args);
                for(var x=0,len=args.length;x<len;x++)
                {
                    e.key = x;
                    e.type = 'add';
                    e.value = args[x];
                    a.type = 'add';
                    a.key = x;
                    if(_onaction(a) === true || _onevent(e) === true)
                    {
                        args.splice(x,1);
                    }
                }
                if(args.length !== 0)
                {
                    for(var x=((this.length-1)+args.length),len=args.length;x !== -1;x--)
                    {
                        if(x < len)
                        {
                            this[x] = args[x];
                        }
                        else
                        {
                            if(!isObservable(this,x))
                            {
                                Object.defineProperty(this,x,setBindDescriptor.call(this,this[(x-args.length)],x));
                                a.type = 'postadd';
                                _onaction(a);
                            }
                            else
                            {
                                this[x] = this[(x-args.length)];
                            }
                        }
                    }
                    a.type = 'postunshift';
                    _onaction(a);
                }
            }
            return this.length;
        }

        function fill(value,start,end)
        {
            var _start = (start !== undefined ? Math.max(0,start) : 0),
                _end = ((end !== undefined && end <= this.length) ? Math.min(this.length,Math.max(0,end)) : this.length),
                e = new eventObject(this,_start,'fill',value,this[_start],arguments,'__kbdatalisteners'),
                a = new actionObject('fill',_start,e,arguments);
            if(_onaction(a) !== true)
            {
                for(var x=a.key;x<a.args[2];x++)
                {
                    this[x] = a.args[0];
                }
                a.type = 'postfill';
                _onaction(a);
            }
            return this;
        }

        function reverse()
        {
            var e = new eventObject(this,0,'reverse',value,this[_start],arguments,'__kbdatalisteners'),
                a = new actionObject('reverse',0,e,arguments);
            if(_onaction(a) !== true)
            {
                var _rev = this.slice().reverse();
                for(var x=0,len=this.length;x<len;x++)
                {
                    this[x] = _rev[x];
                }
                a.type = 'postreverse';
                _onaction(a);
            }
            return this;
        }

        function sort()
        {
            var e = new eventObject(this,0,'sort',value,this[_start],arguments,'__kbdatalisteners'),
                a = new actionObject('sort',0,e,arguments);
            if(_onaction(a) !== true)
            {
                var _sort = this.slice();
                _sort = _sort.sort.apply(_sort,arguments);
                for(var x=0,len=this.length;x<len;x++)
                {
                    this[x] = _sort[x];
                }
                a.type = 'postsort';
                _onaction(a);
            }
            return this;
        }

        function add(index,value)
        {
            var e = new eventObject(this,index,'add',value,undefined,arguments,'__kbdatacreatelisteners'),
                a = new actionObject('add',index,e,arguments);

            if(value === undefined)
            {
                this.push(index);
            }
            else
            {
                if(_onaction(a) !== true)
                {
                    if(this[a.key] === undefined)
                    {
                        if(_onevent(e) !== true)
                        {
                            Object.defineProperty(this,a.key,setBindDescriptor.call(this,a.args[1],a.key));
                            a.type = 'postadd';
                            _onaction(a);
                        }
                    }
                    else
                    {
                        console.error('Your attempting to add the index: ',a.key,' that already exists on',this,'try using set or direct set instead');
                        return this;
                    }
                }
            }
            return this;
        }
        
        function addPointer(objArr,prop,newProp)
        {
            var e = new eventObject(this,(newProp || prop),'add',objArr[prop],undefined,arguments,'__kbdatacreatelisteners'),
                a = new actionObject('add',(newProp || prop),e,arguments);

            if(_onaction(a) !== true)
            {
                if(_onevent(e) !== true)
                {
                    var desc = Object.getOwnPropertyDescriptor(objArr,prop);
                    Object.defineProperty(this,a.key,setPointer(objArr,prop,desc));
                    
                  
                    a.type = 'postadd';
                    _onaction(a);
                }
            }
            return this;
        }

        function set(index,value)
        {
            var e = new eventObject(this,index,'set',value,this[index],arguments,'__kblisteners'),
                a = new actionObject('set',index,e,arguments);
            
            if(this[index] === undefined)
            {
                this.add(index,value);
            }
            else
            {
                if(_onaction(a) !== true)
                {
                    e.key = a.key;
                    e.value = a.args[1];
                    if(_onevent(e) !== true)
                    {
                        if(isObservable(this,a.key))
                        {
                            this[a.key] = a.args[1];
                        }
                        else
                        {
                            Object.defineProperty(this,a.key,setBindDescriptor.call(this,a.args[1],a.key));
                        }
                        a.type = 'postset';
                        _onaction(a);
                    }
                }
            }
            return this;
        }

        function remove(index,remove)
        {
            var e = new eventObject(this,index,'remove',this[index],this[index],arguments,'__kbdatadeletelisteners'),
                a = new actionObject('remove',index,e,arguments);

            if(_onaction(a) !== true)
            {
                if(this[a.key] === undefined)
                {
                    console.error('Your attempting to remove the index: ',a.key,' that does not exist on ',this);
                    return this;
                }
                var val = this[a.key];
                this.splice(a.key,a.args[1]);
            }
            return this;
        }

        /* Descriptor based methods */
        function setPointer(obj,prop,desc)
        {
            return {
                get:function(){
                    return obj[prop];
                },
                set:function(v){

                  (this._stopChange ? obj.stopChange() : obj)[prop] = v;
                  this._stopChange = undefined;
                },
                enumerable:desc.enumerable,
                configurable:desc.configurable
            }
        }

        function setDescriptor(value,writable,redefinable)
        {
            return {
                value:value,
                writable:!!writable,
                enumerable:false,
                configurable:!!redefinable
            }
        }

        function setBindDescriptor(value,index)
        {
            var _value = value,
                _oldValue = value,
                _prop = index,
                _set = function(v,e)
                {
                    _oldValue = _value;
                    _value = v;
                  if(!e.stopChange)
                  {
                    e.listener = '__kbupdatelisteners';
                    e.type = 'update';
                    _onevent(e);
                  }
                };
            return {
                get:function(){
                    return _value;
                },
                set:function(v)
                {
                    var e = new eventObject(this,_prop,'set',v,_value,arguments,'__kblisteners',this._stopChange);
                    if(_onevent(e) !== true)
                    {
                       _set(v,e);
                      if(!this._stopChange) this.callSubscribers(_prop,_value,_oldValue);
                    }
                    this._stopChange = undefined;
                },
                configurable:true,
                enumerable:true
            }
        }

        /* Subscriber methods */
        function subscribe(prop,func)
        {
            var e = new eventObject(this,prop,'subscribe',this[prop],undefined,arguments,'__kbsubscribers'),
                a = new actionObject('subscribe',prop,e,arguments);
            
            if(_onaction(a) !== true)
            {
                if(_subscribers[a.key] === undefined) _subscribers[a.key] = [];
                _subscribers[a.key].push(func);
            }
            return this;
        }

        function unsubscribe(prop,func)
        {
            var e = new eventObject(this,prop,'unsubscribe',this[prop],undefined,arguments,'__kbsubscribers'),
                a = new actionObject('unsubscribe',prop,e,arguments);
                
            if(_onaction(a) !== true)
            {
                if(_subscribers[a.key] !== undefined)
                {
                    loop:for(var x=0,len=_subscribers[a.key].length;x<len;x++)
                    {
                        if(_subscribers[a.key][x].toString() === func.toString())
                        {
                            _subscribers[a.key].splice(x,1);
                            break loop;
                        }
                    }
                }
            }
          return this;
        }

        function callSubscribers(prop,value,oldValue)
        {
            if(_subscribers[prop] !== undefined)
            {
                for(var x=0,len=_subscribers[prop].length;x<len;x++)
                {
                    _subscribers[prop][x](prop,value,oldValue);
                }
            }
            if(_subscribers['*'] !== undefined)
            {
                for(var x=0,len=_subscribers['*'].length;x<len;x++)
                {
                    _subscribers['*'][x](prop,value,oldValue);
                }
            }
            return this;
        }

        function stopChange()
        {
          this._stopChange = true;
          return this;
        }

        /* Define all properties */
        Object.defineProperties(_arr,{
            __kbname:setDescriptor((name || ""),true,true),
            __kbref:setDescriptor((parent ? (parent.__kbref || parent) : _arr),true,true),
            __kbscopeString:setDescriptor((scope || ""),true,true),
            __kbImmediateParent:setDescriptor((parent || null),true,true),
            splice:setDescriptor(splice),
            push:setDescriptor(push),
            pop:setDescriptor(pop),
            shift:setDescriptor(shift),
            unshift:setDescriptor(unshift),
            fill:setDescriptor(fill),
            reverse:setDescriptor(reverse),
            sort:setDescriptor(sort),
            add:setDescriptor(add),
            prototype:setDescriptor(prototype),
            addPointer:setDescriptor(addPointer),
            set:setDescriptor(set),
            remove:setDescriptor(remove),
            stringify:setDescriptor(stringify),
            callSubscribers:setDescriptor(callSubscribers),
            subscribe:setDescriptor(subscribe),
            unsubscribe:setDescriptor(unsubscribe),
            __kblisteners:setDescriptor({}),
            __kbupdatelisteners:setDescriptor({}),
            __kbparentlisteners:setDescriptor({}),
            __kbparentupdatelisteners:setDescriptor({}),
            __kbdatacreatelisteners:setDescriptor([]),
            __kbdatadeletelisteners:setDescriptor([]),
            addActionListener:setDescriptor(addActionListener),
            removeActionListener:setDescriptor(removeActionListener),
            stopChange:setDescriptor(stopChange),
            _stopChange:setDescriptor(undefined,true)
        });

        Object.defineProperties(_arr,{
            addDataListener:setDescriptor(addListener('addDataListener','__kblisteners')),
            removeDataListener:setDescriptor(removeListener('removeDataListener','__kblisteners')),
            addDataUpdateListener:setDescriptor(addListener('addDataUpdateListener','__kbupdatelisteners')),
            removeDataUpdateListener:setDescriptor(removeListener('removeDataUpdateListener','__kbupdatelisteners')),
            addDataCreateListener:setDescriptor(addListener('addDataCreateListener','__kbdatacreatelisteners')),
            removeDataCreateListener:setDescriptor(removeListener('addDataCreateListener','__kbdatacreatelisteners')),
            addDataRemoveListener:setDescriptor(addListener('addDataRemoveListener','__kbdatadeletelisteners')),
            removeDataRemoveListener:setDescriptor(removeListener('removeDataRemoveListener','__kbdatadeletelisteners'))
        });

        return _arr;
    }
    return CreateKObservableArray;
});
  
  
  
  
  
