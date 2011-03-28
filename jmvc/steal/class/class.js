//@documentjs-ignore
// This is a modified version of John Resig's class
// It provides class level inheritence and callbacks.

steal(function($){

  var isArray = function(arr){
	  	  return Object.prototype.toString.call(arr) === "[object Array]"
	  },
	  makeArray = function(arr){
	  	var res = [], l = arr.length;
		for(var i =0; i < l; i++){
			res[i] = arr[i]
		}
		return res;
	  },
	  isObjectLiteral = function( obj ) {
			if ( toString.call(obj) !== "[object Object]" ) {
				return false;
			}
			
			// not own constructor property must be Object
			if ( obj.constructor
			  && !hasOwnProperty.call(obj, "constructor")
			  && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		
			var key;
			for ( key in obj ) {}
			
			return key === undefined || hasOwnProperty.call( obj, key );
	  },
	  deepExtend = function(target){
	  	var i = 1, length = arguments.length, options;
		for(; i < length; i++){
			if ((options = arguments[i]) != null) {
				// Extend the base object
				for (name in options) {
					src = d[name];
					copy = options[name];
					
					// Prevent never-ending loop
					if (target === copy) {
						continue;
					}
					
					// Recurse if we're merging object literal values
					if ( copy && isObjectLiteral(copy)) {
						// Don't extend not object literals
						var clone = src && isObjectLiteral(src) ? src : {};
						
						// Never move original objects, clone them
						target[name] = deepExtend(clone, copy);
						
						// Don't bring in undefined values
					}
					else if (copy !== undefined) {
							target[name] = copy;
					}
				}
			}
		}
		return target;
	  },
	  
	  initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/,
      callback = function(f_names){
		//process args
		var args = makeArray(arguments), f, self;
        f_names = args.shift();
		if(!isArray(f_names)) 
			f_names = [f_names];
		
		//check names ... should only be in development
		//for(f =0; f < f_names.length; f++ )
		//	if(typeof f_names[f] == "string" &&  typeof this[f_names[f]] != 'function')
		//		 throw 'There is no function named '+f_names[f]+'. ';
		self = this;
		return function(){
			var cur = args.concat(makeArray(arguments)), isString
			for(f =0; f < f_names.length; f++){
                if(!f_names[f]) continue;
                isString = typeof f_names[f] == "string";
                if(isString && self._set_called) self.called = f_names[f];
                cur = (isString ? self[f_names[f]] : f_names[f]).apply(self, cur);
				if(!cur) 					      cur = [];
				else if( !isArray(cur) || cur._use_call) cur = [cur]
			}
			return cur;
        }
    },
	newInstance = function(){
        initializing = true;
        var inst = new this();
        initializing = false;
		if ( inst.setup )
            inst.setup.apply(inst, arguments);
        if ( inst.init )
            inst.init.apply(inst, arguments);
        return inst;
    },
    rawInstance = function(){
        initializing = true;
        var inst = new this();
        initializing = false;
        return inst;
    },
    /**
     * Copy and overwrite options from old class
     * @param {Object} oldClass
     * @param {Object} options
     */
	setup = function(oldClass, options){
		//clone current args and add
        var oldOptions = oldClass.OPTIONS || {};
        var newOptions = deepExtend({}, oldOptions, this.defaults, options);
        //for each newOption, write on class:
        this.OPTIONS = newOptions;
        for(var name in this.OPTIONS){
            this[name] = this.OPTIONS[name]
        }
        /*var args = [];
		var current = this.args || [];
		for(var i =0; i  < current.length; i++){
			args[i] = current[i];
		}
		for(var i =0; i  < arguments.length; i++){
			args.push(arguments[i])
		}
		this.ARGS = args;*/
	},
	toString = function(){
		return this.className || Object.prototype.toString.call(this)
	},
	id = 1,
    getObject = function(objectName, current){
        var current = current || win,
            parts = objectName.split(/\./)
        for(var i =0; i < parts.length; i++){
            current = current[parts[i]] || ( current[parts[i]] = {} )
        }
		return current;
    },
	win = (function(){return this}).call(null);
	
	if(!$.isArray)
		$.isArray = isArray;
	if(!$.makeArray)
		$.makeArray = makeArray;
  // The base Class implementation (does nothing)

  /**
   * @constructor jQuery.Class
   * @plugin lang/class
   * @tag core
   * Class provides simple simulated inheritance in JavaScript. 
   * It is based off John Resig's [http://ejohn.org/blog/simple-javascript-inheritance/|Simple Class] 
   * Inheritance library.  Besides prototypal inheritance, it adds a few important features:
   * <ul>
   *     <li>Static inheritance</li>
   *     <li>Class initialization callbacks</li>
   *     <li>Introspection</li>
   *     <li>Easy callback function creation</li>
   * </ul>
   * <h2>Examples</h2>
   * <h3>Basic example</h3>
   * Creates a class with a className (used for introspection), static, and prototype members:
   * @codestart
   * jQuery.Class.extend('Monster',
   * /* @static *|
   * {
   *   count: 0
   * },
   * /* @prototype *|
   * {
   *   init : function(name){
   *     this.name = name;
   *     this.Class.count++
   *   }
   * })
   * hydra = new Monster('hydra')
   * dragon = new Monster('dragon')
   * hydra.name        // -> hydra
   * Monster.count     // -> 2
   * Monster.className // -> 'Monster'
   * @codeend
   * Notice that the prototype init function is called when a new instance of Monster is created.
   * <h3>Static property inheritance</h3>
   * Demonstrates inheriting a class property.
   * @codestart
   * jQuery.Class.extend("First",
   * {
   *     staticMethod : function(){ return 1;}
   * },{})
   * First.extend("Second",{
   *     staticMethod : function(){ return this._super()+1;}
   * },{})
   * Second.staticMethod() // -> 2
   * @codeend
   * <h3 id='introspection'>Introspection</h3>
   * Often, it's nice to create classes whose name helps determine functionality.  Ruby on
   * Rails's [http://api.rubyonrails.org/classes/ActiveRecord/Base.html|ActiveRecord] ORM class 
   * is a great example of this.  Unfortunately, JavaScript doesn't have a way of determining
   * an object's name, so the developer must provide a name.  Class fixes this by taking a String name for the class.
   * @codestart
   * $.Class.extend("MyOrg.MyClass",{},{})
   * MyOrg.MyClass.className //-> 'MyClass'
   * MyOrg.MyClass.fullName //->  'MyOrg.MyClass'
   * @codeend
   * <h3>Construtors</h3>
   * Class uses static and class initialization constructor functions.  
   * @codestart
   * $.Class.extend("MyClass",
   * {
   *   init: function(){} //static constructor
   * },
   * {
   *   init: function(){} //prototype constructor
   * })
   * @codeend
   * The static constructor is called after
   * a class has been created, but before [jQuery.Class.static.extended|extended] is called on its base class.  
   * This is a good place to add introspection and similar class setup code.
   * 
   * The prototype constructor is called whenever a new instance of the class is created.
   * 
   * 
   * @init Creating a new instance of an object that has extended jQuery.Class 
        calls the init prototype function and returns a new instance of the class.
   * 
   */
  
  $.Class = 
  /* @Static*/
      function(){ 
          if(arguments.length) this.extend.apply(this, arguments)
      };
      
  /**
   * @function callback
   * Returns a callback function for a function on this Class.
   * The callback function ensures that 'this' is set appropriately.  
   * @codestart
   * $.Class.extend("MyClass",{
   *     getData : function(){
   *         this.showing = null;
   *         $.get("data.json",this.callback('gotData'),'json')
   *     },
   *     gotData : function(data){
   *         this.showing = data;
   *     }
   * },{});
   * MyClass.showData();
   * @codeend
   * <h2>Currying Arguments</h2>
   * Additional arguments to callback will fill in arguments on the returning function.
   * @codestart
   * $.Class.extend("MyClass",{
   *    getData : function(<b>callback</b>){
   *      $.get("data.json",this.callback('process',<b>callback</b>),'json');
   *    },
   *    process : function(<b>callback</b>, jsonData){ //callback is added as first argument
   *        jsonData.processed = true;
   *        callback(jsonData);
   *    }
   * },{});
   * MyClass.getData(showDataFunc)
   * @codeend
   * <h2>Nesting Functions</h2>
   * Callback can take an array of functions to call as the first argument.  When the returned callback function
   * is called each function in the array is passed the return value of the prior function.  This is often used
   * to eliminate currying initial arguments.
   * @codestart
   * $.Class.extend("MyClass",{
   *    getData : function(callback){
   *      //calls process, then callback with value from process
   *      $.get("data.json",this.callback(['process2',callback]),'json') 
   *    },
   *    process2 : function(type,jsonData){
   *        jsonData.processed = true;
   *        return [jsonData];
   *    }
   * },{});
   * MyClass.getData(showDataFunc);
   * @codeend
   * @param {String|Array} fname If a string, it represents the function to be called.  
   * If it is an array, it will call each function in order and pass the return value of the prior function to the
   * next function.
   * @return {Function} the callback function.
   */
  $.Class.callback = callback;
  
  
  $.Class.getObject = getObject;
  
  // Create a new Class that inherits from the current class.
  
  $.Class.
    /**
     * Extends a class with new static and prototype functions.  There are a variety of ways
     * to use extend:
     * @codestart
     * //with className, static and prototype functions
     * $.Class.extend('Task',{ STATIC },{ PROTOTYPE })
     * //with just classname and prototype functions
     * $.Class.extend('Task',{ PROTOTYPE })
     * //With just a className
     * $.Class.extend('Task')
     * @codeend
     * @param {String} [optional1] className the classes name (used for classes w/ introspection)
     * @param {Object} [optional2] klass the new classes static/class functions
     * @param {Object} [optional3] proto the new classes prototype functions
     * @return {jQuery.Class} returns the new class
     */
    extend = function(className, types, klass, proto) {
    if(typeof className != 'string'){
        proto = klass;
        klass = types;
		types = className;
        className = null;
    }
	if(!$.isArray(types)){
        proto = klass;
        klass = types;
    }
    if(!proto){
        proto = klass;
        klass = null;
    }
    
    
    
    proto = proto || {};
    var _super_class = this;
    var _super = this.prototype;
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    // Copy the properties over onto the new prototype
    for (var name in proto) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof proto[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(proto[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, proto[name]) :
        proto[name];
    }
	
	//calculate class properties once:
	var staticProps = {
		/**
	     * @function newInstance
	     * Creates a new instance of the class.  This method is useful for creating new instances
	     * with arbitrary parameters.
	     * <h3>Example</h3>
	     * @codestart
	     * $.Class.extend("MyClass",{},{})
	     * var mc = MyClass.newInstance.apply(null, new Array(parseInt(Math.random()*10,10))
	     * @codeend
	     */
		newInstance : newInstance,
		rawInstance : rawInstance,
		extend : arguments.callee,
		setup : setup
	};
	
	//copy properties from current class to static
    for(var name in this){
        if(this.hasOwnProperty(name) && 
            name != 'prototype'&& 
            name != 'OPTIONS' &&
            name != 'defaults' &&
            name != 'getObject'){
            staticProps[name] = this[name];
        }
    }
	//do inheritence
	for (var name in klass) {
      staticProps[name] = typeof klass[name] == "function" &&
        typeof staticProps[name] == "function" && fnTest.test(klass[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            this._super = _super_class[name];
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
            return ret;
          };
        })(name, klass[name]) :
        klass[name];
	};
	var shortName, fullName, namespace;
	
	if (className) {
	  	var current = win
        var parts = className.split(/\./)
        for(var i =0; i < parts.length-1; i++){
            current = current[parts[i]] || ( current[parts[i]] = {} )
        }
		namespace = current;
		shortName = parts[parts.length - 1];
		fullName = className;
	}
	
	var makeClass;
	makeClass= function(options){
		// The dummy class constructor
		function Class() {
	      // All construction is actually done in the init method
	      if(initializing) return;
		  
		  if(this.constructor !== Class && arguments.length){  //we are being called w/o new
		  	  return makeClass.apply(null, arguments)
		  } else {												//we are being called w/ new
		  	 //this.id = (++id);
			 if(this.setup) this.setup.apply(this, arguments);
			 if(this.init)  this.init.apply(this, arguments);
		  }
	    }
		// A buffer class to protect 'Global' prototype functions.  
		// Add to this for one-off specific functionality
		function Buffer(){};
		Buffer.prototype = prototype;
		var buff = new Buffer();
		
		// Populate with prototype object ... however, I change it!!
	    Class.prototype = buff; //need another version of this ...
	    
		// Add static methods
		for(var name in staticProps){
	        if(staticProps.hasOwnProperty(name) && 
              name != 'prototype' && 
              name != 'constructor'){
	            Class[name] = staticProps[name];
	        }
	    }
		
		//Provide a reference to this class
	    Class.prototype.Class = Class; //only changing buff prototype
		Class.prototype.constructor = Class; //only buff prototype
	    // Enforce the constructor to be what we expect
	    Class.constructor = Class;
	    //Class.id = (++id);
		
		
        Class.namespace = namespace;
        Class.shortName = shortName
        /**
         * @attribute fullName 
         * The full name of the class, including namespace, provided for introspection purposes.
         * @codestart
         * $.Class.extend("MyOrg.MyClass",{},{})
         * MyOrg.MyClass.className //-> 'MyClass'
         * MyOrg.MyClass.fullName //->  'MyOrg.MyClass'
         * @codeend
         */
        Class.fullName = fullName;
		
		
		Class.setup.apply(Class, [_super_class].concat( makeArray(arguments) ));

	    if(Class.init) Class.init(Class);

		return Class;
	}
	

	var initClass = makeClass();
	if(current && shortName)
		current[shortName] = initClass;
    
    /* @Prototype*/
    
	
	
	
	
	return initClass;
    /* @function init
     * Called with the same arguments as new Class(arguments ...) when a new instance is created.
     * @codestart
     * $.Class.extend("MyClass",
     * {
     *    init: function(val){
     *       this.val = val;
     *    }
     * })
     * var mc = new MyClass("Check Check")
     * mc.val //-> 'Check Check'
     * @codeend
     */
    //Breaks up code
    /**
     * @attribute Class
     * Access to the static properties of the instance's class.
     * @codestart
     * $.Class.extend("MyClass", {classProperty : true}, {});
     * var mc2 = new MyClass();
     * mc.Class.classProperty = true;
     * var mc2 = new mc.Class(); //creates a new MyClass
     * @codeend
     */
  };
  
  
  $.Class.prototype = {
      /**
       * @function callback
       * Returns a callback function.  This does the same thing as and is described better in [jQuery.Class.static.callback].
       * The only difference is this callback works
       * on a instance instead of a class.
       * @param {String|Array} fname If a string, it represents the function to be called.  
       * If it is an array, it will call each function in order and pass the return value of the prior function to the
       * next function.
       * @return {Function} the callback function
       */
      callback : callback
  }
  
});
