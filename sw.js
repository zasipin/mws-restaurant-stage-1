(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      request.onupgradeneeded = function(event) {
        if (upgradeCallback) {
          upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
        }
      };

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());

const chacheNamePrefix = 'udacity_restaurants';
const cacheNameCurrent = `${chacheNamePrefix}_v1.3`;
const urlsToCache = [
                      '/',
                      '/index.html',
                      '/restaurant.html',
                      'js/main.js',
                      'js/common_functions.js',
                      'js/dbhelper.js',
                      'js/restaurant_info.js',
                      'css/styles.css'
                     ];
const dBName = 'MWSRestaurants';                     
                                
const cacheFilterForDelete = (cacheName) => { return cacheName.startsWith(chacheNamePrefix) && cacheName !== cacheNameCurrent };                     
const constructImagesArray = (prefix) => {
  let images = [];
  for(let i = 1; i <= 10; i++){
    images.push(`${prefix}${i}.jpg`); 
  }
  return images;
}

const imagesToCache = constructImagesArray('/img/');
const imagesToCache266 = constructImagesArray('/img/resized_266/');
const imagesToCache430 = constructImagesArray('/img/resized_430/');

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(cacheNameCurrent).then((cache) => {
      return cache.addAll(urlsToCache).then(()=>{
        // return cache.addAll([...imagesToCache, ...imagesToCache430, ...imagesToCache266]);
      });
    })
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(cacheFilterForDelete)
        .map((cacheName) => {
          // TODO - delete old cache
          return caches.delete(cacheName);
        })
      )
    })
  );
});

self.addEventListener('fetch', (evt) => {
  const requestUrl = new URL(evt.request.url);
  let matchOptions = {};
  let doNotCacheRestaurants,
      allRestaurantsRequest,
      singleRestaurantRequest;

  // TODO - make restaurants page live offline, ignore search string in url
  if (requestUrl.origin === location.origin && 
      requestUrl.pathname.startsWith('/restaurant')) {
    matchOptions.ignoreSearch = true;
  }

  if (requestUrl.origin !== location.origin && 
    requestUrl.pathname.startsWith('/restaurants')){
      doNotCacheRestaurants = true;
      if(requestUrl.pathname === '/restaurants')
        allRestaurantsRequest = true;
      else
        singleRestaurantRequest = true;
  }

  if(doNotCacheRestaurants){
    if(allRestaurantsRequest){
      evt.respondWith(
        getAllRestaurants(openDb())
        .then((restaurants) => {
          if(restaurants && restaurants.length > 0 ){
            return constructResponse(restaurants);
          } else {
            return fetchRestaurants(evt);
          }
        })
      );
    }

    if(singleRestaurantRequest){
      let restaurantId = getRestaurantIdFromUrl(requestUrl);
      evt.respondWith(
        getRestaurantById(openDb(), restaurantId)
        .then((restaurant) => {
          if(restaurant){
            return constructResponse(restaurant);        
          } else {
            return fetchRestaurants(evt);
          }
        })
      );
    }
    return;
  }

  evt.respondWith(
    caches.match(evt.request, matchOptions).then((response) => {
      // TODO - respond with cache data or fetch from network
      return response || 
        fetch(evt.request).then((resp) => {
          // TODO - save response for network request
          let clonedResp = resp.clone();
          // if(doNotCacheRestaurants) {
          //   if(allRestaurantsRequest) {
          //   // TODO: save restaurants request to DB
          //     let restaurantsClonedResp = resp.clone();
          //     saveRestaurants(openDb(), restaurantsClonedResp.json());
          //   }
          // } else {
            caches.open(cacheNameCurrent).then((cache) => {
              cache.put(evt.request, clonedResp);
            });
          // }
        
          return resp;
        });
    })
  );


});

function saveRestaurants(dbPromise, restaurants){
  let tx = dbPromise.then(db => { 
    let tx = db.transaction('restaurants', 'readwrite');
    let store = tx.objectStore('restaurants');
    for(let restaurant of restaurants){
      store.get(restaurant.id).then(val => {
        if(!val)
          store.put(restaurant);
      })
    }
  })
}

function getRestaurantById(dbPromise, restaurantId){  
  console.log('restaurant id: ', restaurantId);
  return dbPromise.then(db => { 
    let tx = db.transaction('restaurants');
    let store = tx.objectStore('restaurants');
    return store.get(restaurantId);
  })
  .then((restaurant) => {
    return restaurant;
  });
}

function getAllRestaurants(dbPromise){
  let restaurants = [];
  return dbPromise.then(db => { 
    let tx = db.transaction('restaurants');
    let store = tx.objectStore('restaurants');
    return store.openCursor();
  })
  .then(function readRestaurant(cursor){
    if(!cursor) return;
    restaurants.push(cursor.value);
    return cursor.continue().then(readRestaurant);
  })
  .then(() => restaurants);
}

function openDb(){
  const dbPromise = idb.open(dBName, 1, upgradeDB => {
    // Note: we don't use 'break' in this switch statement,
    // the fall-through behaviour is what we want.
    switch (upgradeDB.oldVersion) {
      case 0:
       var restaurantsStore = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
       restaurantsStore.createIndex('cuisines', 'cuisine_type');
       restaurantsStore.createIndex('neighborhoods', 'neighborhood');
      // case 1:
      //   upgradeDB.createObjectStore('objs', {keyPath: 'id'});
    }
  });

  return dbPromise;
} 

function fetchRestaurants(evt){
  return fetch(evt.request).then((resp) => {
    // TODO - save response for network request
    // console.log('restaurants response: ', resp);
    let clonedResp = resp.clone();
    // TODO: save restaurants request to DB
    let restaurantsClonedResp = resp.clone();
    restaurantsClonedResp.json()
    .then(restaurants => {
      if(!Array.isArray(restaurants)) 
        saveRestaurants(openDb(), [restaurants]);
      saveRestaurants(openDb(), restaurants);
    });    
    return resp;
  });
}

function getRestaurantIdFromUrl(requestUrl){
  console.log('requestUrl.pathname: ', requestUrl.pathname);
  let segments = requestUrl.pathname.split('/');
  return segments.length > 1 ? segments[2] : null;
};

function constructResponse(jsonData){
  let blob = new Blob([JSON.stringify(jsonData)], {type : 'application/json'});
  let init = { "status" : 200, "type": "json" };
         
  return new Response(blob, init); 
}

// let dbPromise = DBHelper.openDb();
//     DBHelper.getRestaurantById(dbPromise, id).then(storedRestaurant => {
//       if(!storedRestaurant) {

  // let dbPromise = DBHelper.openDb();
  // DBHelper.saveRestaurants(dbPromise, restaurants);
