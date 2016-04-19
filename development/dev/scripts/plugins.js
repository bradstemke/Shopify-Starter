/*! shopify-starter - v1.0.0 - 2016-04-19 */(function() {
  var $document, Cart, CartJS, Item, processing, queue,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Cart = (function() {
    function Cart() {
      this.update = __bind(this.update, this);
    }

    Cart.prototype.update = function(cart) {
      var item, key, value;
      for (key in cart) {
        value = cart[key];
        if (key !== 'items') {
          this[key] = value;
        }
      }
      return this.items = (function() {
        var _i, _len, _ref, _results;
        _ref = cart.items;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(new Item(item));
        }
        return _results;
      })();
    };

    return Cart;

  })();

  Item = (function() {
    function Item(item) {
      this.propertyArray = __bind(this.propertyArray, this);
      this.update = __bind(this.update, this);
      this.update(item);
    }

    Item.prototype.update = function(item) {
      var key, value;
      for (key in item) {
        value = item[key];
        if (key !== 'properties') {
          this[key] = value;
        }
      }
      return this.properties = CartJS.Utils.extend({}, item.properties);
    };

    Item.prototype.propertyArray = function() {
      var name, value, _ref, _results;
      _ref = this.properties;
      _results = [];
      for (name in _ref) {
        value = _ref[name];
        _results.push({
          name: name,
          value: value
        });
      }
      return _results;
    };

    return Item;

  })();

  CartJS = {
    settings: {
      debug: false,
      dataAPI: true,
      requestBodyClass: null,
      rivetsModels: {},
      currency: null,
      moneyFormat: null,
      moneyWithCurrencyFormat: null
    },
    cart: new Cart()
  };

  CartJS.init = function(cart, settings) {
    if (settings == null) {
      settings = {};
    }
    CartJS.configure(settings);
    CartJS.Utils.log('Initialising CartJS.');
    CartJS.cart.update(cart);
    if (CartJS.settings.dataAPI) {
      CartJS.Utils.log('"dataAPI" setting is true, initialising Data API.');
      CartJS.Data.init();
    }
    if (CartJS.settings.requestBodyClass) {
      CartJS.Utils.log('"requestBodyClass" set, adding event listeners.');
      $(document).on('cart.requestStarted', function() {
        return $('body').addClass(CartJS.settings.requestBodyClass);
      });
      $(document).on('cart.requestComplete', function() {
        return $('body').removeClass(CartJS.settings.requestBodyClass);
      });
    }
    return CartJS.Rivets.init();
  };

  CartJS.configure = function(settings) {
    if (settings == null) {
      settings = {};
    }
    return CartJS.Utils.extend(CartJS.settings, settings);
  };

  if (window.console == null) {
    window.console = {};
    window.console.log = function() {};
  }

  CartJS.Utils = {
    log: function() {
      return CartJS.Utils.console(console.log, arguments);
    },
    error: function() {
      return CartJS.Utils.console(console.error, arguments);
    },
    console: function(method, args) {
      if (CartJS.settings.debug && (typeof console !== "undefined" && console !== null)) {
        args = Array.prototype.slice.call(args);
        args.unshift('[CartJS]:');
        return method.apply(console, args);
      }
    },
    wrapKeys: function(obj, type, override) {
      var key, value, wrapped;
      if (type == null) {
        type = 'properties';
      }
      wrapped = {};
      for (key in obj) {
        value = obj[key];
        wrapped["" + type + "[" + key + "]"] = override != null ? override : value;
      }
      return wrapped;
    },
    unwrapKeys: function(obj, type, override) {
      var key, unwrapped, unwrappedKey, value;
      if (type == null) {
        type = 'properties';
      }
      unwrapped = {};
      for (key in obj) {
        value = obj[key];
        unwrappedKey = key.replace("" + type + "[", "").replace("]", "");
        unwrapped[unwrappedKey] = override != null ? override : value;
      }
      return unwrapped;
    },
    extend: function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    },
    clone: function(object) {
      var key, newInstance;
      if ((object == null) || typeof object !== 'object') {
        return object;
      }
      newInstance = new object.constructor();
      for (key in object) {
        newInstance[key] = clone(object[key]);
      }
      return newInstance;
    },
    isArray: Array.isArray || function(value) {
      return {}.toString.call(value) === '[object Array]';
    },
    ensureArray: function(value) {
      if (CartJS.Utils.isArray(value)) {
        return value;
      }
      if (value != null) {
        return [value];
      } else {
        return [];
      }
    },
    formatMoney: function(value, format, formatName, currency) {
      var _ref, _ref1;
      if (currency == null) {
        currency = '';
      }
      if (!currency) {
        currency = CartJS.settings.currency;
      }
      if ((window.Currency != null) && currency !== CartJS.settings.currency) {
        value = Currency.convert(value, CartJS.settings.currency, currency);
        if ((((_ref = window.Currency) != null ? _ref.moneyFormats : void 0) != null) && (currency in window.Currency.moneyFormats)) {
          format = window.Currency.moneyFormats[currency][formatName];
        }
      }
      if (((_ref1 = window.Shopify) != null ? _ref1.formatMoney : void 0) != null) {
        return Shopify.formatMoney(value, format);
      } else {
        return value;
      }
    },
    getSizedImageUrl: function(src, size) {
      var _ref, _ref1;
      if (((_ref = window.Shopify) != null ? (_ref1 = _ref.Image) != null ? _ref1.getSizedImageUrl : void 0 : void 0) != null) {
        return Shopify.Image.getSizedImageUrl(src, size);
      } else {
        return src;
      }
    }
  };

  queue = [];

  processing = false;

  CartJS.Queue = {
    add: function(url, data, options) {
      var request;
      if (options == null) {
        options = {};
      }
      request = {
        url: url,
        data: data,
        type: options.type || 'POST',
        dataType: options.dataType || 'json',
        success: CartJS.Utils.ensureArray(options.success),
        error: CartJS.Utils.ensureArray(options.error),
        complete: CartJS.Utils.ensureArray(options.complete)
      };
      if (options.updateCart) {
        request.success.push(CartJS.cart.update);
      }
      queue.push(request);
      if (processing) {
        return;
      }
      jQuery(document).trigger('cart.requestStarted', [CartJS.cart]);
      return CartJS.Queue.process();
    },
    process: function() {
      var params;
      if (!queue.length) {
        processing = false;
        jQuery(document).trigger('cart.requestComplete', [CartJS.cart]);
        return;
      }
      processing = true;
      params = queue.shift();
      params.complete = CartJS.Queue.process;
      return jQuery.ajax(params);
    }
  };

  CartJS.Core = {
    getCart: function(options) {
      if (options == null) {
        options = {};
      }
      options.type = 'GET';
      options.updateCart = true;
      return CartJS.Queue.add('/cart.js', {}, options);
    },
    addItem: function(id, quantity, properties, options) {
      var data;
      if (quantity == null) {
        quantity = 1;
      }
      if (properties == null) {
        properties = {};
      }
      if (options == null) {
        options = {};
      }
      data = CartJS.Utils.wrapKeys(properties);
      data.id = id;
      data.quantity = quantity;
      CartJS.Queue.add('/cart/add.js', data, options);
      return CartJS.Core.getCart();
    },
    updateItem: function(line, quantity, properties, options) {
      var data;
      if (properties == null) {
        properties = {};
      }
      if (options == null) {
        options = {};
      }
      data = CartJS.Utils.wrapKeys(properties);
      data.line = line;
      if (quantity != null) {
        data.quantity = quantity;
      }
      options.updateCart = true;
      return CartJS.Queue.add('/cart/change.js', data, options);
    },
    removeItem: function(line, options) {
      if (options == null) {
        options = {};
      }
      return CartJS.Core.updateItem(line, 0, {}, options);
    },
    updateItemById: function(id, quantity, properties, options) {
      var data;
      if (properties == null) {
        properties = {};
      }
      if (options == null) {
        options = {};
      }
      data = CartJS.Utils.wrapKeys(properties);
      data.id = id;
      if (quantity != null) {
        data.quantity = quantity;
      }
      options.updateCart = true;
      return CartJS.Queue.add('/cart/change.js', data, options);
    },
    updateItemQuantitiesById: function(updates, options) {
      if (updates == null) {
        updates = {};
      }
      if (options == null) {
        options = {};
      }
      options.updateCart = true;
      return CartJS.Queue.add('/cart/update.js', {
        updates: updates
      }, options);
    },
    removeItemById: function(id, options) {
      var data;
      if (options == null) {
        options = {};
      }
      data = {
        id: id,
        quantity: 0
      };
      options.updateCart = true;
      return CartJS.Queue.add('/cart/change.js', data, options);
    },
    clear: function(options) {
      if (options == null) {
        options = {};
      }
      options.updateCart = true;
      return CartJS.Queue.add('/cart/clear.js', {}, options);
    },
    getAttribute: function(attributeName, defaultValue) {
      if (attributeName in CartJS.cart.attributes) {
        return CartJS.cart.attributes[attributeName];
      } else {
        return defaultValue;
      }
    },
    setAttribute: function(attributeName, value, options) {
      var attributes;
      if (options == null) {
        options = {};
      }
      attributes = {};
      attributes[attributeName] = value;
      return CartJS.Core.setAttributes(attributes, options);
    },
    getAttributes: function() {
      return CartJS.cart.attributes;
    },
    setAttributes: function(attributes, options) {
      if (attributes == null) {
        attributes = {};
      }
      if (options == null) {
        options = {};
      }
      options.updateCart = true;
      return CartJS.Queue.add('/cart/update.js', CartJS.Utils.wrapKeys(attributes, 'attributes'), options);
    },
    clearAttributes: function(options) {
      if (options == null) {
        options = {};
      }
      options.updateCart = true;
      return CartJS.Queue.add('/cart/update.js', CartJS.Utils.wrapKeys(CartJS.Core.getAttributes(), 'attributes', ''), options);
    },
    getNote: function() {
      return CartJS.cart.note;
    },
    setNote: function(note, options) {
      if (options == null) {
        options = {};
      }
      options.updateCart = true;
      return CartJS.Queue.add('/cart/update.js', {
        note: note
      }, options);
    }
  };

  $document = jQuery(document);

  CartJS.Data = {
    init: function() {
      CartJS.Data.setEventListeners('on');
      return CartJS.Data.render(null, CartJS.cart);
    },
    destroy: function() {
      return CartJS.Data.setEventListeners('off');
    },
    setEventListeners: function(method) {
      $document[method]('click', '[data-cart-add]', CartJS.Data.add);
      $document[method]('click', '[data-cart-remove]', CartJS.Data.remove);
      $document[method]('click', '[data-cart-remove-id]', CartJS.Data.removeById);
      $document[method]('click', '[data-cart-update]', CartJS.Data.update);
      $document[method]('click', '[data-cart-update-id]', CartJS.Data.updateById);
      $document[method]('click', '[data-cart-clear]', CartJS.Data.clear);
      $document[method]('change', '[data-cart-toggle]', CartJS.Data.toggle);
      $document[method]('change', '[data-cart-toggle-attribute]', CartJS.Data.toggleAttribute);
      $document[method]('submit', '[data-cart-submit]', CartJS.Data.submit);
      return $document[method]('cart.requestComplete', CartJS.Data.render);
    },
    add: function(e) {
      var $this;
      e.preventDefault();
      $this = jQuery(this);
      return CartJS.Core.addItem($this.attr('data-cart-add'), $this.attr('data-cart-quantity'));
    },
    remove: function(e) {
      var $this;
      e.preventDefault();
      $this = jQuery(this);
      return CartJS.Core.removeItem($this.attr('data-cart-remove'));
    },
    removeById: function(e) {
      var $this;
      e.preventDefault();
      $this = jQuery(this);
      return CartJS.Core.removeItemById($this.attr('data-cart-remove-id'));
    },
    update: function(e) {
      var $this;
      e.preventDefault();
      $this = jQuery(this);
      return CartJS.Core.updateItem($this.attr('data-cart-update'), $this.attr('data-cart-quantity'));
    },
    updateById: function(e) {
      var $this;
      e.preventDefault();
      $this = jQuery(this);
      return CartJS.Core.updateItemById($this.attr('data-cart-update-id'), $this.attr('data-cart-quantity'));
    },
    clear: function(e) {
      e.preventDefault();
      return CartJS.Core.clear();
    },
    toggle: function(e) {
      var $input, id;
      $input = jQuery(this);
      id = $input.attr('data-cart-toggle');
      if ($input.is(':checked')) {
        return CartJS.Core.addItem(id);
      } else {
        return CartJS.Core.removeItemById(id);
      }
    },
    toggleAttribute: function(e) {
      var $input, attribute;
      $input = jQuery(this);
      attribute = $input.attr('data-cart-toggle-attribute');
      return CartJS.Core.setAttribute(attribute, $input.is(':checked') ? 'Yes' : '');
    },
    submit: function(e) {
      var dataArray, id, properties, quantity;
      e.preventDefault();
      dataArray = jQuery(this).serializeArray();
      id = void 0;
      quantity = void 0;
      properties = {};
      jQuery.each(dataArray, function(i, item) {
        if (item.name === 'id') {
          return id = item.value;
        } else if (item.name === 'quantity') {
          return quantity = item.value;
        } else {
          return properties[item.name] = item.value;
        }
      });
      return CartJS.Core.addItem(id, quantity, CartJS.Utils.unwrapKeys(properties));
    },
    render: function(e, cart) {
      var context;
      context = {
        'item_count': cart.item_count,
        'total_price': cart.total_price,
        'total_price_money': CartJS.Utils.formatMoney(cart.total_price, CartJS.settings.moneyFormat, 'money_format', (typeof Currency !== "undefined" && Currency !== null ? Currency.currentCurrency : void 0) != null ? Currency.currentCurrency : void 0),
        'total_price_money_with_currency': CartJS.Utils.formatMoney(cart.total_price, CartJS.settings.moneyWithCurrencyFormat, 'money_with_currency_format', (typeof Currency !== "undefined" && Currency !== null ? Currency.currentCurrency : void 0) != null ? Currency.currentCurrency : void 0)
      };
      return jQuery('[data-cart-render]').each(function() {
        var $this;
        $this = jQuery(this);
        return $this.html(context[$this.attr('data-cart-render')]);
      });
    }
  };

  if ('rivets' in window) {
    CartJS.Rivets = {
      model: null,
      boundViews: [],
      init: function() {
        CartJS.Rivets.bindViews();
        if (CartJS.IE8 != null) {
          return CartJS.IE8.init();
        }
      },
      destroy: function() {
        CartJS.Rivets.unbindViews();
        if (CartJS.IE8 != null) {
          return CartJS.IE8.destroy();
        }
      },
      bindViews: function() {
        CartJS.Utils.log('Rivets.js is present, binding views.');
        CartJS.Rivets.unbindViews();
        CartJS.Rivets.model = CartJS.Utils.extend({
          cart: CartJS.cart
        }, CartJS.settings.rivetsModels);
        if (window.Currency != null) {
          CartJS.Rivets.model.Currency = window.Currency;
        }
        return jQuery('[data-cart-view]').each(function() {
          var view;
          view = rivets.bind(jQuery(this), CartJS.Rivets.model);
          return CartJS.Rivets.boundViews.push(view);
        });
      },
      unbindViews: function() {
        var view, _i, _len, _ref;
        _ref = CartJS.Rivets.boundViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.unbind();
        }
        return CartJS.Rivets.boundViews = [];
      }
    };
    rivets.formatters.eq = function(a, b) {
      return a === b;
    };
    rivets.formatters.lt = function(a, b) {
      return a < b;
    };
    rivets.formatters.gt = function(a, b) {
      return a > b;
    };
    rivets.formatters.not = function(a) {
      return !a;
    };
    rivets.formatters.empty = function(a) {
      return !a.length;
    };
    rivets.formatters.plus = function(a, b) {
      return parseInt(a) + parseInt(b);
    };
    rivets.formatters.minus = function(a, b) {
      return parseInt(a) - parseInt(b);
    };
    rivets.formatters.prepend = function(a, b) {
      return b + a;
    };
    rivets.formatters.append = function(a, b) {
      return a + b;
    };
    rivets.formatters.money = function(value, currency) {
      return CartJS.Utils.formatMoney(value, CartJS.settings.moneyFormat, 'money_format', currency);
    };
    rivets.formatters.money_with_currency = function(value, currency) {
      return CartJS.Utils.formatMoney(value, CartJS.settings.moneyWithCurrencyFormat, 'money_with_currency_format', currency);
    };
    rivets.formatters.productImageSize = function(src, size) {
      return CartJS.Utils.getSizedImageUrl(src, size);
    };
  } else {
    CartJS.Rivets = {
      init: function() {},
      destroy: function() {}
    };
  }

  CartJS.factory = function(exports) {
    exports.init = CartJS.init;
    exports.configure = CartJS.configure;
    exports.cart = CartJS.cart;
    exports.settings = CartJS.settings;
    exports.getCart = CartJS.Core.getCart;
    exports.addItem = CartJS.Core.addItem;
    exports.updateItem = CartJS.Core.updateItem;
    exports.updateItemById = CartJS.Core.updateItemById;
    exports.updateItemQuantitiesById = CartJS.Core.updateItemQuantitiesById;
    exports.removeItem = CartJS.Core.removeItem;
    exports.removeItemById = CartJS.Core.removeItemById;
    exports.clear = CartJS.Core.clear;
    exports.getAttribute = CartJS.Core.getAttribute;
    exports.setAttribute = CartJS.Core.setAttribute;
    exports.getAttributes = CartJS.Core.getAttributes;
    exports.setAttributes = CartJS.Core.setAttributes;
    exports.clearAttributes = CartJS.Core.clearAttributes;
    exports.getNote = CartJS.Core.getNote;
    exports.setNote = CartJS.Core.setNote;
    return exports.render = CartJS.Data.render;
  };

  if (typeof exports === 'object') {
    CartJS.factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], function(exports) {
      CartJS.factory(this.CartJS = exports);
      return exports;
    });
  } else {
    CartJS.factory(this.CartJS = {});
  }

}).call(this);

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.contentful = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";function _interopRequireDefault(e){return e&&e.__esModule?e:{"default":e}}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function createClient(e){return new Client(e||{})}function isParseableResource(e){return e&&e.sys&&e.sys.type in parseableResourceTypes}function parseResource(e){var t=parseableResourceTypes[e.sys.type];return t.parse(e)}function makeSearchResultParser(e){return function(t){walkMutate(t,isParseableResource,parseResource);var n=e.resolveLinks?(0,_contentfulResolveResponse2["default"])(t):t.items;return Object.defineProperties(n,{limit:{value:t.limit,enumerable:!1},skip:{value:t.skip,enumerable:!1},total:{value:t.total,enumerable:!1}}),n}}function stringifyArrayValues(e){return keys(e).reduce(function(t,n){var r=e[n];return t[n]=Array.isArray(r)?r.join(","):r,t},{})}function walkMutate(e,t,n){if(t(e))return n(e);if(e&&"object"==typeof e)for(var r in e)e[r]=walkMutate(e[r],t,n);return e}function nodeify(e,t){return t?e.then(function(e){return t(null,e),e})["catch"](function(e){throw t(e),e}):e}Object.defineProperty(exports,"__esModule",{value:!0});var _slicedToArray=function(){function e(e,t){var n=[],r=!0,s=!1,i=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(o){s=!0,i=o}finally{try{!r&&u["return"]&&u["return"]()}finally{if(s)throw i}}return n}return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return e(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),_createClass=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();exports.createClient=createClient;var _axios=require("axios"),_axios2=_interopRequireDefault(_axios),_contentfulResolveResponse=require("contentful-resolve-response"),_contentfulResolveResponse2=_interopRequireDefault(_contentfulResolveResponse),_querystring=require("querystring"),_querystring2=_interopRequireDefault(_querystring),Client=function(){function e(t){var n=t.accessToken,r=t.space,s=t.secure,i=t.host,a=t.headers,u=t.agent;if(_classCallCheck(this,e),!n)throw new TypeError("Expected property accessToken");if(!r)throw new TypeError("Expected property space");var o=s===!1,l=i&&i.split(":")||[],c=_slicedToArray(l,2),y=c[0],f=c[1];y=y||"cdn.contentful.com",f=f||(o?80:443),this.options={baseUrl:(o?"http":"https")+"://"+y+":"+f+"/spaces/"+r,accessToken:n,headers:a||{},resolveLinks:!0},this.agent=u}return _createClass(e,[{key:"_request",value:function(e,t){t||(t={}),t.access_token=this.options.accessToken;var n={headers:this.options.headers,method:"get",url:""+this.options.baseUrl+e+"?"+_querystring2["default"].stringify(t)};return this.agent&&(n.agent=this.agent),n.headers["Content-Type"]="application/vnd.contentful.delivery.v1+json",n.headers["X-Contentful-User-Agent"]="contentful.js/2.x",(0,_axios2["default"])(n).then(function(e){return e.data})["catch"](function(e){throw e.data})}},{key:"asset",value:function(e,t){return nodeify(this._request("/assets/"+e).then(parseResource),t)}},{key:"assets",value:function(e,t){var n=new Query(e),r=this._request("/assets",n).then(makeSearchResultParser({resolveLinks:this.options.resolveLinks}));return nodeify(r,t)}},{key:"contentType",value:function(e,t){var n=this._request("/content_types/"+e).then(ContentType.parse);return nodeify(n,t)}},{key:"contentTypes",value:function(e,t){var n=new Query(e),r=this._request("/content_types",n).then(makeSearchResultParser({resolveLinks:this.options.resolveLinks}));return nodeify(r,t)}},{key:"entry",value:function(e,t){var n=this._request("/entries/"+e).then(Entry.parse);return nodeify(n,t)}},{key:"entries",value:function(e,t){var n=new Query(e),r=this._request("/entries",n).then(makeSearchResultParser({resolveLinks:this.options.resolveLinks}));return nodeify(r,t)}},{key:"space",value:function(e){return nodeify(this._request(""),e)}},{key:"_pagedSync",value:function(e){var t=this;return this._request("/sync",e.query).then(function(n){return e.append(n),e.done?{items:e.items,nextSyncToken:e.nextSyncToken}:t._pagedSync(e)})}},{key:"sync",value:function(e,t){if(!e||!e.initial&&!e.nextSyncToken)throw new Error("Please provide either the initial flag or a nextSyncToken for syncing");e.nextSyncToken&&(e.sync_token=e.nextSyncToken,delete e.initial,delete e.nextSyncToken);var n=new Query(e),r=makeSearchResultParser({resolveLinks:!1}),s=this._pagedSync(new Sync(n)).then(function(e){return e.items=r(e),e});return nodeify(s,t)}}]),e}(),Asset=function(){function e(t){var n=t.sys,r=t.fields;_classCallCheck(this,e),this.sys=new Sys(n),this.fields=r}return _createClass(e,null,[{key:"parse",value:function(t){return new e(t)}}]),e}(),Entry=function(){function e(t){var n=t.sys,r=t.fields;_classCallCheck(this,e),this.sys=new Sys(n),this.fields=r}return _createClass(e,null,[{key:"parse",value:function(t){return new e(t)}}]),e}(),ContentType=function(){function e(t){var n=t.sys,r=t.fields,s=t.name,i=t.displayField;_classCallCheck(this,e),this.sys=new Sys(n),this.name=s,this.displayField=i,this.fields=r&&r.map(Field.parse)}return _createClass(e,null,[{key:"parse",value:function(t){return new e(t)}}]),e}(),Field=function(){function e(t){_classCallCheck(this,e);for(var n in t)this[n]=t[n]}return _createClass(e,null,[{key:"parse",value:function(t){return new e(t)}}]),e}(),Query=function(){function e(t){_classCallCheck(this,e);for(var n in t)this[n]=t[n]}return _createClass(e,[{key:"toQueryString",value:function(){return _querystring2["default"].stringify(this)}}],[{key:"parse",value:function(t){return new e(stringifyArrayValues(t))}}]),e}(),Space=function(){function e(){var t=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];_classCallCheck(this,e);for(var n in t)this[n]=t[n]}return _createClass(e,null,[{key:"parse",value:function(t){return new e(t)}}]),e}(),Sys=function(){function e(t){var n=t.id,r=t.revision,s=t.type,i=t.locale,a=t.contentType,u=t.createdAt,o=(t.linkType,t.updatedAt),l=t.space;_classCallCheck(this,e),this.id=n,this.revision=r,this.type=s,this.locale=i,this.space=l&&Link.parse(l),this.contentType=a&&new Link(a),this.createdAt=u&&new Date(u),this.updatedAt=o&&new Date(o)}return _createClass(e,null,[{key:"parse",value:function(t){return new e(t)}}]),e}(),Link=function(){function e(t){var n=t.sys;_classCallCheck(this,e),this.sys=new Sys(n)}return _createClass(e,null,[{key:"parse",value:function(t){return new e(t)}}]),e}(),Sync=function(){function e(t){_classCallCheck(this,e),this.query=t,this.items=[],this.done=!1}return _createClass(e,[{key:"append",value:function(e){var t=this;if(this.items=this.items.concat(e.items),e.nextPageUrl){var n=e.nextPageUrl.split("?");this.query=Object.keys(this.query).reduce(function(e,n){return"initial"!==n&&"type"!==n&&"sync_token"!==n&&(e[n]=t.query[n]),e},{}),this.query.sync_token=_querystring2["default"].parse(n[1]).sync_token}else if(e.nextSyncUrl){var r=e.nextSyncUrl.split("?");this.nextSyncToken=_querystring2["default"].parse(r[1]).sync_token,this.done=!0}}}]),e}(),parseableResourceTypes={Asset:Asset,ContentType:ContentType,Entry:Entry,Space:Space};


},{"axios":2,"contentful-resolve-response":23,"querystring":22}],2:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":4}],3:[function(require,module,exports){
'use strict';

