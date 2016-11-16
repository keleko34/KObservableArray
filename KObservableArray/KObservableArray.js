define([],function(){

    function CreateKObservableArray(name,parent,scope)
    {
        var _arr = [],
            _subscribers = {},
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

            /* Data based events to alter the data being set */
            _onevent = function(e)
            {
                var _local = e.local[e.listener];
                if(isObject(_local)) _local = _local[e.key];
                if(isArray(_local))
                {
                    for(var x=0,len=_local.length;x!==len;x++)
                    {
                        _local[x](e);
                        if(e._stopPropogration) break;
                    }
                }
                return e._preventDefault;
            };

        /* Event Objects */
        function eventObject(arr,key,action,value,oldValue,args)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.local = arr;
            this.key = key;
            this.arguments = args;
            this.type = action;
            this.name = arr.__kbname;
            this.root = arr.__kbref;
            this.scope = arr.__kbscopeString;
            this.parent = arr.___kbImmediateParent;
            this.value = value;
            this.oldValue = oldValue;
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
            return function(prop,func)
            {
                var e = new eventObject(this,prop,type,this[prop],this[prop],arguments),
                    a = new actionObject(type,prop,e,arguments),
                    c;
                
                if(_onaction(a) !== true)
                {
                    if(isObject(_listeners) && _listeners[a.key] === undefined) _listeners[a.key] = [];
                    c = (isObject(_listeners) ? _listeners[a.key] : _listeners);
                    c.push(a.args[1]);
                }
                return this;
            }
        }

        function removeListener(type,listener)
        {
            var _listeners = _arr[listener];
            return function(prop,func)
            {
                var e = new eventObject(this,prop,type,this[prop],this[prop],arguments),
                    a = new actionObject(type,prop,e,arguments),
                    c;

                if(_onaction(a) !== true)
                {
                    if(a.args[1] !== undefined) c = (isObject(_listeners) ? _listeners[a.key] : _listeners);

                    for(var x=0,len=c.length;x<len;x++)
                    {
                        if(c[x].toString() === a.args[1].toString())
                        {
                            c.splice(x,1);
                            return this;
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
                _isInsertArray = isArray(a.args[2]),
                _insertLen = (a.args[2] !== undefined ? (_isInsertArray ? a.args[2].length : 1) : 0),
                _index = 0;

                if(remove !== 0 && this[((a.key-1)+a.args[1])] !== undefined)
                {
                    for(var x=0,len=a.args[1];x<len;x++)
                    {
                        _index = (a.key+x);

                        e.key = _index;
                        e.type = 'remove';
                        e.value = this[_index];
                        
                        if(_onevent(e) !== true)
                        {
                            _ret.push(this[(_index-_ret.length)]);
                            for(var i=a.key,lenI=(this.length-1);i<lenI;i++)
                            {
                                this[i] = this[(i+1)];
                            }
                        }
                        else
                        {
                            a.args[1] -= 1;
                        }
                    }
                    this.length = (this.length-a.args[1]);
                }
                if(_insertLen !== 0)
                {
                    if(!_isInsertArray) a.args[2] = [a.args[2]];
                    for(var x=0,len=_insertLen;x<len;x++)
                    {
                        _index = (a.key+x);

                        e.key = _index;
                        e.type = 'add';
                        e.listener = '__kbdatacreatelisteners';
                        e.value = a.args[2][x];

                        if(_onevent(e) !== true)
                        {
                            for(var i=this.length,lenI=_index;i>lenI;i--)
                            {
                                if(this[i] === undefined)
                                {
                                    Object.defineProperty(this,i,setBindDescriptor.call(this,this[(i-1)],i));
                                }
                                else
                                {
                                    this[i] = this[(i-1)];
                                }
                            }
                            this[_index] = a.args[2][x];
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
                if(_onevent(e) !== true)
                {
                    Object.defineProperty(this,a.key,setBindDescriptor.call(this,a.args[0],a.key));
                    a.type = 'postpush';
                    _onaction(a);
                }
            }
            return this.length;
        }

        function pop()
        {
            var _ret = this[(this.length-1)];
            if(_onremove(this,(this.length-1),'remove',_ret) !== true)
            {
                this.length = (this.length-1);
                _onaction(this,this.length,'pop',_ret,undefined,arguments);
                return _ret;
            }
            return null;
        }

        function shift()
        {
            var _ret = this[0];
            if(_onremove(this,0,'remove',_ret) !== true)
            {
                for(var x=0,len=(this.length-1);x<len;x++)
                {
                    this[x] = this[(x+1)];
                }
                this.length = (this.length-1);

                _onaction(this, 0,'shift',_ret,undefined,arguments);
                return _ret;
            }
            return null;
        }

        function unshift()
        {
            var args = Array.prototype.slice.call(arguments);
            for(var x=0,len=args.length;x<len;x++)
            {
                if(_onadd(this,x,'add',args[x]) === true)
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
                        }
                        else
                        {
                            this[x] = this[(x-args.length)];
                        }
                    }
                }
                _onaction(this, 0,'unshift',args,undefined,arguments);
            }
            return this.length;
        }

        function fill(value,start,end)
        {
            var _start = (start !== undefined ? Math.max(0,start) : 0),
                _end = ((end !== undefined && end <= this.length) ? Math.min(this.length,Math.max(0,end)) : this.length);

            for(var x=_start;x<_end;x++)
            {
                this[x] = value;
            }
            _onaction(this,0,'fill',value,undefined,arguments);
            return this;
        }

        function reverse()
        {
            var _rev = this.slice().reverse();
            for(var x=0,len=this.length;x<len;x++)
            {
                this[x] = _rev[x];
            }
            _onaction(this, 0,'reverse',_rev,undefined,arguments);
            return this;
        }

        function sort()
        {
            var _sort = this.slice();
            _sort = _sort.sort.apply(_sort,arguments);
            for(var x=0,len=this.length;x<len;x++)
            {
                this[x] = _sort[x];
            }
            _onaction(this, 0,'sort',_sort,undefined,arguments);
            return this;
        }

        function add(value,index)
        {
            if(index === undefined)
            {
                this.push(value);
            }
            else
            {
                if(this[index] === undefined)
                {
                    if(_onadd(this,index,'add',value) !== true)
                    {
                        Object.defineProperty(this,index,setBindDescriptor.call(this,value,index));
                        _onaction(this,index,'add',value,undefined,arguments);
                    }
                }
                else
                {
                    console.error('Your attempting to add the index: ',index,' that already exists on',this,'try using set or direct set instead');
                    return this;
                }
            }
            return this;
        }

        function addPointer(objArr,prop,newProp)
        {
            if(_onadd(this,(newProp || prop),objArr[prop]) !== true)
            {
                var desc = Object.getOwnPropertyDescriptor(objArr,prop);
                Object.defineProperty(this,(newProp || prop),setPointer(objArr,prop,desc));
                _onaction(this, (newProp || prop),'add',objArr[prop],undefined,arguments);
            }
            return this;
        }

        function set(index,value,stopChange)
        {
            if(this[index] === undefined)
            {
                this.add(value,index);
            }
            else
            {
                if(isObservable(this,index))
                {
                    Object.getOwnPropertyDescriptor(this,index).set(value,stopChange);
                }
                else
                {
                    Object.defineProperty(this,index,setBindDescriptor.call(this,value,index));
                }
                _onaction(this, index,'set',value,undefined,arguments);
            }
            return this;
        }

        function remove(index,remove)
        {
            if(this[index] === undefined)
            {
                console.error('Your attempting to remove the index: ',index,' that does not exist on ',this);
                return this;
            }
            var val = this[index];
            this.splice(index,remove);
            _onaction(this, index,'remove',val,undefined,arguments);
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
                    obj[prop] = v;
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
                _set = _onset,
                _update = _onupdate;
            return {
                get:function(){
                    return _value;
                },
                set:function(v,stopChange)
                {
                    if(_set(this,_prop,v,_value) !== true)
                    {
                        _oldValue = _value;
                        _value = v;
                        _update(this,_prop,_value,_oldValue);
                        if(!stopChange) this.callSubscribers(_prop,_value,_oldValue);
                    }
                },
                configurable:true,
                enumerable:true
            }
        }

        /* Subscriber methods */
        function subscribe(prop,func)
        {
            if(_subscribers[prop] === undefined) _subscribers[prop] = [];
            _subscribers[prop].push(func);
            return this;
        }

        function unsubscribe(prop,func)
        {
          if(_subscribers[prop] !== undefined)
          {
            loop:for(var x=0,len=_subscribers[prop].length;x<len;x++)
            {
                if(_subscribers[prop][x].toString() === func.toString())
                {
                  _subscribers[prop].splice(x,1);
                  break loop;
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
                    _subscribers[prop][x](value);
                }
            }
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
            removeActionListener:setDescriptor(removeActionListener)
        });

        Object.defineProperties(_arr,{
            addDataListener:setDescriptor(addListener('__kblisteners')),
            removeDataListener:setDescriptor(removeListener('__kblisteners')),
            addDataUpdateListener:setDescriptor(addListener('__kbupdatelisteners')),
            removeDataUpdateListener:setDescriptor(removeListener('__kbupdatelisteners')),
            addDataCreateListener:setDescriptor(addListener('__kbdatacreatelisteners')),
            removeDataCreateListener:setDescriptor(removeListener('__kbdatacreatelisteners')),
            addDataRemoveListener:setDescriptor(addListener('__kbdatadeletelisteners')),
            removeDataRemoveListener:setDescriptor(removeListener('__kbdatadeletelisteners'))
        });

        return _arr;
    }
    return CreateKObservableArray;
});
  
  
  
  
  
