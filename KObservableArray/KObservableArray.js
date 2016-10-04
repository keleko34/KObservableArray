define([],function(){

    function CreateKObservableArray(name,parent,scope)
    {
        var _arr = [],
            _actions = {
                splice:[],
                push:[],
                pop:[],
                shift:[],
                unshift:[],
                fill:[],
                reverse:[],
                sort:[],
                add:[],
                set:[],
                remove:[]
            },
            _onaction = function(arr,key,type,value,oldValue,args)
            {
                var e = new eventObject(arr,key,type,value,oldValue,args);

                for(var x=0,_curr=_actions[type],len=_curr.length;x!==len;x++)
                {
                    _curr[x](e);
                    if(e._stopPropogration) break;
                }
                return e._preventDefault;
            },
            _subscribers = {},
            _onset = function(arr,key,action,value,oldValue)
            {
              var e = new eventObject(arr,key,action,value,oldValue);
              _arr.onset(e);
              return e._preventDefault;
            },
            _onupdate = function(arr,key,action,value,oldValue)
            {
              var e = new eventObject(arr,key,action,value,oldValue);
              _arr.onupdate(e);
              return e._preventDefault;
            },
            _onadd = function(arr,key,action,value,oldValue)
            {
              var e = new eventObject(arr,key,action,value,oldValue);
              _arr.onadd(e);
              return e._preventDefault;
            },
            _onremove = function(arr,key,action,value,oldValue)
            {
              var e = new eventObject(arr,key,action,value,oldValue);
              _arr.onremove(e);
              return e._preventDefault;
            }

        _arr.onadd = function(e){};
        _arr.onremove = function(e){};
        _arr.onset = function(e){};
        _arr.onupdate = function(e){};
        _arr.onobject = function(v){return v};

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

        function isArray(v)
        {
          return (Object.prototype.toString.call(v) === '[object Array]');
        }

        function isObject(v)
        {
            return (typeof v === 'object' && !!v ? (Object.prototype.toString.call(v) === '[object Object]') : false);
        }

        function isObservable(obj,prop)
        {
            return (Object.getOwnPropertyDescriptor(obj,prop).value === undefined);
        }

        function splice(index,remove,insert)
        {
            var _ret = [],
                _isInsertArray = isArray(insert),
                _insertLen = (insert !== undefined ? (_isInsertArray ? insert.length : 1) : 0),
                _index = 0;


            if(remove !== 0 && this[((index-1)+remove)] !== undefined)
            {
                for(var x=0,len=remove;x<len;x++)
                {
                    _index = (index+x);
                    if(_onremove(this,_index,'remove',this[_index]) !== true)
                    {
                        _ret.push(this[(_index-_ret.length)]);
                        for(var i=index,lenI=(this.length-1);i<lenI;i++)
                        {
                            this[i] = this[(i+1)];
                        }
                    }
                    else
                    {
                        remove -= 1;
                    }
                }
                this.length = (this.length-remove);
            }
            if(_insertLen !== 0)
            {
                if(!_isInsertArray) insert = [insert];
                for(var x=0,len=_insertLen;x<len;x++)
                {
                    _index = (index+x);
                    if(_onadd(this,_index,'add',insert[x],this[_index]) !== true)
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
                        this[_index] = insert[x];
                    }
                }
            }
            _onaction(this,index,'splice',insert,undefined,arguments);
            return _ret;
        }

        function push(v)
        {
            if(_onadd(this,(this.length),'add',v) !== true)
            {
                Object.defineProperty(this,this.length,setBindDescriptor.call(this,v,this.length));
                _onaction(this,(this.length-1),'push',v,undefined,arguments);
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

        function addPointer(objArr,prop)
        {
            if(_onadd(this,key,objArr[prop]) !== true)
            {
                var desc = Object.getOwnPropertyDescriptor(objArr,prop);
                Object.defineProperty(this,prop,setPointer(objArr,prop,desc));
                _onaction(this, prop,'add',objArr[prop],undefined,arguments);
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

        function addListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                _listeners[prop] = func;
                return this;
            }
        }

        function removeListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                if(func !== undefined) _listeners = _listeners[prop];

                for(var x=0,len=_listeners.length;x<len;x++)
                {
                    if(_listeners[x].toString() === func.toString())
                    {
                        _listeners.splice(x,1);
                        return this;
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

        function setDescriptor(value,writable)
        {
            return {
                value:value,
                writable:!!writable,
                enumerable:false,
                configurable:false
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

        function subscribe(prop,func)
        {
            if(_subscribers[prop] === undefined) _subscribers[prop] = [];
            _subscribers[prop].push(func);
            return this;
        }

        function callSubscribers(prop,value,oldValue)
        {
            if(_subscribers[prop] !== undefined)
            {
                var e = new eventObject(this,prop,'subscriber',value,oldValue);
                for(var x=0,len=_subscribers[prop].length;x<len;x++)
                {
                    _subscribers[prop][x](e);
                    if(e._stopPropogration) break;
                }
            }
            return this;
        }

        Object.defineProperties(_arr,{
            __kbname:setDescriptor((name || ""),true),
            __kbref:setDescriptor((parent || null),true),
            __kbscopeString:setDescriptor((scope || ""),true),
            __kbImmediateParent:setDescriptor((parent || null),true),
            splice:setDescriptor(splice),
            push:setDescriptor(push),
            pop:setDescriptor(pop),
            shift:setDescriptor(shift),
            unshift:setDescriptor(unshift),
            fill:setDescriptor(fill),
            reverse:setDescriptor(reverse),
            sort:setDescriptor(sort),
            add:setDescriptor(add),
            addPointer:setDescriptor(addPointer),
            set:setDescriptor(set),
            remove:setDescriptor(remove),
            stringify:setDescriptor(stringify),
            callSubscribers:setDescriptor(callSubscribers),
            subscribe:setDescriptor(subscribe),
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
  
  
  
  
  