/*global ActiveXObject:true*/

var defaults = require('./../defaults');
var utils = require('./../utils');
var buildURL = require('./../helpers/buildURL');
var parseHeaders = require('./../helpers/parseHeaders');
var transformData = require('./../helpers/transformData');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var btoa = window.btoa || require('./../helpers/btoa');

module.exports = function xhrAdapter(resolve, reject, config) {
  // Transform request data
  var data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Merge headers
  var requestHeaders = utils.merge(
    defaults.headers.common,
    defaults.headers[config.method] || {},
    config.headers || {}
  );

  if (utils.isFormData(data)) {
    delete requestHeaders['Content-Type']; // Let the browser set it
  }

  var Adapter = (XMLHttpRequest || ActiveXObject);
  var loadEvent = 'onreadystatechange';
  var xDomain = false;

  // For IE 8/9 CORS support
  if (!isURLSameOrigin(config.url) && window.XDomainRequest) {
    Adapter = window.XDomainRequest;
    loadEvent = 'onload';
    xDomain = true;
  }

  // HTTP basic authentication
  if (config.auth) {
    var username = config.auth.username || '';
    var password = config.auth.password || '';
    requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
  }

  // Create the request
  var request = new Adapter('Microsoft.XMLHTTP');
  request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

  // Set the request timeout in MS
  request.timeout = config.timeout;

  // Listen for ready state
  request[loadEvent] = function handleReadyState() {
    if (request && (request.readyState === 4 || xDomain)) {
      // Prepare the response
      var responseHeaders = xDomain ? null : parseHeaders(request.getAllResponseHeaders());
      var responseData = ['text', ''].indexOf(config.responseType || '') !== -1 ? request.responseText : request.response;
      var response = {
        data: transformData(
          responseData,
          responseHeaders,
          config.transformResponse
        ),
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config
      };
      // Resolve or reject the Promise based on the status
      ((request.status >= 200 && request.status < 300) || (xDomain && request.responseText) ?
        resolve :
        reject)(response);

      // Clean up request
      request = null;
    }
  };

  // Add xsrf header
  // This is only done if running in a standard browser environment.
  // Specifically not if we're in a web worker, or react-native.
  if (utils.isStandardBrowserEnv()) {
    var cookies = require('./../helpers/cookies');

    // Add xsrf header
    var xsrfValue =  config.withCredentials || isURLSameOrigin(config.url) ?
        cookies.read(config.xsrfCookieName || defaults.xsrfCookieName) :
        undefined;

    if (xsrfValue) {
      requestHeaders[config.xsrfHeaderName || defaults.xsrfHeaderName] = xsrfValue;
    }
  }

  // Add headers to the request
  if (!xDomain) {
    utils.forEach(requestHeaders, function setRequestHeader(val, key) {
      if (!data && key.toLowerCase() === 'content-type') {
        // Remove Content-Type if data is undefined
        delete requestHeaders[key];
      } else {
        // Otherwise add header to the request
        request.setRequestHeader(key, val);
      }
    });
  }

  // Add withCredentials to request if needed
  if (config.withCredentials) {
    request.withCredentials = true;
  }

  // Add responseType to request if needed
  if (config.responseType) {
    try {
      request.responseType = config.responseType;
    } catch (e) {
      if (request.responseType !== 'json') {
        throw e;
      }
    }
  }

  if (utils.isArrayBuffer(data)) {
    data = new DataView(data);
  }

  // Send the request
  request.send(data);
};

},{"./../defaults":7,"./../helpers/btoa":9,"./../helpers/buildURL":10,"./../helpers/cookies":12,"./../helpers/isURLSameOrigin":14,"./../helpers/parseHeaders":15,"./../helpers/transformData":17,"./../utils":18}],4:[function(require,module,exports){
'use strict';

var defaults = require('./defaults');
var utils = require('./utils');
var dispatchRequest = require('./core/dispatchRequest');
var InterceptorManager = require('./core/InterceptorManager');
var isAbsoluteURL = require('./helpers/isAbsoluteURL');
var combineURLs = require('./helpers/combineURLs');
var bind = require('./helpers/bind');

function Axios(defaultConfig) {
  this.defaultConfig = utils.merge({
    headers: {},
    timeout: defaults.timeout,
    transformRequest: defaults.transformRequest,
    transformResponse: defaults.transformResponse
  }, defaultConfig);

  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = utils.merge({
      url: arguments[0]
    }, arguments[1]);
  }

  config = utils.merge(this.defaultConfig, { method: 'get' }, config);

  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  }

  // Don't allow overriding defaults.withCredentials
  config.withCredentials = config.withCredentials || defaults.withCredentials;

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

var defaultInstance = new Axios();

var axios = module.exports = bind(Axios.prototype.request, defaultInstance);

axios.create = function create(defaultConfig) {
  return new Axios(defaultConfig);
};

// Expose defaults
axios.defaults = defaults;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose interceptors
axios.interceptors = defaultInstance.interceptors;

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
  axios[method] = bind(Axios.prototype[method], defaultInstance);
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
  axios[method] = bind(Axios.prototype[method], defaultInstance);
});

},{"./core/InterceptorManager":5,"./core/dispatchRequest":6,"./defaults":7,"./helpers/bind":8,"./helpers/combineURLs":11,"./helpers/isAbsoluteURL":13,"./helpers/spread":16,"./utils":18}],5:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":18}],6:[function(require,module,exports){
(function (process){
'use strict';

/**
 * Dispatch a request to the server using whichever adapter
 * is supported by the current environment.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  return new Promise(function executor(resolve, reject) {
    try {
      if ((typeof XMLHttpRequest !== 'undefined') || (typeof ActiveXObject !== 'undefined')) {
        // For browsers use XHR adapter
        require('../adapters/xhr')(resolve, reject, config);
      } else if (typeof process !== 'undefined') {
        // For node use HTTP adapter
        require('../adapters/http')(resolve, reject, config);
      }
    } catch (e) {
      reject(e);
    }
  });
};


}).call(this,require('_process'))
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9heGlvcy9saWIvY29yZS9kaXNwYXRjaFJlcXVlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBEaXNwYXRjaCBhIHJlcXVlc3QgdG8gdGhlIHNlcnZlciB1c2luZyB3aGljaGV2ZXIgYWRhcHRlclxuICogaXMgc3VwcG9ydGVkIGJ5IHRoZSBjdXJyZW50IGVudmlyb25tZW50LlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgVGhlIGNvbmZpZyB0aGF0IGlzIHRvIGJlIHVzZWQgZm9yIHRoZSByZXF1ZXN0XG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gVGhlIFByb21pc2UgdG8gYmUgZnVsZmlsbGVkXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGlzcGF0Y2hSZXF1ZXN0KGNvbmZpZykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICgodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJykgfHwgKHR5cGVvZiBBY3RpdmVYT2JqZWN0ICE9PSAndW5kZWZpbmVkJykpIHtcbiAgICAgICAgLy8gRm9yIGJyb3dzZXJzIHVzZSBYSFIgYWRhcHRlclxuICAgICAgICByZXF1aXJlKCcuLi9hZGFwdGVycy94aHInKShyZXNvbHZlLCByZWplY3QsIGNvbmZpZyk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBGb3Igbm9kZSB1c2UgSFRUUCBhZGFwdGVyXG4gICAgICAgIHJlcXVpcmUoJy4uL2FkYXB0ZXJzL2h0dHAnKShyZXNvbHZlLCByZWplY3QsIGNvbmZpZyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4iXX0=
},{"../adapters/http":3,"../adapters/xhr":3,"_process":19}],7:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var PROTECTION_PREFIX = /^\)\]\}',?\n/;
var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

module.exports = {
  transformRequest: [function transformResponseJSON(data, headers) {
    if (utils.isFormData(data)) {
      return data;
    }
    if (utils.isArrayBuffer(data)) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isObject(data) && !utils.isFile(data) && !utils.isBlob(data)) {
      // Set application/json if no Content-Type has been specified
      if (!utils.isUndefined(headers)) {
        utils.forEach(headers, function processContentTypeHeader(val, key) {
          if (key.toLowerCase() === 'content-type') {
            headers['Content-Type'] = val;
          }
        });

        if (utils.isUndefined(headers['Content-Type'])) {
          headers['Content-Type'] = 'application/json;charset=utf-8';
        }
      }
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponseJSON(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      data = data.replace(PROTECTION_PREFIX, '');
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    },
    patch: utils.merge(DEFAULT_CONTENT_TYPE),
    post: utils.merge(DEFAULT_CONTENT_TYPE),
    put: utils.merge(DEFAULT_CONTENT_TYPE)
  },

  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
};

},{"./utils":18}],8:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],9:[function(require,module,exports){
'use strict';

// btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function InvalidCharacterError(message) {
  this.message = message;
}
InvalidCharacterError.prototype = new Error;
InvalidCharacterError.prototype.code = 5;
InvalidCharacterError.prototype.name = 'InvalidCharacterError';

function btoa(input) {
  var str = String(input);
  var output = '';
  for (
    // initialize result and counter
    var block, charCode, idx = 0, map = chars;
    // if the next str index does not exist:
    //   change the mapping table to "="
    //   check if d has no fractional digits
    str.charAt(idx | 0) || (map = '=', idx % 1);
    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
  ) {
    charCode = str.charCodeAt(idx += 3 / 4);
    if (charCode > 0xFF) {
      throw new InvalidCharacterError('INVALID_CHARACTER_ERR: DOM Exception 5');
    }
    block = block << 8 | charCode;
  }
  return output;
}

module.exports = btoa;

},{}],10:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      }

      if (!utils.isArray(val)) {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};


},{"./../utils":18}],11:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '');
};

},{}],12:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
  (function standardBrowserEnv() {
    return {
      write: function write(name, value, expires, path, domain, secure) {
        var cookie = [];
        cookie.push(name + '=' + encodeURIComponent(value));

        if (utils.isNumber(expires)) {
          cookie.push('expires=' + new Date(expires).toGMTString());
        }

        if (utils.isString(path)) {
          cookie.push('path=' + path);
        }

        if (utils.isString(domain)) {
          cookie.push('domain=' + domain);
        }

        if (secure === true) {
          cookie.push('secure');
        }

        document.cookie = cookie.join('; ');
      },

      read: function read(name) {
        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return (match ? decodeURIComponent(match[3]) : null);
      },

      remove: function remove(name) {
        this.write(name, '', Date.now() - 86400000);
      }
    };
  })() :

  // Non standard browser env (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return {
      write: function write() {},
      read: function read() { return null; },
      remove: function remove() {}
    };
  })()
);

},{"./../utils":18}],13:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

},{}],14:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
  (function standardBrowserEnv() {
    var msie = /(msie|trident)/i.test(navigator.userAgent);
    var urlParsingNode = document.createElement('a');
    var originURL;

    /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
    function resolveURL(url) {
      var href = url;

      if (msie) {
        // IE needs attribute set twice to normalize properties
        urlParsingNode.setAttribute('href', href);
        href = urlParsingNode.href;
      }

      urlParsingNode.setAttribute('href', href);

      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
      return {
        href: urlParsingNode.href,
        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
        host: urlParsingNode.host,
        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
        hostname: urlParsingNode.hostname,
        port: urlParsingNode.port,
        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                  urlParsingNode.pathname :
                  '/' + urlParsingNode.pathname
      };
    }

    originURL = resolveURL(window.location.href);

    /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
    return function isURLSameOrigin(requestURL) {
      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
      return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
    };
  })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return function isURLSameOrigin() {
      return true;
    };
  })()
);

},{"./../utils":18}],15:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    }
  });

  return parsed;
};

},{"./../utils":18}],16:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],17:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};

},{"./../utils":18}],18:[function(require,module,exports){
'use strict';

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return toString.call(val) === '[object FormData]';
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  typeof document.createElement -> undefined
 */
function isStandardBrowserEnv() {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object' && !isArray(obj)) {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    result[key] = val;
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  trim: trim
};

},{}],19:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],20:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],21:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],22:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":20,"./encode":21}],23:[function(require,module,exports){
'use strict';

