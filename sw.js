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

  }

  evt.respondWith(
    caches.match(evt.request, matchOptions).then((response) => {
      // TODO - respond with cache data or fetch from network
      return response || 
        fetch(evt.request).then((resp) => {
          // TODO - save response for network request
          let clonedResp = resp.clone();
          if(doNotCacheRestaurants) {
            if(allRestaurantsRequest) {
            // TODO: save restaurants request to DB
              let restaurantsClonedResp = resp.clone();
              saveRestaurants(openDb(), restaurantsClonedResp.json());
            }
          } else {
            caches.open(cacheNameCurrent).then((cache) => {
              cache.put(evt.request, clonedResp);
            });
          }
        
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
  return dbPromise.then(db => { 
    let tx = db.transaction('restaurants');
    let store = tx.objectStore('restaurants');
    return store.get(restaurantId);
  });
}

function openDb(){
  const dbPromise = idb.open(DBHelper.DBNAME, 1, upgradeDB => {
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

// let dbPromise = DBHelper.openDb();
//     DBHelper.getRestaurantById(dbPromise, id).then(storedRestaurant => {
//       if(!storedRestaurant) {

  // let dbPromise = DBHelper.openDb();
  // DBHelper.saveRestaurants(dbPromise, restaurants);