module.exports = resolveResponse;

function resolveResponse(response) {
  walkMutate(response, isLink, function(link) {
    return getLink(response, link) || link;
  });
  return response.items || [];
}

function isLink(object) {
  return object && object.sys && object.sys.type === 'Link';
}

function getLink(response, link) {
  var type = link.sys.linkType;
  var id = link.sys.id;
  var pred = function(resource) {
    return resource.sys.type === type && resource.sys.id === id;
  };
  return find(response.items, pred) ||
    response.includes && find(response.includes[type], pred);
}

function walkMutate(input, pred, mutator) {
  if (pred(input))
    return mutator(input);

  if (input && typeof input == 'object') {
    for (var key in input) {
      if (input.hasOwnProperty(key)) {
        input[key] = walkMutate(input[key], pred, mutator);
      }
    }
    return input;
  }

  return input;
}

function find (array, pred) {
  if (!array) {
    return;
  }
  for (var i = 0, len = array.length; i < len; i++) {
    if (pred(array[i])) {
      return array[i];
    }
  }
}

},{}]},{},[1])(1)
});


//# sourceMappingURL=contentful.min.js.map
;
(function ($) {

  var focused = true;

  //FlexSlider: Object Instance
  $.flexslider = function(el, options) {
    var slider = $(el);

    // making variables public
    slider.vars = $.extend({}, $.flexslider.defaults, options);

    var namespace = slider.vars.namespace,
        msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
        touch = (( "ontouchstart" in window ) || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && slider.vars.touch,
        // depricating this idea, as devices are being released with both of these events
        eventType = "click touchend MSPointerUp keyup",
        watchedEvent = "",
        watchedEventClearTimer,
        vertical = slider.vars.direction === "vertical",
        reverse = slider.vars.reverse,
        carousel = (slider.vars.itemWidth > 0),
        fade = slider.vars.animation === "fade",
        asNav = slider.vars.asNavFor !== "",
        methods = {};

    // Store a reference to the slider object
    $.data(el, "flexslider", slider);

    // Private slider methods
    methods = {
      init: function() {
        slider.animating = false;
        // Get current slide and make sure it is a number
        slider.currentSlide = parseInt( ( slider.vars.startAt ? slider.vars.startAt : 0), 10 );
        if ( isNaN( slider.currentSlide ) ) { slider.currentSlide = 0; }
        slider.animatingTo = slider.currentSlide;
        slider.atEnd = (slider.currentSlide === 0 || slider.currentSlide === slider.last);
        slider.containerSelector = slider.vars.selector.substr(0,slider.vars.selector.search(' '));
        slider.slides = $(slider.vars.selector, slider);
        slider.container = $(slider.containerSelector, slider);
        slider.count = slider.slides.length;
        // SYNC:
        slider.syncExists = $(slider.vars.sync).length > 0;
        // SLIDE:
        if (slider.vars.animation === "slide") { slider.vars.animation = "swing"; }
        slider.prop = (vertical) ? "top" : "marginLeft";
        slider.args = {};
        // SLIDESHOW:
        slider.manualPause = false;
        slider.stopped = false;
        //PAUSE WHEN INVISIBLE
        slider.started = false;
        slider.startTimeout = null;
        // TOUCH/USECSS:
        slider.transitions = !slider.vars.video && !fade && slider.vars.useCSS && (function() {
          var obj = document.createElement('div'),
              props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
          for (var i in props) {
            if ( obj.style[ props[i] ] !== undefined ) {
              slider.pfx = props[i].replace('Perspective','').toLowerCase();
              slider.prop = "-" + slider.pfx + "-transform";
              return true;
            }
          }
          return false;
        }());
        slider.ensureAnimationEnd = '';
        // CONTROLSCONTAINER:
        if (slider.vars.controlsContainer !== "") slider.controlsContainer = $(slider.vars.controlsContainer).length > 0 && $(slider.vars.controlsContainer);
        // MANUAL:
        if (slider.vars.manualControls !== "") slider.manualControls = $(slider.vars.manualControls).length > 0 && $(slider.vars.manualControls);

        // CUSTOM DIRECTION NAV:
        if (slider.vars.customDirectionNav !== "") slider.customDirectionNav = $(slider.vars.customDirectionNav).length === 2 && $(slider.vars.customDirectionNav);

        // RANDOMIZE:
        if (slider.vars.randomize) {
          slider.slides.sort(function() { return (Math.round(Math.random())-0.5); });
          slider.container.empty().append(slider.slides);
        }

        slider.doMath();

        // INIT
        slider.setup("init");

        // CONTROLNAV:
        if (slider.vars.controlNav) { methods.controlNav.setup(); }

        // DIRECTIONNAV:
        if (slider.vars.directionNav) { methods.directionNav.setup(); }

        // KEYBOARD:
        if (slider.vars.keyboard && ($(slider.containerSelector).length === 1 || slider.vars.multipleKeyboard)) {
          $(document).bind('keyup', function(event) {
            var keycode = event.keyCode;
            if (!slider.animating && (keycode === 39 || keycode === 37)) {
              var target = (keycode === 39) ? slider.getTarget('next') :
                           (keycode === 37) ? slider.getTarget('prev') : false;
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }
          });
        }
        // MOUSEWHEEL:
        if (slider.vars.mousewheel) {
          slider.bind('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault();
            var target = (delta < 0) ? slider.getTarget('next') : slider.getTarget('prev');
            slider.flexAnimate(target, slider.vars.pauseOnAction);
          });
        }

        // PAUSEPLAY
        if (slider.vars.pausePlay) { methods.pausePlay.setup(); }

        //PAUSE WHEN INVISIBLE
        if (slider.vars.slideshow && slider.vars.pauseInvisible) { methods.pauseInvisible.init(); }

        // SLIDSESHOW
        if (slider.vars.slideshow) {
          if (slider.vars.pauseOnHover) {
            slider.hover(function() {
              if (!slider.manualPlay && !slider.manualPause) { slider.pause(); }
            }, function() {
              if (!slider.manualPause && !slider.manualPlay && !slider.stopped) { slider.play(); }
            });
          }
          // initialize animation
          //If we're visible, or we don't use PageVisibility API
          if(!slider.vars.pauseInvisible || !methods.pauseInvisible.isHidden()) {
            (slider.vars.initDelay > 0) ? slider.startTimeout = setTimeout(slider.play, slider.vars.initDelay) : slider.play();
          }
        }

        // ASNAV:
        if (asNav) { methods.asNav.setup(); }

        // TOUCH
        if (touch && slider.vars.touch) { methods.touch(); }

        // FADE&&SMOOTHHEIGHT || SLIDE:
        if (!fade || (fade && slider.vars.smoothHeight)) { $(window).bind("resize orientationchange focus", methods.resize); }

        slider.find("img").attr("draggable", "false");

        // API: start() Callback
        setTimeout(function(){
          slider.vars.start(slider);
        }, 200);
      },
      asNav: {
        setup: function() {
          slider.asNav = true;
          slider.animatingTo = Math.floor(slider.currentSlide/slider.move);
          slider.currentItem = slider.currentSlide;
          slider.slides.removeClass(namespace + "active-slide").eq(slider.currentItem).addClass(namespace + "active-slide");
          if(!msGesture){
              slider.slides.on(eventType, function(e){
                e.preventDefault();
                var $slide = $(this),
                    target = $slide.index();
                var posFromLeft = $slide.offset().left - $(slider).scrollLeft(); // Find position of slide relative to left of slider container
                if( posFromLeft <= 0 && $slide.hasClass( namespace + 'active-slide' ) ) {
                  slider.flexAnimate(slider.getTarget("prev"), true);
                } else if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass(namespace + "active-slide")) {
                  slider.direction = (slider.currentItem < target) ? "next" : "prev";
                  slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                }
              });
          }else{
              el._slider = slider;
              slider.slides.each(function (){
                  var that = this;
                  that._gesture = new MSGesture();
                  that._gesture.target = that;
                  that.addEventListener("MSPointerDown", function (e){
                      e.preventDefault();
                      if(e.currentTarget._gesture) {
                        e.currentTarget._gesture.addPointer(e.pointerId);
                      }
                  }, false);
                  that.addEventListener("MSGestureTap", function (e){
                      e.preventDefault();
                      var $slide = $(this),
                          target = $slide.index();
                      if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass('active')) {
                          slider.direction = (slider.currentItem < target) ? "next" : "prev";
                          slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                      }
                  });
              });
          }
        }
      },
      controlNav: {
        setup: function() {
          if (!slider.manualControls) {
            methods.controlNav.setupPaging();
          } else { // MANUALCONTROLS:
            methods.controlNav.setupManual();
          }
        },
        setupPaging: function() {
          var type = (slider.vars.controlNav === "thumbnails") ? 'control-thumbs' : 'control-paging',
              j = 1,
              item,
              slide;

          slider.controlNavScaffold = $('<ol class="'+ namespace + 'control-nav ' + namespace + type + '"></ol>');

          if (slider.pagingCount > 1) {
            for (var i = 0; i < slider.pagingCount; i++) {
              slide = slider.slides.eq(i);
              if ( undefined === slide.attr( 'data-thumb-alt' ) ) { slide.attr( 'data-thumb-alt', '' ); }
              altText = ( '' !== slide.attr( 'data-thumb-alt' ) ) ? altText = ' alt="' + slide.attr( 'data-thumb-alt' ) + '"' : '';
              item = (slider.vars.controlNav === "thumbnails") ? '<img src="' + slide.attr( 'data-thumb' ) + '"' + altText + '/>' : '<a href="#">' + j + '</a>';
              if ( 'thumbnails' === slider.vars.controlNav && true === slider.vars.thumbCaptions ) {
                var captn = slide.attr( 'data-thumbcaption' );
                if ( '' !== captn && undefined !== captn ) { item += '<span class="' + namespace + 'caption">' + captn + '</span>'; }
              }
              slider.controlNavScaffold.append('<li>' + item + '</li>');
              j++;
            }
          }

          // CONTROLSCONTAINER:
          (slider.controlsContainer) ? $(slider.controlsContainer).append(slider.controlNavScaffold) : slider.append(slider.controlNavScaffold);
          methods.controlNav.set();

          methods.controlNav.active();

          slider.controlNavScaffold.delegate('a, img', eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                slider.direction = (target > slider.currentSlide) ? "next" : "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();

          });
        },
        setupManual: function() {
          slider.controlNav = slider.manualControls;
          methods.controlNav.active();

          slider.controlNav.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                (target > slider.currentSlide) ? slider.direction = "next" : slider.direction = "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        set: function() {
          var selector = (slider.vars.controlNav === "thumbnails") ? 'img' : 'a';
          slider.controlNav = $('.' + namespace + 'control-nav li ' + selector, (slider.controlsContainer) ? slider.controlsContainer : slider);
        },
        active: function() {
          slider.controlNav.removeClass(namespace + "active").eq(slider.animatingTo).addClass(namespace + "active");
        },
        update: function(action, pos) {
          if (slider.pagingCount > 1 && action === "add") {
            slider.controlNavScaffold.append($('<li><a href="#">' + slider.count + '</a></li>'));
          } else if (slider.pagingCount === 1) {
            slider.controlNavScaffold.find('li').remove();
          } else {
            slider.controlNav.eq(pos).closest('li').remove();
          }
          methods.controlNav.set();
          (slider.pagingCount > 1 && slider.pagingCount !== slider.controlNav.length) ? slider.update(pos, action) : methods.controlNav.active();
        }
      },
      directionNav: {
        setup: function() {
          var directionNavScaffold = $('<ul class="' + namespace + 'direction-nav"><li class="' + namespace + 'nav-prev"><a class="' + namespace + 'prev" href="#">' + slider.vars.prevText + '</a></li><li class="' + namespace + 'nav-next"><a class="' + namespace + 'next" href="#">' + slider.vars.nextText + '</a></li></ul>');

          // CUSTOM DIRECTION NAV:
          if (slider.customDirectionNav) {
            slider.directionNav = slider.customDirectionNav;
          // CONTROLSCONTAINER:
          } else if (slider.controlsContainer) {
            $(slider.controlsContainer).append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider.controlsContainer);
          } else {
            slider.append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider);
          }

          methods.directionNav.update();

          slider.directionNav.bind(eventType, function(event) {
            event.preventDefault();
            var target;

            if (watchedEvent === "" || watchedEvent === event.type) {
              target = ($(this).hasClass(namespace + 'next')) ? slider.getTarget('next') : slider.getTarget('prev');
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function() {
          var disabledClass = namespace + 'disabled';
          if (slider.pagingCount === 1) {
            slider.directionNav.addClass(disabledClass).attr('tabindex', '-1');
          } else if (!slider.vars.animationLoop) {
            if (slider.animatingTo === 0) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "prev").addClass(disabledClass).attr('tabindex', '-1');
            } else if (slider.animatingTo === slider.last) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "next").addClass(disabledClass).attr('tabindex', '-1');
            } else {
              slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
            }
          } else {
            slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
          }
        }
      },
      pausePlay: {
        setup: function() {
          var pausePlayScaffold = $('<div class="' + namespace + 'pauseplay"><a href="#"></a></div>');

          // CONTROLSCONTAINER:
          if (slider.controlsContainer) {
            slider.controlsContainer.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider.controlsContainer);
          } else {
            slider.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider);
          }

          methods.pausePlay.update((slider.vars.slideshow) ? namespace + 'pause' : namespace + 'play');

          slider.pausePlay.bind(eventType, function(event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              if ($(this).hasClass(namespace + 'pause')) {
                slider.manualPause = true;
                slider.manualPlay = false;
                slider.pause();
              } else {
                slider.manualPause = false;
                slider.manualPlay = true;
                slider.play();
              }
            }

            // setup flags to prevent event duplication
            if (watchedEvent === "") {
              watchedEvent = event.type;
            }
            methods.setToClearWatchedEvent();
          });
        },
        update: function(state) {
          (state === "play") ? slider.pausePlay.removeClass(namespace + 'pause').addClass(namespace + 'play').html(slider.vars.playText) : slider.pausePlay.removeClass(namespace + 'play').addClass(namespace + 'pause').html(slider.vars.pauseText);
        }
      },
      touch: function() {
        var startX,
          startY,
          offset,
          cwidth,
          dx,
          startT,
          onTouchStart,
          onTouchMove,
          onTouchEnd,
          scrolling = false,
          localX = 0,
          localY = 0,
          accDx = 0;

        if(!msGesture){
            onTouchStart = function(e) {
              if (slider.animating) {
                e.preventDefault();
              } else if ( ( window.navigator.msPointerEnabled ) || e.touches.length === 1 ) {
                slider.pause();
                // CAROUSEL:
                cwidth = (vertical) ? slider.h : slider. w;
                startT = Number(new Date());
                // CAROUSEL:

                // Local vars for X and Y points.
                localX = e.touches[0].pageX;
                localY = e.touches[0].pageY;

                offset = (carousel && reverse && slider.animatingTo === slider.last) ? 0 :
                         (carousel && reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                         (carousel && slider.currentSlide === slider.last) ? slider.limit :
                         (carousel) ? ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.currentSlide :
                         (reverse) ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
                startX = (vertical) ? localY : localX;
                startY = (vertical) ? localX : localY;

                el.addEventListener('touchmove', onTouchMove, false);
                el.addEventListener('touchend', onTouchEnd, false);
              }
            };

            onTouchMove = function(e) {
              // Local vars for X and Y points.

              localX = e.touches[0].pageX;
              localY = e.touches[0].pageY;

              dx = (vertical) ? startX - localY : startX - localX;
              scrolling = (vertical) ? (Math.abs(dx) < Math.abs(localX - startY)) : (Math.abs(dx) < Math.abs(localY - startY));

              var fxms = 500;

              if ( ! scrolling || Number( new Date() ) - startT > fxms ) {
                e.preventDefault();
                if (!fade && slider.transitions) {
                  if (!slider.vars.animationLoop) {
                    dx = dx/((slider.currentSlide === 0 && dx < 0 || slider.currentSlide === slider.last && dx > 0) ? (Math.abs(dx)/cwidth+2) : 1);
                  }
                  slider.setProps(offset + dx, "setTouch");
                }
              }
            };

            onTouchEnd = function(e) {
              // finish the touch by undoing the touch session
              el.removeEventListener('touchmove', onTouchMove, false);

              if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
                var updateDx = (reverse) ? -dx : dx,
                    target = (updateDx > 0) ? slider.getTarget('next') : slider.getTarget('prev');

                if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth/2)) {
                  slider.flexAnimate(target, slider.vars.pauseOnAction);
                } else {
                  if (!fade) { slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true); }
                }
              }
              el.removeEventListener('touchend', onTouchEnd, false);

              startX = null;
              startY = null;
              dx = null;
              offset = null;
            };

            el.addEventListener('touchstart', onTouchStart, false);
        }else{
            el.style.msTouchAction = "none";
            el._gesture = new MSGesture();
            el._gesture.target = el;
            el.addEventListener("MSPointerDown", onMSPointerDown, false);
            el._slider = slider;
            el.addEventListener("MSGestureChange", onMSGestureChange, false);
            el.addEventListener("MSGestureEnd", onMSGestureEnd, false);

            function onMSPointerDown(e){
                e.stopPropagation();
                if (slider.animating) {
                    e.preventDefault();
                }else{
                    slider.pause();
                    el._gesture.addPointer(e.pointerId);
                    accDx = 0;
                    cwidth = (vertical) ? slider.h : slider. w;
                    startT = Number(new Date());
                    // CAROUSEL:

                    offset = (carousel && reverse && slider.animatingTo === slider.last) ? 0 :
                        (carousel && reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                            (carousel && slider.currentSlide === slider.last) ? slider.limit :
                                (carousel) ? ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.currentSlide :
                                    (reverse) ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
                }
            }

            function onMSGestureChange(e) {
                e.stopPropagation();
                var slider = e.target._slider;
                if(!slider){
                    return;
                }
                var transX = -e.translationX,
                    transY = -e.translationY;

                //Accumulate translations.
                accDx = accDx + ((vertical) ? transY : transX);
                dx = accDx;
                scrolling = (vertical) ? (Math.abs(accDx) < Math.abs(-transX)) : (Math.abs(accDx) < Math.abs(-transY));

                if(e.detail === e.MSGESTURE_FLAG_INERTIA){
                    setImmediate(function (){
                        el._gesture.stop();
                    });

                    return;
                }

                if (!scrolling || Number(new Date()) - startT > 500) {
                    e.preventDefault();
                    if (!fade && slider.transitions) {
                        if (!slider.vars.animationLoop) {
                            dx = accDx / ((slider.currentSlide === 0 && accDx < 0 || slider.currentSlide === slider.last && accDx > 0) ? (Math.abs(accDx) / cwidth + 2) : 1);
                        }
                        slider.setProps(offset + dx, "setTouch");
                    }
                }
            }

            function onMSGestureEnd(e) {
                e.stopPropagation();
                var slider = e.target._slider;
                if(!slider){
                    return;
                }
                if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
                    var updateDx = (reverse) ? -dx : dx,
                        target = (updateDx > 0) ? slider.getTarget('next') : slider.getTarget('prev');

                    if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth/2)) {
                        slider.flexAnimate(target, slider.vars.pauseOnAction);
                    } else {
                        if (!fade) { slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true); }
                    }
                }

                startX = null;
                startY = null;
                dx = null;
                offset = null;
                accDx = 0;
            }
        }
      },
      resize: function() {
        if (!slider.animating && slider.is(':visible')) {
          if (!carousel) { slider.doMath(); }

          if (fade) {
            // SMOOTH HEIGHT:
            methods.smoothHeight();
          } else if (carousel) { //CAROUSEL:
            slider.slides.width(slider.computedW);
            slider.update(slider.pagingCount);
            slider.setProps();
          }
          else if (vertical) { //VERTICAL:
            slider.viewport.height(slider.h);
            slider.setProps(slider.h, "setTotal");
          } else {
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) { methods.smoothHeight(); }
            slider.newSlides.width(slider.computedW);
            slider.setProps(slider.computedW, "setTotal");
          }
        }
      },
      smoothHeight: function(dur) {
        if (!vertical || fade) {
          var $obj = (fade) ? slider : slider.viewport;
          (dur) ? $obj.animate({"height": slider.slides.eq(slider.animatingTo).height()}, dur) : $obj.height(slider.slides.eq(slider.animatingTo).height());
        }
      },
      sync: function(action) {
        var $obj = $(slider.vars.sync).data("flexslider"),
            target = slider.animatingTo;

        switch (action) {
          case "animate": $obj.flexAnimate(target, slider.vars.pauseOnAction, false, true); break;
          case "play": if (!$obj.playing && !$obj.asNav) { $obj.play(); } break;
          case "pause": $obj.pause(); break;
        }
      },
      uniqueID: function($clone) {
        // Append _clone to current level and children elements with id attributes
        $clone.filter( '[id]' ).add($clone.find( '[id]' )).each(function() {
          var $this = $(this);
          $this.attr( 'id', $this.attr( 'id' ) + '_clone' );
        });
        return $clone;
      },
      pauseInvisible: {
        visProp: null,
        init: function() {
          var visProp = methods.pauseInvisible.getHiddenProp();
          if (visProp) {
            var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
            document.addEventListener(evtname, function() {
              if (methods.pauseInvisible.isHidden()) {
                if(slider.startTimeout) {
                  clearTimeout(slider.startTimeout); //If clock is ticking, stop timer and prevent from starting while invisible
                } else {
                  slider.pause(); //Or just pause
                }
              }
              else {
                if(slider.started) {
                  slider.play(); //Initiated before, just play
                } else {
                  if (slider.vars.initDelay > 0) {
                    setTimeout(slider.play, slider.vars.initDelay);
                  } else {
                    slider.play(); //Didn't init before: simply init or wait for it
                  }
                }
              }
            });
          }
        },
        isHidden: function() {
          var prop = methods.pauseInvisible.getHiddenProp();
          if (!prop) {
            return false;
          }
          return document[prop];
        },
        getHiddenProp: function() {
          var prefixes = ['webkit','moz','ms','o'];
          // if 'hidden' is natively supported just return it
          if ('hidden' in document) {
            return 'hidden';
          }
          // otherwise loop over all the known prefixes until we find one
          for ( var i = 0; i < prefixes.length; i++ ) {
              if ((prefixes[i] + 'Hidden') in document) {
                return prefixes[i] + 'Hidden';
              }
          }
          // otherwise it's not supported
          return null;
        }
      },
      setToClearWatchedEvent: function() {
        clearTimeout(watchedEventClearTimer);
        watchedEventClearTimer = setTimeout(function() {
          watchedEvent = "";
        }, 3000);
      }
    };

    // public methods
    slider.flexAnimate = function(target, pause, override, withSync, fromNav) {
      if (!slider.vars.animationLoop && target !== slider.currentSlide) {
        slider.direction = (target > slider.currentSlide) ? "next" : "prev";
      }

      if (asNav && slider.pagingCount === 1) slider.direction = (slider.currentItem < target) ? "next" : "prev";

      if (!slider.animating && (slider.canAdvance(target, fromNav) || override) && slider.is(":visible")) {
        if (asNav && withSync) {
          var master = $(slider.vars.asNavFor).data('flexslider');
          slider.atEnd = target === 0 || target === slider.count - 1;
          master.flexAnimate(target, true, false, true, fromNav);
          slider.direction = (slider.currentItem < target) ? "next" : "prev";
          master.direction = slider.direction;

          if (Math.ceil((target + 1)/slider.visible) - 1 !== slider.currentSlide && target !== 0) {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            target = Math.floor(target/slider.visible);
          } else {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            return false;
          }
        }

        slider.animating = true;
        slider.animatingTo = target;

        // SLIDESHOW:
        if (pause) { slider.pause(); }

        // API: before() animation Callback
        slider.vars.before(slider);

        // SYNC:
        if (slider.syncExists && !fromNav) { methods.sync("animate"); }

        // CONTROLNAV
        if (slider.vars.controlNav) { methods.controlNav.active(); }

        // !CAROUSEL:
        // CANDIDATE: slide active class (for add/remove slide)
        if (!carousel) { slider.slides.removeClass(namespace + 'active-slide').eq(target).addClass(namespace + 'active-slide'); }

        // INFINITE LOOP:
        // CANDIDATE: atEnd
        slider.atEnd = target === 0 || target === slider.last;

        // DIRECTIONNAV:
        if (slider.vars.directionNav) { methods.directionNav.update(); }

        if (target === slider.last) {
          // API: end() of cycle Callback
          slider.vars.end(slider);
          // SLIDESHOW && !INFINITE LOOP:
          if (!slider.vars.animationLoop) { slider.pause(); }
        }

        // SLIDE:
        if (!fade) {
          var dimension = (vertical) ? slider.slides.filter(':first').height() : slider.computedW,
              margin, slideString, calcNext;

          // INFINITE LOOP / REVERSE:
          if (carousel) {
            margin = slider.vars.itemMargin;
            calcNext = ((slider.itemW + margin) * slider.move) * slider.animatingTo;
            slideString = (calcNext > slider.limit && slider.visible !== 1) ? slider.limit : calcNext;
          } else if (slider.currentSlide === 0 && target === slider.count - 1 && slider.vars.animationLoop && slider.direction !== "next") {
            slideString = (reverse) ? (slider.count + slider.cloneOffset) * dimension : 0;
          } else if (slider.currentSlide === slider.last && target === 0 && slider.vars.animationLoop && slider.direction !== "prev") {
            slideString = (reverse) ? 0 : (slider.count + 1) * dimension;
          } else {
            slideString = (reverse) ? ((slider.count - 1) - target + slider.cloneOffset) * dimension : (target + slider.cloneOffset) * dimension;
          }
          slider.setProps(slideString, "", slider.vars.animationSpeed);
          if (slider.transitions) {
            if (!slider.vars.animationLoop || !slider.atEnd) {
              slider.animating = false;
              slider.currentSlide = slider.animatingTo;
            }

            // Unbind previous transitionEnd events and re-bind new transitionEnd event
            slider.container.unbind("webkitTransitionEnd transitionend");
            slider.container.bind("webkitTransitionEnd transitionend", function() {
              clearTimeout(slider.ensureAnimationEnd);
              slider.wrapup(dimension);
            });

            // Insurance for the ever-so-fickle transitionEnd event
            clearTimeout(slider.ensureAnimationEnd);
            slider.ensureAnimationEnd = setTimeout(function() {
              slider.wrapup(dimension);
            }, slider.vars.animationSpeed + 100);

          } else {
            slider.container.animate(slider.args, slider.vars.animationSpeed, slider.vars.easing, function(){
              slider.wrapup(dimension);
            });
          }
        } else { // FADE:
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeOut(slider.vars.animationSpeed, slider.vars.easing);
            //slider.slides.eq(target).fadeIn(slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);

            slider.slides.eq(slider.currentSlide).css({"zIndex": 1}).animate({"opacity": 0}, slider.vars.animationSpeed, slider.vars.easing);
            slider.slides.eq(target).css({"zIndex": 2}).animate({"opacity": 1}, slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);

          } else {
            slider.slides.eq(slider.currentSlide).css({ "opacity": 0, "zIndex": 1 });
            slider.slides.eq(target).css({ "opacity": 1, "zIndex": 2 });
            slider.wrapup(dimension);
          }
        }
        // SMOOTH HEIGHT:
        if (slider.vars.smoothHeight) { methods.smoothHeight(slider.vars.animationSpeed); }
      }
    };
    slider.wrapup = function(dimension) {
      // SLIDE:
      if (!fade && !carousel) {
        if (slider.currentSlide === 0 && slider.animatingTo === slider.last && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpEnd");
        } else if (slider.currentSlide === slider.last && slider.animatingTo === 0 && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpStart");
        }
      }
      slider.animating = false;
      slider.currentSlide = slider.animatingTo;
      // API: after() animation Callback
      slider.vars.after(slider);
    };

    // SLIDESHOW:
    slider.animateSlides = function() {
      if (!slider.animating && focused ) { slider.flexAnimate(slider.getTarget("next")); }
    };
    // SLIDESHOW:
    slider.pause = function() {
      clearInterval(slider.animatedSlides);
      slider.animatedSlides = null;
      slider.playing = false;
      // PAUSEPLAY:
      if (slider.vars.pausePlay) { methods.pausePlay.update("play"); }
      // SYNC:
      if (slider.syncExists) { methods.sync("pause"); }
    };
    // SLIDESHOW:
    slider.play = function() {
      if (slider.playing) { clearInterval(slider.animatedSlides); }
      slider.animatedSlides = slider.animatedSlides || setInterval(slider.animateSlides, slider.vars.slideshowSpeed);
      slider.started = slider.playing = true;
      // PAUSEPLAY:
      if (slider.vars.pausePlay) { methods.pausePlay.update("pause"); }
      // SYNC:
      if (slider.syncExists) { methods.sync("play"); }
    };
    // STOP:
    slider.stop = function () {
      slider.pause();
      slider.stopped = true;
    };
    slider.canAdvance = function(target, fromNav) {
      // ASNAV:
      var last = (asNav) ? slider.pagingCount - 1 : slider.last;
      return (fromNav) ? true :
             (asNav && slider.currentItem === slider.count - 1 && target === 0 && slider.direction === "prev") ? true :
             (asNav && slider.currentItem === 0 && target === slider.pagingCount - 1 && slider.direction !== "next") ? false :
             (target === slider.currentSlide && !asNav) ? false :
             (slider.vars.animationLoop) ? true :
             (slider.atEnd && slider.currentSlide === 0 && target === last && slider.direction !== "next") ? false :
             (slider.atEnd && slider.currentSlide === last && target === 0 && slider.direction === "next") ? false :
             true;
    };
    slider.getTarget = function(dir) {
      slider.direction = dir;
      if (dir === "next") {
        return (slider.currentSlide === slider.last) ? 0 : slider.currentSlide + 1;
      } else {
        return (slider.currentSlide === 0) ? slider.last : slider.currentSlide - 1;
      }
    };

    // SLIDE:
    slider.setProps = function(pos, special, dur) {
      var target = (function() {
        var posCheck = (pos) ? pos : ((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo,
            posCalc = (function() {
              if (carousel) {
                return (special === "setTouch") ? pos :
                       (reverse && slider.animatingTo === slider.last) ? 0 :
                       (reverse) ? slider.limit - (((slider.itemW + slider.vars.itemMargin) * slider.move) * slider.animatingTo) :
                       (slider.animatingTo === slider.last) ? slider.limit : posCheck;
              } else {
                switch (special) {
                  case "setTotal": return (reverse) ? ((slider.count - 1) - slider.currentSlide + slider.cloneOffset) * pos : (slider.currentSlide + slider.cloneOffset) * pos;
                  case "setTouch": return (reverse) ? pos : pos;
                  case "jumpEnd": return (reverse) ? pos : slider.count * pos;
                  case "jumpStart": return (reverse) ? slider.count * pos : pos;
                  default: return pos;
                }
              }
            }());

            return (posCalc * -1) + "px";
          }());

      if (slider.transitions) {
        target = (vertical) ? "translate3d(0," + target + ",0)" : "translate3d(" + target + ",0,0)";
        dur = (dur !== undefined) ? (dur/1000) + "s" : "0s";
        slider.container.css("-" + slider.pfx + "-transition-duration", dur);
         slider.container.css("transition-duration", dur);
      }

      slider.args[slider.prop] = target;
      if (slider.transitions || dur === undefined) { slider.container.css(slider.args); }

      slider.container.css('transform',target);
    };

    slider.setup = function(type) {
      // SLIDE:
      if (!fade) {
        var sliderOffset, arr;

        if (type === "init") {
          slider.viewport = $('<div class="' + namespace + 'viewport"></div>').css({"overflow": "hidden", "position": "relative"}).appendTo(slider).append(slider.container);
          // INFINITE LOOP:
          slider.cloneCount = 0;
          slider.cloneOffset = 0;
          // REVERSE:
          if (reverse) {
            arr = $.makeArray(slider.slides).reverse();
            slider.slides = $(arr);
            slider.container.empty().append(slider.slides);
          }
        }
        // INFINITE LOOP && !CAROUSEL:
        if (slider.vars.animationLoop && !carousel) {
          slider.cloneCount = 2;
          slider.cloneOffset = 1;
          // clear out old clones
          if (type !== "init") { slider.container.find('.clone').remove(); }
          slider.container.append(methods.uniqueID(slider.slides.first().clone().addClass('clone')).attr('aria-hidden', 'true'))
                          .prepend(methods.uniqueID(slider.slides.last().clone().addClass('clone')).attr('aria-hidden', 'true'));
        }
        slider.newSlides = $(slider.vars.selector, slider);

        sliderOffset = (reverse) ? slider.count - 1 - slider.currentSlide + slider.cloneOffset : slider.currentSlide + slider.cloneOffset;
        // VERTICAL:
        if (vertical && !carousel) {
          slider.container.height((slider.count + slider.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
          setTimeout(function(){
            slider.newSlides.css({"display": "block"});
            slider.doMath();
            slider.viewport.height(slider.h);
            slider.setProps(sliderOffset * slider.h, "init");
          }, (type === "init") ? 100 : 0);
        } else {
          slider.container.width((slider.count + slider.cloneCount) * 200 + "%");
          slider.setProps(sliderOffset * slider.computedW, "init");
          setTimeout(function(){
            slider.doMath();
            slider.newSlides.css({"width": slider.computedW, "marginRight" : slider.computedM, "float": "left", "display": "block"});
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) { methods.smoothHeight(); }
          }, (type === "init") ? 100 : 0);
        }
      } else { // FADE:
        slider.slides.css({"width": "100%", "float": "left", "marginRight": "-100%", "position": "relative"});
        if (type === "init") {
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeIn(slider.vars.animationSpeed, slider.vars.easing);
            if (slider.vars.fadeFirstSlide == false) {
              slider.slides.css({ "opacity": 0, "display": "block", "zIndex": 1 }).eq(slider.currentSlide).css({"zIndex": 2}).css({"opacity": 1});
            } else {
              slider.slides.css({ "opacity": 0, "display": "block", "zIndex": 1 }).eq(slider.currentSlide).css({"zIndex": 2}).animate({"opacity": 1},slider.vars.animationSpeed,slider.vars.easing);
            }
          } else {
            slider.slides.css({ "opacity": 0, "display": "block", "webkitTransition": "opacity " + slider.vars.animationSpeed / 1000 + "s ease", "zIndex": 1 }).eq(slider.currentSlide).css({ "opacity": 1, "zIndex": 2});
          }
        }
        // SMOOTH HEIGHT:
        if (slider.vars.smoothHeight) { methods.smoothHeight(); }
      }
      // !CAROUSEL:
      // CANDIDATE: active slide
      if (!carousel) { slider.slides.removeClass(namespace + "active-slide").eq(slider.currentSlide).addClass(namespace + "active-slide"); }

      //FlexSlider: init() Callback
      slider.vars.init(slider);
    };

    slider.doMath = function() {
      var slide = slider.slides.first(),
          slideMargin = slider.vars.itemMargin,
          minItems = slider.vars.minItems,
          maxItems = slider.vars.maxItems;

      slider.w = (slider.viewport===undefined) ? slider.width() : slider.viewport.width();
      slider.h = slide.height();
      slider.boxPadding = slide.outerWidth() - slide.width();

      // CAROUSEL:
      if (carousel) {
        slider.itemT = slider.vars.itemWidth + slideMargin;
        slider.itemM = slideMargin;
        slider.minW = (minItems) ? minItems * slider.itemT : slider.w;
        slider.maxW = (maxItems) ? (maxItems * slider.itemT) - slideMargin : slider.w;
        slider.itemW = (slider.minW > slider.w) ? (slider.w - (slideMargin * (minItems - 1)))/minItems :
                       (slider.maxW < slider.w) ? (slider.w - (slideMargin * (maxItems - 1)))/maxItems :
                       (slider.vars.itemWidth > slider.w) ? slider.w : slider.vars.itemWidth;

        slider.visible = Math.floor(slider.w/(slider.itemW));
        slider.move = (slider.vars.move > 0 && slider.vars.move < slider.visible ) ? slider.vars.move : slider.visible;
        slider.pagingCount = Math.ceil(((slider.count - slider.visible)/slider.move) + 1);
        slider.last =  slider.pagingCount - 1;
        slider.limit = (slider.pagingCount === 1) ? 0 :
                       (slider.vars.itemWidth > slider.w) ? (slider.itemW * (slider.count - 1)) + (slideMargin * (slider.count - 1)) : ((slider.itemW + slideMargin) * slider.count) - slider.w - slideMargin;
      } else {
        slider.itemW = slider.w;
        slider.itemM = slideMargin;
        slider.pagingCount = slider.count;
        slider.last = slider.count - 1;
      }
      slider.computedW = slider.itemW - slider.boxPadding;
      slider.computedM = slider.itemM;
    };

    slider.update = function(pos, action) {
      slider.doMath();

      // update currentSlide and slider.animatingTo if necessary
      if (!carousel) {
        if (pos < slider.currentSlide) {
          slider.currentSlide += 1;
        } else if (pos <= slider.currentSlide && pos !== 0) {
          slider.currentSlide -= 1;
        }
        slider.animatingTo = slider.currentSlide;
      }

      // update controlNav
      if (slider.vars.controlNav && !slider.manualControls) {
        if ((action === "add" && !carousel) || slider.pagingCount > slider.controlNav.length) {
          methods.controlNav.update("add");
        } else if ((action === "remove" && !carousel) || slider.pagingCount < slider.controlNav.length) {
          if (carousel && slider.currentSlide > slider.last) {
            slider.currentSlide -= 1;
            slider.animatingTo -= 1;
          }
          methods.controlNav.update("remove", slider.last);
        }
      }
      // update directionNav
      if (slider.vars.directionNav) { methods.directionNav.update(); }

    };

    slider.addSlide = function(obj, pos) {
      var $obj = $(obj);

      slider.count += 1;
      slider.last = slider.count - 1;

      // append new slide
      if (vertical && reverse) {
        (pos !== undefined) ? slider.slides.eq(slider.count - pos).after($obj) : slider.container.prepend($obj);
      } else {
        (pos !== undefined) ? slider.slides.eq(pos).before($obj) : slider.container.append($obj);
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.update(pos, "add");

      // update slider.slides
      slider.slides = $(slider.vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      //FlexSlider: added() Callback
      slider.vars.added(slider);
    };
    slider.removeSlide = function(obj) {
      var pos = (isNaN(obj)) ? slider.slides.index($(obj)) : obj;

      // update count
      slider.count -= 1;
      slider.last = slider.count - 1;

      // remove slide
      if (isNaN(obj)) {
        $(obj, slider.slides).remove();
      } else {
        (vertical && reverse) ? slider.slides.eq(slider.last).remove() : slider.slides.eq(obj).remove();
      }

      // update currentSlide, animatingTo, controlNav, and directionNav
      slider.doMath();
      slider.update(pos, "remove");

      // update slider.slides
      slider.slides = $(slider.vars.selector + ':not(.clone)', slider);
      // re-setup the slider to accomdate new slide
      slider.setup();

      // FlexSlider: removed() Callback
      slider.vars.removed(slider);
    };

    //FlexSlider: Initialize
    methods.init();
  };

  // Ensure the slider isn't focussed if the window loses focus.
  $( window ).blur( function ( e ) {
    focused = false;
  }).focus( function ( e ) {
    focused = true;
  });

  //FlexSlider: Default Settings
  $.flexslider.defaults = {
    namespace: "flex-",             //{NEW} String: Prefix string attached to the class of every element generated by the plugin
    selector: ".slides > li",       //{NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
    animation: "fade",              //String: Select your animation type, "fade" or "slide"
    easing: "swing",                //{NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
    direction: "horizontal",        //String: Select the sliding direction, "horizontal" or "vertical"
    reverse: false,                 //{NEW} Boolean: Reverse the animation direction
    animationLoop: true,            //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
    smoothHeight: false,            //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
    startAt: 0,                     //Integer: The slide that the slider should start on. Array notation (0 = first slide)
    slideshow: true,                //Boolean: Animate slider automatically
    slideshowSpeed: 7000,           //Integer: Set the speed of the slideshow cycling, in milliseconds
    animationSpeed: 600,            //Integer: Set the speed of animations, in milliseconds
    initDelay: 0,                   //{NEW} Integer: Set an initialization delay, in milliseconds
    randomize: false,               //Boolean: Randomize slide order
    fadeFirstSlide: true,           //Boolean: Fade in the first slide when animation type is "fade"
    thumbCaptions: false,           //Boolean: Whether or not to put captions on thumbnails when using the "thumbnails" controlNav.

    // Usability features
    pauseOnAction: true,            //Boolean: Pause the slideshow when interacting with control elements, highly recommended.
    pauseOnHover: false,            //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
    pauseInvisible: true,       //{NEW} Boolean: Pause the slideshow when tab is invisible, resume when visible. Provides better UX, lower CPU usage.
    useCSS: true,                   //{NEW} Boolean: Slider will use CSS3 transitions if available
    touch: true,                    //{NEW} Boolean: Allow touch swipe navigation of the slider on touch-enabled devices
    video: false,                   //{NEW} Boolean: If using video in the slider, will prevent CSS3 3D Transforms to avoid graphical glitches

    // Primary Controls
    controlNav: true,               //Boolean: Create navigation for paging control of each slide? Note: Leave true for manualControls usage
    directionNav: true,             //Boolean: Create navigation for previous/next navigation? (true/false)
    prevText: "Previous",           //String: Set the text for the "previous" directionNav item
    nextText: "Next",               //String: Set the text for the "next" directionNav item

    // Secondary Navigation
    keyboard: true,                 //Boolean: Allow slider navigating via keyboard left/right keys
    multipleKeyboard: false,        //{NEW} Boolean: Allow keyboard navigation to affect multiple sliders. Default behavior cuts out keyboard navigation with more than one slider present.
    mousewheel: false,              //{UPDATED} Boolean: Requires jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel) - Allows slider navigating via mousewheel
    pausePlay: false,               //Boolean: Create pause/play dynamic element
    pauseText: "Pause",             //String: Set the text for the "pause" pausePlay item
    playText: "Play",               //String: Set the text for the "play" pausePlay item

    // Special properties
    controlsContainer: "",          //{UPDATED} jQuery Object/Selector: Declare which container the navigation elements should be appended too. Default container is the FlexSlider element. Example use would be $(".flexslider-container"). Property is ignored if given element is not found.
    manualControls: "",             //{UPDATED} jQuery Object/Selector: Declare custom control navigation. Examples would be $(".flex-control-nav li") or "#tabs-nav li img", etc. The number of elements in your controlNav should match the number of slides/tabs.
    customDirectionNav: "",         //{NEW} jQuery Object/Selector: Custom prev / next button. Must be two jQuery elements. In order to make the events work they have to have the classes "prev" and "next" (plus namespace)
    sync: "",                       //{NEW} Selector: Mirror the actions performed on this slider with another slider. Use with care.
    asNavFor: "",                   //{NEW} Selector: Internal property exposed for turning the slider into a thumbnail navigation for another slider

    // Carousel Options
    itemWidth: 0,                   //{NEW} Integer: Box-model width of individual carousel items, including horizontal borders and padding.
    itemMargin: 0,                  //{NEW} Integer: Margin between carousel items.
    minItems: 1,                    //{NEW} Integer: Minimum number of carousel items that should be visible. Items will resize fluidly when below this.
    maxItems: 0,                    //{NEW} Integer: Maxmimum number of carousel items that should be visible. Items will resize fluidly when above this limit.
    move: 0,                        //{NEW} Integer: Number of carousel items that should move on animation. If 0, slider will move all visible items.
    allowOneSlide: true,           //{NEW} Boolean: Whether or not to allow a slider comprised of a single slide

    // Callback API
    start: function(){},            //Callback: function(slider) - Fires when the slider loads the first slide
    before: function(){},           //Callback: function(slider) - Fires asynchronously with each slider animation
    after: function(){},            //Callback: function(slider) - Fires after each slider animation completes
    end: function(){},              //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
    added: function(){},            //{NEW} Callback: function(slider) - Fires after a slide is added
    removed: function(){},           //{NEW} Callback: function(slider) - Fires after a slide is removed
    init: function() {}             //{NEW} Callback: function(slider) - Fires after the slider is initially setup
  };

  //FlexSlider: Plugin Function
  $.fn.flexslider = function(options) {
    if (options === undefined) { options = {}; }

    if (typeof options === "object") {
      return this.each(function() {
        var $this = $(this),
            selector = (options.selector) ? options.selector : ".slides > li",
            $slides = $this.find(selector);

      if ( ( $slides.length === 1 && options.allowOneSlide === true ) || $slides.length === 0 ) {
          $slides.fadeIn(400);
          if (options.start) { options.start($this); }
        } else if ($this.data('flexslider') === undefined) {
          new $.flexslider(this, options);
        }
      });
    } else {
      // Helper strings to quickly perform functions on the slider
      var $slider = $(this).data('flexslider');
      switch (options) {
        case "play": $slider.play(); break;
        case "pause": $slider.pause(); break;
        case "stop": $slider.stop(); break;
        case "next": $slider.flexAnimate($slider.getTarget("next"), true); break;
        case "prev":
        case "previous": $slider.flexAnimate($slider.getTarget("prev"), true); break;
        default: if (typeof options === "number") { $slider.flexAnimate(options, true); }
      }
    }
  };
})(jQuery);
// Cart.js
// version: 0.4.0
// author: Gavin Ballard
// license: MIT
(function(){function a(a,c,d,e){return new b(a,c,d,e)}function b(a,b,d,e){this.options=e||{},this.options.adapters=this.options.adapters||{},this.obj=a,this.keypath=b,this.callback=d,this.objectPath=[],this.parse(),c(this.target=this.realize())&&this.set(!0,this.key,this.target,this.callback)}function c(a){return"object"==typeof a&&null!==a}function d(a){throw new Error("[sightglass] "+a)}a.adapters={},b.tokenize=function(a,b,c){var d,e,f=[],g={i:c,path:""};for(d=0;d<a.length;d++)e=a.charAt(d),~b.indexOf(e)?(f.push(g),g={i:e,path:""}):g.path+=e;return f.push(g),f},b.prototype.parse=function(){var c,e,f=this.interfaces();f.length||d("Must define at least one adapter interface."),~f.indexOf(this.keypath[0])?(c=this.keypath[0],e=this.keypath.substr(1)):("undefined"==typeof(c=this.options.root||a.root)&&d("Must define a default root adapter."),e=this.keypath),this.tokens=b.tokenize(e,f,c),this.key=this.tokens.pop()},b.prototype.realize=function(){var a,b=this.obj,d=!1;return this.tokens.forEach(function(e,f){c(b)?("undefined"!=typeof this.objectPath[f]?b!==(a=this.objectPath[f])&&(this.set(!1,e,a,this.update.bind(this)),this.set(!0,e,b,this.update.bind(this)),this.objectPath[f]=b):(this.set(!0,e,b,this.update.bind(this)),this.objectPath[f]=b),b=this.get(e,b)):(d===!1&&(d=f),(a=this.objectPath[f])&&this.set(!1,e,a,this.update.bind(this)))},this),d!==!1&&this.objectPath.splice(d),b},b.prototype.update=function(){var a,b;(a=this.realize())!==this.target&&(c(this.target)&&this.set(!1,this.key,this.target,this.callback),c(a)&&this.set(!0,this.key,a,this.callback),b=this.value(),this.target=a,this.value()!==b&&this.callback())},b.prototype.value=function(){return c(this.target)?this.get(this.key,this.target):void 0},b.prototype.setValue=function(a){c(this.target)&&this.adapter(this.key).set(this.target,this.key.path,a)},b.prototype.get=function(a,b){return this.adapter(a).get(b,a.path)},b.prototype.set=function(a,b,c,d){var e=a?"observe":"unobserve";this.adapter(b)[e](c,b.path,d)},b.prototype.interfaces=function(){var b=Object.keys(this.options.adapters);return Object.keys(a.adapters).forEach(function(a){~b.indexOf(a)||b.push(a)}),b},b.prototype.adapter=function(b){return this.options.adapters[b.i]||a.adapters[b.i]},b.prototype.unobserve=function(){var a;this.tokens.forEach(function(b,c){(a=this.objectPath[c])&&this.set(!1,b,a,this.update.bind(this))},this),c(this.target)&&this.set(!1,this.key,this.target,this.callback)},"undefined"!=typeof module&&module.exports?module.exports=a:"function"==typeof define&&define.amd?define([],function(){return this.sightglass=a}):this.sightglass=a}).call(this),function(){var a,b,c,d,e=function(a,b){return function(){return a.apply(b,arguments)}},f=[].slice,g={}.hasOwnProperty,h=function(a,b){function c(){this.constructor=a}for(var d in b)g.call(b,d)&&(a[d]=b[d]);return c.prototype=b.prototype,a.prototype=new c,a.__super__=b.prototype,a},i=[].indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(b in this&&this[b]===a)return b;return-1};a={options:["prefix","templateDelimiters","rootInterface","preloadData","handler"],extensions:["binders","formatters","components","adapters"],"public":{binders:{},components:{},formatters:{},adapters:{},prefix:"rv",templateDelimiters:["{","}"],rootInterface:".",preloadData:!0,handler:function(a,b,c){return this.call(a,b,c.view.models)},configure:function(b){var c,d,e,f;null==b&&(b={});for(e in b)if(f=b[e],"binders"===e||"components"===e||"formatters"===e||"adapters"===e)for(d in f)c=f[d],a[e][d]=c;else a["public"][e]=f},bind:function(b,c,d){var e;return null==c&&(c={}),null==d&&(d={}),e=new a.View(b,c,d),e.bind(),e},init:function(b,c,d){var e,f;return null==d&&(d={}),null==c&&(c=document.createElement("div")),b=a["public"].components[b],c.innerHTML=b.template.call(this,c),e=b.initialize.call(this,c,d),f=new a.View(c,e),f.bind(),f}}},window.jQuery||window.$?(d="on"in jQuery.prototype?["on","off"]:["bind","unbind"],b=d[0],c=d[1],a.Util={bindEvent:function(a,c,d){return jQuery(a)[b](c,d)},unbindEvent:function(a,b,d){return jQuery(a)[c](b,d)},getInputValue:function(a){var b;return b=jQuery(a),"checkbox"===b.attr("type")?b.is(":checked"):b.val()}}):a.Util={bindEvent:function(){return"addEventListener"in window?function(a,b,c){return a.addEventListener(b,c,!1)}:function(a,b,c){return a.attachEvent("on"+b,c)}}(),unbindEvent:function(){return"removeEventListener"in window?function(a,b,c){return a.removeEventListener(b,c,!1)}:function(a,b,c){return a.detachEvent("on"+b,c)}}(),getInputValue:function(a){var b,c,d,e;if("checkbox"===a.type)return a.checked;if("select-multiple"===a.type){for(e=[],c=0,d=a.length;d>c;c++)b=a[c],b.selected&&e.push(b.value);return e}return a.value}},a.TypeParser=function(){function a(){}return a.types={primitive:0,keypath:1},a.parse=function(a){return/^'.*'$|^".*"$/.test(a)?{type:this.types.primitive,value:a.slice(1,-1)}:"true"===a?{type:this.types.primitive,value:!0}:"false"===a?{type:this.types.primitive,value:!1}:"null"===a?{type:this.types.primitive,value:null}:"undefined"===a?{type:this.types.primitive,value:void 0}:isNaN(Number(a))===!1?{type:this.types.primitive,value:Number(a)}:{type:this.types.keypath,value:a}},a}(),a.TextTemplateParser=function(){function a(){}return a.types={text:0,binding:1},a.parse=function(a,b){var c,d,e,f,g,h,i;for(h=[],f=a.length,c=0,d=0;f>d;){if(c=a.indexOf(b[0],d),0>c){h.push({type:this.types.text,value:a.slice(d)});break}if(c>0&&c>d&&h.push({type:this.types.text,value:a.slice(d,c)}),d=c+b[0].length,c=a.indexOf(b[1],d),0>c){g=a.slice(d-b[1].length),e=h[h.length-1],(null!=e?e.type:void 0)===this.types.text?e.value+=g:h.push({type:this.types.text,value:g});break}i=a.slice(d,c).trim(),h.push({type:this.types.binding,value:i}),d=c+b[1].length}return h},a}(),a.View=function(){function b(b,c,d){var f,g,h,i,j,k,l,m,n,o,p,q,r;for(this.els=b,this.models=c,null==d&&(d={}),this.update=e(this.update,this),this.publish=e(this.publish,this),this.sync=e(this.sync,this),this.unbind=e(this.unbind,this),this.bind=e(this.bind,this),this.select=e(this.select,this),this.traverse=e(this.traverse,this),this.build=e(this.build,this),this.buildBinding=e(this.buildBinding,this),this.bindingRegExp=e(this.bindingRegExp,this),this.options=e(this.options,this),this.els.jquery||this.els instanceof Array||(this.els=[this.els]),n=a.extensions,j=0,l=n.length;l>j;j++){if(g=n[j],this[g]={},d[g]){o=d[g];for(f in o)h=o[f],this[g][f]=h}p=a["public"][g];for(f in p)h=p[f],null==(i=this[g])[f]&&(i[f]=h)}for(q=a.options,k=0,m=q.length;m>k;k++)g=q[k],this[g]=null!=(r=d[g])?r:a["public"][g];this.build()}return b.prototype.options=function(){var b,c,d,e,f;for(c={},f=a.extensions.concat(a.options),d=0,e=f.length;e>d;d++)b=f[d],c[b]=this[b];return c},b.prototype.bindingRegExp=function(){return new RegExp("^"+this.prefix+"-")},b.prototype.buildBinding=function(b,c,d,e){var f,g,h,i,j,k,l;return j={},l=function(){var a,b,c,d;for(c=e.split("|"),d=[],a=0,b=c.length;b>a;a++)k=c[a],d.push(k.trim());return d}(),f=function(){var a,b,c,d;for(c=l.shift().split("<"),d=[],a=0,b=c.length;b>a;a++)g=c[a],d.push(g.trim());return d}(),i=f.shift(),j.formatters=l,(h=f.shift())&&(j.dependencies=h.split(/\s+/)),this.bindings.push(new a[b](this,c,d,i,j))},b.prototype.build=function(){var b,c,d,e,f;for(this.bindings=[],c=function(b){return function(d){var e,f,g,h,i,j,k,l,m,n,o,p,q,r;if(3===d.nodeType){if(i=a.TextTemplateParser,(g=b.templateDelimiters)&&(l=i.parse(d.data,g)).length&&(1!==l.length||l[0].type!==i.types.text)){for(m=0,o=l.length;o>m;m++)k=l[m],j=document.createTextNode(k.value),d.parentNode.insertBefore(j,d),1===k.type&&b.buildBinding("TextBinding",j,null,k.value);d.parentNode.removeChild(d)}}else 1===d.nodeType&&(e=b.traverse(d));if(!e){for(q=function(){var a,b,c,e;for(c=d.childNodes,e=[],a=0,b=c.length;b>a;a++)h=c[a],e.push(h);return e}(),r=[],n=0,p=q.length;p>n;n++)f=q[n],r.push(c(f));return r}}}(this),f=this.els,d=0,e=f.length;e>d;d++)b=f[d],c(b);this.bindings.sort(function(a,b){var c,d;return((null!=(c=b.binder)?c.priority:void 0)||0)-((null!=(d=a.binder)?d.priority:void 0)||0)})},b.prototype.traverse=function(b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r;for(f=this.bindingRegExp(),g="SCRIPT"===b.nodeName||"STYLE"===b.nodeName,p=b.attributes,l=0,n=p.length;n>l;l++)if(c=p[l],f.test(c.name)){if(j=c.name.replace(f,""),!(e=this.binders[j])){q=this.binders;for(h in q)k=q[h],"*"!==h&&-1!==h.indexOf("*")&&(i=new RegExp("^"+h.replace(/\*/g,".+")+"$"),i.test(j)&&(e=k))}e||(e=this.binders["*"]),e.block&&(g=!0,d=[c])}for(r=d||b.attributes,m=0,o=r.length;o>m;m++)c=r[m],f.test(c.name)&&(j=c.name.replace(f,""),this.buildBinding("Binding",b,j,c.value));return g||(j=b.nodeName.toLowerCase(),this.components[j]&&!b._bound&&(this.bindings.push(new a.ComponentBinding(this,b,j)),g=!0)),g},b.prototype.select=function(a){var b,c,d,e,f;for(e=this.bindings,f=[],c=0,d=e.length;d>c;c++)b=e[c],a(b)&&f.push(b);return f},b.prototype.bind=function(){var a,b,c,d,e;for(d=this.bindings,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.bind());return e},b.prototype.unbind=function(){var a,b,c,d,e;for(d=this.bindings,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.unbind());return e},b.prototype.sync=function(){var a,b,c,d,e;for(d=this.bindings,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push("function"==typeof a.sync?a.sync():void 0);return e},b.prototype.publish=function(){var a,b,c,d,e;for(d=this.select(function(a){var b;return null!=(b=a.binder)?b.publishes:void 0}),e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.publish());return e},b.prototype.update=function(a){var b,c,d,e,f,g,h;null==a&&(a={});for(c in a)d=a[c],this.models[c]=d;for(g=this.bindings,h=[],e=0,f=g.length;f>e;e++)b=g[e],h.push("function"==typeof b.update?b.update(a):void 0);return h},b}(),a.Binding=function(){function b(a,b,c,d,f){this.view=a,this.el=b,this.type=c,this.keypath=d,this.options=null!=f?f:{},this.getValue=e(this.getValue,this),this.update=e(this.update,this),this.unbind=e(this.unbind,this),this.bind=e(this.bind,this),this.publish=e(this.publish,this),this.sync=e(this.sync,this),this.set=e(this.set,this),this.eventHandler=e(this.eventHandler,this),this.formattedValue=e(this.formattedValue,this),this.parseTarget=e(this.parseTarget,this),this.observe=e(this.observe,this),this.setBinder=e(this.setBinder,this),this.formatters=this.options.formatters||[],this.dependencies=[],this.formatterObservers={},this.model=void 0,this.setBinder()}return b.prototype.setBinder=function(){var a,b,c,d;if(!(this.binder=this.view.binders[this.type])){d=this.view.binders;for(a in d)c=d[a],"*"!==a&&-1!==a.indexOf("*")&&(b=new RegExp("^"+a.replace(/\*/g,".+")+"$"),b.test(this.type)&&(this.binder=c,this.args=new RegExp("^"+a.replace(/\*/g,"(.+)")+"$").exec(this.type),this.args.shift()))}return this.binder||(this.binder=this.view.binders["*"]),this.binder instanceof Function?this.binder={routine:this.binder}:void 0},b.prototype.observe=function(b,c,d){return a.sightglass(b,c,d,{root:this.view.rootInterface,adapters:this.view.adapters})},b.prototype.parseTarget=function(){var b;return b=a.TypeParser.parse(this.keypath),0===b.type?this.value=b.value:(this.observer=this.observe(this.view.models,this.keypath,this.sync),this.model=this.observer.target)},b.prototype.formattedValue=function(b){var c,d,e,g,h,i,j,k,l,m,n,o,p,q;for(q=this.formatters,g=m=0,o=q.length;o>m;g=++m){for(h=q[g],e=h.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g),i=e.shift(),h=this.view.formatters[i],e=function(){var b,c,f;for(f=[],b=0,c=e.length;c>b;b++)d=e[b],f.push(a.TypeParser.parse(d));return f}(),k=[],c=n=0,p=e.length;p>n;c=++n)d=e[c],k.push(0===d.type?d.value:((l=this.formatterObservers)[g]||(l[g]={}),(j=this.formatterObservers[g][c])?void 0:(j=this.observe(this.view.models,d.value,this.sync),this.formatterObservers[g][c]=j),j.value()));(null!=h?h.read:void 0)instanceof Function?b=h.read.apply(h,[b].concat(f.call(k))):h instanceof Function&&(b=h.apply(null,[b].concat(f.call(k))))}return b},b.prototype.eventHandler=function(a){var b,c;return c=(b=this).view.handler,function(d){return c.call(a,this,d,b)}},b.prototype.set=function(a){var b;return a=this.formattedValue(a instanceof Function&&!this.binder["function"]?a.call(this.model):a),null!=(b=this.binder.routine)?b.call(this,this.el,a):void 0},b.prototype.sync=function(){var a,b;return this.set(function(){var c,d,e,f,g,h,i;if(this.observer){if(this.model!==this.observer.target){for(g=this.dependencies,c=0,e=g.length;e>c;c++)b=g[c],b.unobserve();if(this.dependencies=[],null!=(this.model=this.observer.target)&&(null!=(h=this.options.dependencies)?h.length:void 0))for(i=this.options.dependencies,d=0,f=i.length;f>d;d++)a=i[d],b=this.observe(this.model,a,this.sync),this.dependencies.push(b)}return this.observer.value()}return this.value}.call(this))},b.prototype.publish=function(){var a,b,c,d,e,g,h,i,j;if(this.observer){for(d=this.getValue(this.el),h=this.formatters.slice(0).reverse(),e=0,g=h.length;g>e;e++)b=h[e],a=b.split(/\s+/),c=a.shift(),(null!=(i=this.view.formatters[c])?i.publish:void 0)&&(d=(j=this.view.formatters[c]).publish.apply(j,[d].concat(f.call(a))));return this.observer.setValue(d)}},b.prototype.bind=function(){var a,b,c,d,e,f,g;if(this.parseTarget(),null!=(e=this.binder.bind)&&e.call(this,this.el),null!=this.model&&(null!=(f=this.options.dependencies)?f.length:void 0))for(g=this.options.dependencies,c=0,d=g.length;d>c;c++)a=g[c],b=this.observe(this.model,a,this.sync),this.dependencies.push(b);return this.view.preloadData?this.sync():void 0},b.prototype.unbind=function(){var a,b,c,d,e,f,g,h,i,j;for(null!=(g=this.binder.unbind)&&g.call(this,this.el),null!=(h=this.observer)&&h.unobserve(),i=this.dependencies,e=0,f=i.length;f>e;e++)d=i[e],d.unobserve();this.dependencies=[],j=this.formatterObservers;for(c in j){b=j[c];for(a in b)d=b[a],d.unobserve()}return this.formatterObservers={}},b.prototype.update=function(a){var b,c;return null==a&&(a={}),this.model=null!=(b=this.observer)?b.target:void 0,null!=(c=this.binder.update)?c.call(this,a):void 0},b.prototype.getValue=function(b){return this.binder&&null!=this.binder.getValue?this.binder.getValue.call(this,b):a.Util.getInputValue(b)},b}(),a.ComponentBinding=function(b){function c(a,b,c){var d,f,g,h,j,k,l;for(this.view=a,this.el=b,this.type=c,this.unbind=e(this.unbind,this),this.bind=e(this.bind,this),this.locals=e(this.locals,this),this.component=this.view.components[this.type],this["static"]={},this.observers={},this.upstreamObservers={},f=a.bindingRegExp(),k=this.el.attributes||[],h=0,j=k.length;j>h;h++)d=k[h],f.test(d.name)||(g=this.camelCase(d.name),i.call(null!=(l=this.component["static"])?l:[],g)>=0?this["static"][g]=d.value:this.observers[g]=d.value)}return h(c,b),c.prototype.sync=function(){},c.prototype.update=function(){},c.prototype.publish=function(){},c.prototype.locals=function(){var a,b,c,d,e,f;c={},e=this["static"];for(a in e)d=e[a],c[a]=d;f=this.observers;for(a in f)b=f[a],c[a]=b.value();return c},c.prototype.camelCase=function(a){return a.replace(/-([a-z])/g,function(a){return a[1].toUpperCase()})},c.prototype.bind=function(){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v;if(!this.bound){o=this.observers;for(c in o)d=o[c],this.observers[c]=this.observe(this.view.models,d,function(a){return function(b){return function(){return a.componentView.models[b]=a.observers[b].value()}}}(this).call(this,c));this.bound=!0}if(null!=this.componentView)return this.componentView.bind();for(this.el.innerHTML=this.component.template.call(this),h=this.component.initialize.call(this,this.el,this.locals()),this.el._bound=!0,g={},p=a.extensions,k=0,m=p.length;m>k;k++){if(f=p[k],g[f]={},this.component[f]){q=this.component[f];for(b in q)i=q[b],g[f][b]=i}r=this.view[f];for(b in r)i=r[b],null==(j=g[f])[b]&&(j[b]=i)}for(s=a.options,l=0,n=s.length;n>l;l++)f=s[l],g[f]=null!=(t=this.component[f])?t:this.view[f];this.componentView=new a.View(this.el,h,g),this.componentView.bind(),u=this.observers,v=[];for(c in u)e=u[c],v.push(this.upstreamObservers[c]=this.observe(this.componentView.models,c,function(a){return function(b,c){return function(){return c.setValue(a.componentView.models[b])}}}(this).call(this,c,e)));return v},c.prototype.unbind=function(){var a,b,c,d,e;c=this.upstreamObservers;for(a in c)b=c[a],b.unobserve();d=this.observers;for(a in d)b=d[a],b.unobserve();return null!=(e=this.componentView)?e.unbind.call(this):void 0},c}(a.Binding),a.TextBinding=function(a){function b(a,b,c,d,f){this.view=a,this.el=b,this.type=c,this.keypath=d,this.options=null!=f?f:{},this.sync=e(this.sync,this),this.formatters=this.options.formatters||[],this.dependencies=[],this.formatterObservers={}}return h(b,a),b.prototype.binder={routine:function(a,b){return a.data=null!=b?b:""}},b.prototype.sync=function(){return b.__super__.sync.apply(this,arguments)},b}(a.Binding),a["public"].binders.text=function(a,b){return null!=a.textContent?a.textContent=null!=b?b:"":a.innerText=null!=b?b:""},a["public"].binders.html=function(a,b){return a.innerHTML=null!=b?b:""},a["public"].binders.show=function(a,b){return a.style.display=b?"":"none"},a["public"].binders.hide=function(a,b){return a.style.display=b?"none":""},a["public"].binders.enabled=function(a,b){return a.disabled=!b},a["public"].binders.disabled=function(a,b){return a.disabled=!!b},a["public"].binders.checked={publishes:!0,priority:2e3,bind:function(b){return a.Util.bindEvent(b,"change",this.publish)},unbind:function(b){return a.Util.unbindEvent(b,"change",this.publish)},routine:function(a,b){var c;return a.checked="radio"===a.type?(null!=(c=a.value)?c.toString():void 0)===(null!=b?b.toString():void 0):!!b}},a["public"].binders.unchecked={publishes:!0,priority:2e3,bind:function(b){return a.Util.bindEvent(b,"change",this.publish)},unbind:function(b){return a.Util.unbindEvent(b,"change",this.publish)},routine:function(a,b){var c;return a.checked="radio"===a.type?(null!=(c=a.value)?c.toString():void 0)!==(null!=b?b.toString():void 0):!b}},a["public"].binders.value={publishes:!0,priority:3e3,bind:function(b){return"INPUT"!==b.tagName||"radio"!==b.type?(this.event="SELECT"===b.tagName?"change":"input",a.Util.bindEvent(b,this.event,this.publish)):void 0},unbind:function(b){return"INPUT"!==b.tagName||"radio"!==b.type?a.Util.unbindEvent(b,this.event,this.publish):void 0},routine:function(a,b){var c,d,e,f,g,h,j;if("INPUT"===a.tagName&&"radio"===a.type)return a.setAttribute("value",b);if(null!=window.jQuery){if(a=jQuery(a),(null!=b?b.toString():void 0)!==(null!=(f=a.val())?f.toString():void 0))return a.val(null!=b?b:"")}else if("select-multiple"===a.type){if(null!=b){for(j=[],d=0,e=a.length;e>d;d++)c=a[d],j.push(c.selected=(g=c.value,i.call(b,g)>=0));return j}}else if((null!=b?b.toString():void 0)!==(null!=(h=a.value)?h.toString():void 0))return a.value=null!=b?b:""}},a["public"].binders["if"]={block:!0,priority:4e3,bind:function(a){var b,c;return null==this.marker?(b=[this.view.prefix,this.type].join("-").replace("--","-"),c=a.getAttribute(b),this.marker=document.createComment(" rivets: "+this.type+" "+c+" "),this.bound=!1,a.removeAttribute(b),a.parentNode.insertBefore(this.marker,a),a.parentNode.removeChild(a)):void 0},unbind:function(){var a;return null!=(a=this.nested)?a.unbind():void 0},routine:function(b,c){var d,e,f,g;if(!!c==!this.bound){if(c){f={},g=this.view.models;for(d in g)e=g[d],f[d]=e;return(this.nested||(this.nested=new a.View(b,f,this.view.options()))).bind(),this.marker.parentNode.insertBefore(b,this.marker.nextSibling),this.bound=!0}return b.parentNode.removeChild(b),this.nested.unbind(),this.bound=!1}},update:function(a){var b;return null!=(b=this.nested)?b.update(a):void 0}},a["public"].binders.unless={block:!0,priority:4e3,bind:function(b){return a["public"].binders["if"].bind.call(this,b)},unbind:function(){return a["public"].binders["if"].unbind.call(this)},routine:function(b,c){return a["public"].binders["if"].routine.call(this,b,!c)},update:function(b){return a["public"].binders["if"].update.call(this,b)}},a["public"].binders["on-*"]={"function":!0,priority:1e3,unbind:function(b){return this.handler?a.Util.unbindEvent(b,this.args[0],this.handler):void 0},routine:function(b,c){return this.handler&&a.Util.unbindEvent(b,this.args[0],this.handler),a.Util.bindEvent(b,this.args[0],this.handler=this.eventHandler(c))}},a["public"].binders["each-*"]={block:!0,priority:4e3,bind:function(a){var b,c,d,e,f;if(null==this.marker)b=[this.view.prefix,this.type].join("-").replace("--","-"),this.marker=document.createComment(" rivets: "+this.type+" "),this.iterated=[],a.removeAttribute(b),a.parentNode.insertBefore(this.marker,a),a.parentNode.removeChild(a);else for(f=this.iterated,d=0,e=f.length;e>d;d++)c=f[d],c.bind()},unbind:function(){var a,b,c,d,e;if(null!=this.iterated){for(d=this.iterated,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.unbind());return e}},routine:function(b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x;if(j=this.args[0],c=c||[],this.iterated.length>c.length)for(u=Array(this.iterated.length-c.length),o=0,r=u.length;r>o;o++)f=u[o],n=this.iterated.pop(),n.unbind(),this.marker.parentNode.removeChild(n.els[0]);for(g=p=0,s=c.length;s>p;g=++p)if(i=c[g],e={index:g},e[j]=i,null==this.iterated[g]){v=this.view.models;for(h in v)i=v[h],null==e[h]&&(e[h]=i);l=this.iterated.length?this.iterated[this.iterated.length-1].els[0]:this.marker,k=this.view.options(),k.preloadData=!0,m=b.cloneNode(!0),n=new a.View(m,e,k),n.bind(),this.iterated.push(n),this.marker.parentNode.insertBefore(m,l.nextSibling)}else this.iterated[g].models[j]!==i&&this.iterated[g].update(e);if("OPTION"===b.nodeName){for(w=this.view.bindings,x=[],q=0,t=w.length;t>q;q++)d=w[q],x.push(d.el===this.marker.parentNode&&"value"===d.type?d.sync():void 0);return x}},update:function(a){var b,c,d,e,f,g,h,i;b={};for(c in a)d=a[c],c!==this.args[0]&&(b[c]=d);for(h=this.iterated,i=[],f=0,g=h.length;g>f;f++)e=h[f],i.push(e.update(b));return i}},a["public"].binders["class-*"]=function(a,b){var c;return c=" "+a.className+" ",!b==(-1!==c.indexOf(" "+this.args[0]+" "))?a.className=b?""+a.className+" "+this.args[0]:c.replace(" "+this.args[0]+" "," ").trim():void 0},a["public"].binders["*"]=function(a,b){return null!=b?a.setAttribute(this.type,b):a.removeAttribute(this.type)},a["public"].adapters["."]={id:"_rv",counter:0,weakmap:{},weakReference:function(a){var b,c,d;return a.hasOwnProperty(this.id)||(b=this.counter++,Object.defineProperty(a,this.id,{value:b})),(c=this.weakmap)[d=a[this.id]]||(c[d]={callbacks:{}})},cleanupWeakReference:function(a,b){return Object.keys(a.callbacks).length||a.pointers&&Object.keys(a.pointers).length?void 0:delete this.weakmap[b]},stubFunction:function(a,b){var c,d,e;return d=a[b],c=this.weakReference(a),e=this.weakmap,a[b]=function(){var b,f,g,h,i,j,k,l,m,n;h=d.apply(a,arguments),k=c.pointers;for(g in k)for(f=k[g],n=null!=(l=null!=(m=e[g])?m.callbacks[f]:void 0)?l:[],i=0,j=n.length;j>i;i++)(b=n[i])();return h}},observeMutations:function(a,b,c){var d,e,f,g,h,j;if(Array.isArray(a)){if(f=this.weakReference(a),null==f.pointers)for(f.pointers={},e=["push","pop","shift","unshift","sort","reverse","splice"],h=0,j=e.length;j>h;h++)d=e[h],this.stubFunction(a,d);if(null==(g=f.pointers)[b]&&(g[b]=[]),i.call(f.pointers[b],c)<0)return f.pointers[b].push(c)}},unobserveMutations:function(a,b,c){var d,e,f;return Array.isArray(a)&&null!=a[this.id]&&(e=this.weakmap[a[this.id]])&&(f=e.pointers[b])?((d=f.indexOf(c))>=0&&f.splice(d,1),f.length||delete e.pointers[b],this.cleanupWeakReference(e,a[this.id])):void 0},observe:function(a,b,c){var d,e,f;return d=this.weakReference(a).callbacks,null==d[b]&&(d[b]=[],e=Object.getOwnPropertyDescriptor(a,b),(null!=e?e.get:void 0)||(null!=e?e.set:void 0)||(f=a[b],Object.defineProperty(a,b,{enumerable:!0,get:function(){return f},set:function(e){return function(g){var h,j,k,l;if(g!==f&&(e.unobserveMutations(f,a[e.id],b),f=g,h=e.weakmap[a[e.id]])){if(d=h.callbacks,d[b])for(l=d[b].slice(),j=0,k=l.length;k>j;j++)c=l[j],i.call(d[b],c)>=0&&c();return e.observeMutations(g,a[e.id],b)}}}(this)}))),i.call(d[b],c)<0&&d[b].push(c),this.observeMutations(a[b],a[this.id],b)},unobserve:function(a,b,c){var d,e,f;return(f=this.weakmap[a[this.id]])&&(d=f.callbacks[b])?((e=d.indexOf(c))>=0&&(d.splice(e,1),d.length||delete f.callbacks[b]),this.unobserveMutations(a[b],a[this.id],b),this.cleanupWeakReference(f,a[this.id])):void 0},get:function(a,b){return a[b]},set:function(a,b,c){return a[b]=c}},a.factory=function(b){return a.sightglass=b,a["public"]._=a,a["public"]},"object"==typeof("undefined"!=typeof module&&null!==module?module.exports:void 0)?module.exports=a.factory(require("sightglass")):"function"==typeof define&&define.amd?define(["sightglass"],function(b){return this.rivets=a.factory(b)}):this.rivets=a.factory(sightglass)}.call(this),function(){var a,b,c,d,e,f,g=function(a,b){return function(){return a.apply(b,arguments)}};b=function(){function a(){this.update=g(this.update,this)}return a.prototype.update=function(a){var b,c,e;for(c in a)e=a[c],"items"!==c&&(this[c]=e);return this.items=function(){var c,e,f,g;for(f=a.items,g=[],c=0,e=f.length;e>c;c++)b=f[c],g.push(new d(b));return g}()},a}(),d=function(){function a(a){this.propertyArray=g(this.propertyArray,this),this.update=g(this.update,this),this.update(a)}return a.prototype.update=function(a){var b,d;for(b in a)d=a[b],"properties"!==b&&(this[b]=d);return this.properties=c.Utils.extend({},a.properties)},a.prototype.propertyArray=function(){var a,b,c,d;c=this.properties,d=[];for(a in c)b=c[a],d.push({name:a,value:b});return d},a}(),c={settings:{debug:!1,dataAPI:!0,requestBodyClass:null,rivetsModels:{},currency:null,moneyFormat:null,moneyWithCurrencyFormat:null,weightUnit:"g",weightPrecision:0},cart:new b},c.init=function(a,b){return null==b&&(b={}),c.configure(b),c.Utils.log("Initialising CartJS."),c.cart.update(a),c.settings.dataAPI&&(c.Utils.log('"dataAPI" setting is true, initialising Data API.'),c.Data.init()),c.settings.requestBodyClass&&(c.Utils.log('"requestBodyClass" set, adding event listeners.'),jQuery(document).on("cart.requestStarted",function(){return jQuery("body").addClass(c.settings.requestBodyClass)}),jQuery(document).on("cart.requestComplete",function(){return jQuery("body").removeClass(c.settings.requestBodyClass)})),c.Rivets.init(),jQuery(document).trigger("cart.ready",[c.cart])},c.configure=function(a){return null==a&&(a={}),c.Utils.extend(c.settings,a)},null==window.console&&(window.console={},window.console.log=function(){}),c.Utils={log:function(){return c.Utils.console(console.log,arguments)},error:function(){return c.Utils.console(console.error,arguments)},console:function(a,b){return c.settings.debug&&"undefined"!=typeof console&&null!==console?(b=Array.prototype.slice.call(b),b.unshift("[CartJS]:"),a.apply(console,b)):void 0},wrapKeys:function(a,b,c){var d,e,f;null==b&&(b="properties"),f={};for(d in a)e=a[d],f[""+b+"["+d+"]"]=null!=c?c:e;return f},unwrapKeys:function(a,b,c){var d,e,f,g;null==b&&(b="properties"),e={};for(d in a)g=a[d],f=d.replace(""+b+"[","").replace("]",""),e[f]=null!=c?c:g;return e},extend:function(a,b){var c,d;for(c in b)d=b[c],a[c]=d;return a},clone:function(a){var b,c;if(null==a||"object"!=typeof a)return a;c=new a.constructor;for(b in a)c[b]=clone(a[b]);return c},isArray:Array.isArray||function(a){return"[object Array]"==={}.toString.call(a)},ensureArray:function(a){return c.Utils.isArray(a)?a:null!=a?[a]:[]},formatMoney:function(a,b,d,e){var f,g;return null==e&&(e=""),e||(e=c.settings.currency),null!=window.Currency&&e!==c.settings.currency&&(a=Currency.convert(a,c.settings.currency,e),null!=(null!=(f=window.Currency)?f.moneyFormats:void 0)&&e in window.Currency.moneyFormats&&(b=window.Currency.moneyFormats[e][d])),null!=(null!=(g=window.Shopify)?g.formatMoney:void 0)?Shopify.formatMoney(a,b):a},getSizedImageUrl:function(a,b){var c,d;return null!=(null!=(c=window.Shopify)&&null!=(d=c.Image)?d.getSizedImageUrl:void 0)?a?Shopify.Image.getSizedImageUrl(a,b):Shopify.Image.getSizedImageUrl("https://cdn.shopify.com/s/images/admin/no-image-.gif",b).replace("-_","-"):a?a:"https://cdn.shopify.com/s/images/admin/no-image-large.gif"}},f=[],e=!1,c.Queue={add:function(a,b,d){var g;return null==d&&(d={}),g={url:a,data:b,type:d.type||"POST",dataType:d.dataType||"json",success:c.Utils.ensureArray(d.success),error:c.Utils.ensureArray(d.error),complete:c.Utils.ensureArray(d.complete)},d.updateCart&&g.success.push(c.cart.update),f.push(g),e?void 0:(jQuery(document).trigger("cart.requestStarted",[c.cart]),c.Queue.process())},process:function(){var a;return f.length?(e=!0,a=f.shift(),a.complete=c.Queue.process,jQuery.ajax(a)):(e=!1,void jQuery(document).trigger("cart.requestComplete",[c.cart]))}},c.Core={getCart:function(a){return null==a&&(a={}),a.type="GET",a.updateCart=!0,c.Queue.add("/cart.js",{},a)},addItem:function(a,b,d,e){var f;return null==b&&(b=1),null==d&&(d={}),null==e&&(e={}),f=c.Utils.wrapKeys(d),f.id=a,f.quantity=b,c.Queue.add("/cart/add.js",f,e),c.Core.getCart()},updateItem:function(a,b,d,e){var f;return null==d&&(d={}),null==e&&(e={}),f=c.Utils.wrapKeys(d),f.line=a,null!=b&&(f.quantity=b),e.updateCart=!0,c.Queue.add("/cart/change.js",f,e)},removeItem:function(a,b){return null==b&&(b={}),c.Core.updateItem(a,0,{},b)},updateItemById:function(a,b,d,e){var f;return null==d&&(d={}),null==e&&(e={}),f=c.Utils.wrapKeys(d),f.id=a,null!=b&&(f.quantity=b),e.updateCart=!0,c.Queue.add("/cart/change.js",f,e)},updateItemQuantitiesById:function(a,b){return null==a&&(a={}),null==b&&(b={}),b.updateCart=!0,c.Queue.add("/cart/update.js",{updates:a},b)},removeItemById:function(a,b){var d;return null==b&&(b={}),d={id:a,quantity:0},b.updateCart=!0,c.Queue.add("/cart/change.js",d,b)},clear:function(a){return null==a&&(a={}),a.updateCart=!0,c.Queue.add("/cart/clear.js",{},a)},getAttribute:function(a,b){return a in c.cart.attributes?c.cart.attributes[a]:b},setAttribute:function(a,b,d){var e;return null==d&&(d={}),e={},e[a]=b,c.Core.setAttributes(e,d)},getAttributes:function(){return c.cart.attributes},setAttributes:function(a,b){return null==a&&(a={}),null==b&&(b={}),b.updateCart=!0,c.Queue.add("/cart/update.js",c.Utils.wrapKeys(a,"attributes"),b)},clearAttributes:function(a){return null==a&&(a={}),a.updateCart=!0,c.Queue.add("/cart/update.js",c.Utils.wrapKeys(c.Core.getAttributes(),"attributes",""),a)},getNote:function(){return c.cart.note},setNote:function(a,b){return null==b&&(b={}),b.updateCart=!0,c.Queue.add("/cart/update.js",{note:a},b)}},a=null,c.Data={init:function(){return a=jQuery(document),c.Data.setEventListeners("on"),c.Data.render(null,c.cart)},destroy:function(){return c.Data.setEventListeners("off")},setEventListeners:function(b){return a[b]("click","[data-cart-add]",c.Data.add),a[b]("click","[data-cart-remove]",c.Data.remove),a[b]("click","[data-cart-remove-id]",c.Data.removeById),a[b]("click","[data-cart-update]",c.Data.update),a[b]("click","[data-cart-update-id]",c.Data.updateById),a[b]("click","[data-cart-clear]",c.Data.clear),a[b]("change","[data-cart-toggle]",c.Data.toggle),a[b]("change","[data-cart-toggle-attribute]",c.Data.toggleAttribute),a[b]("submit","[data-cart-submit]",c.Data.submit),a[b]("cart.requestComplete",c.Data.render)},add:function(a){var b;return a.preventDefault(),b=jQuery(this),c.Core.addItem(b.attr("data-cart-add"),b.attr("data-cart-quantity"))},remove:function(a){var b;return a.preventDefault(),b=jQuery(this),c.Core.removeItem(b.attr("data-cart-remove"))},removeById:function(a){var b;return a.preventDefault(),b=jQuery(this),c.Core.removeItemById(b.attr("data-cart-remove-id"))},update:function(a){var b;return a.preventDefault(),b=jQuery(this),c.Core.updateItem(b.attr("data-cart-update"),b.attr("data-cart-quantity"))},updateById:function(a){var b;return a.preventDefault(),b=jQuery(this),c.Core.updateItemById(b.attr("data-cart-update-id"),b.attr("data-cart-quantity"))},clear:function(a){return a.preventDefault(),c.Core.clear()},toggle:function(){var a,b;return a=jQuery(this),b=a.attr("data-cart-toggle"),a.is(":checked")?c.Core.addItem(b):c.Core.removeItemById(b);

},toggleAttribute:function(){var a,b;return a=jQuery(this),b=a.attr("data-cart-toggle-attribute"),c.Core.setAttribute(b,a.is(":checked")?"Yes":"")},submit:function(a){var b,d,e,f;return a.preventDefault(),b=jQuery(this).serializeArray(),d=void 0,f=void 0,e={},jQuery.each(b,function(a,b){return"id"===b.name?d=b.value:"quantity"===b.name?f=b.value:e[b.name]=b.value}),c.Core.addItem(d,f,c.Utils.unwrapKeys(e))},render:function(a,b){var d;return d={item_count:b.item_count,total_price:b.total_price,total_price_money:c.Utils.formatMoney(b.total_price,c.settings.moneyFormat,"money_format",null!=("undefined"!=typeof Currency&&null!==Currency?Currency.currentCurrency:void 0)?Currency.currentCurrency:void 0),total_price_money_with_currency:c.Utils.formatMoney(b.total_price,c.settings.moneyWithCurrencyFormat,"money_with_currency_format",null!=("undefined"!=typeof Currency&&null!==Currency?Currency.currentCurrency:void 0)?Currency.currentCurrency:void 0)},jQuery("[data-cart-render]").each(function(){var a;return a=jQuery(this),a.html(d[a.attr("data-cart-render")])})}},"rivets"in window?(c.Rivets={model:null,boundViews:[],init:function(){return c.Rivets.bindViews()},destroy:function(){return c.Rivets.unbindViews()},bindViews:function(){return c.Utils.log("Rivets.js is present, binding views."),c.Rivets.unbindViews(),c.Rivets.model=c.Utils.extend({cart:c.cart},c.settings.rivetsModels),null!=window.Currency&&(c.Rivets.model.Currency=window.Currency),jQuery("[data-cart-view]").each(function(){var a;return a=rivets.bind(jQuery(this),c.Rivets.model),c.Rivets.boundViews.push(a)})},unbindViews:function(){var a,b,d,e;for(e=c.Rivets.boundViews,b=0,d=e.length;d>b;b++)a=e[b],a.unbind();return c.Rivets.boundViews=[]}},rivets.formatters.eq=function(a,b){return a===b},rivets.formatters.includes=function(a,b){return a.indexOf(b)>=0},rivets.formatters.match=function(a,b,c){return a.match(new RegExp(b,c))},rivets.formatters.lt=function(a,b){return b>a},rivets.formatters.gt=function(a,b){return a>b},rivets.formatters.not=function(a){return!a},rivets.formatters.empty=function(a){return!a.length},rivets.formatters.plus=function(a,b){return parseInt(a)+parseInt(b)},rivets.formatters.minus=function(a,b){return parseInt(a)-parseInt(b)},rivets.formatters.prepend=function(a,b){return b+a},rivets.formatters.append=function(a,b){return a+b},rivets.formatters.slice=function(a,b,c){return a.slice(b,c)},rivets.formatters.pluralize=function(a,b,d){return null==d&&(d=b+"s"),c.Utils.isArray(a)&&(a=a.length),1===a?b:d},rivets.formatters.array_element=function(a,b){return a[b]},rivets.formatters.array_first=function(a){return a[0]},rivets.formatters.array_last=function(a){return a[a.length-1]},rivets.formatters.money=function(a,b){return c.Utils.formatMoney(a,c.settings.moneyFormat,"money_format",b)},rivets.formatters.money_with_currency=function(a,b){return c.Utils.formatMoney(a,c.settings.moneyWithCurrencyFormat,"money_with_currency_format",b)},rivets.formatters.weight=function(a){switch(c.settings.weightUnit){case"kg":return(a/1e3).toFixed(c.settings.weightPrecision);case"oz":return(.035274*a).toFixed(c.settings.weightPrecision);case"lb":return(.00220462*a).toFixed(c.settings.weightPrecision);default:return a.toFixed(c.settings.weightPrecision)}},rivets.formatters.weight_with_unit=function(a){return rivets.formatters.weight(a)+c.settings.weightUnit},rivets.formatters.product_image_size=function(a,b){return c.Utils.getSizedImageUrl(a,b)},rivets.formatters.moneyWithCurrency=rivets.formatters.money_with_currency,rivets.formatters.weightWithUnit=rivets.formatters.weight_with_unit,rivets.formatters.productImageSize=rivets.formatters.product_image_size):c.Rivets={init:function(){},destroy:function(){}},c.factory=function(a){return a.init=c.init,a.configure=c.configure,a.cart=c.cart,a.settings=c.settings,a.getCart=c.Core.getCart,a.addItem=c.Core.addItem,a.updateItem=c.Core.updateItem,a.updateItemById=c.Core.updateItemById,a.updateItemQuantitiesById=c.Core.updateItemQuantitiesById,a.removeItem=c.Core.removeItem,a.removeItemById=c.Core.removeItemById,a.clear=c.Core.clear,a.getAttribute=c.Core.getAttribute,a.setAttribute=c.Core.setAttribute,a.getAttributes=c.Core.getAttributes,a.setAttributes=c.Core.setAttributes,a.clearAttributes=c.Core.clearAttributes,a.getNote=c.Core.getNote,a.setNote=c.Core.setNote,a.render=c.Data.render},"object"==typeof exports?c.factory(exports):"function"==typeof define&&define.amd?define(["exports"],function(a){return c.factory(this.CartJS=a),a}):c.factory(this.CartJS={})}.call(this);