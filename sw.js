const chacheNamePrefix = 'udacity_restaurants';
const cacheNameCurrent = `${chacheNamePrefix}_v1.2`;
const urlsToCache = [
                      '/',
                      '/restaurant.html',
                      'js/main.js',
                      'js/common_functions.js',
                      'js/dbhelper.js',
                      'js/restaurant_info.js',
                      'css/styles.css',
                      'data/restaurants.json'
                     ];
const cacheFilterForDelete = (cacheName) => { return cacheName.startsWith(chacheNamePrefix) && cacheName !== cacheNameCurrent };                     

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(cacheNameCurrent).then((cache) => {
      return cache.addAll(urlsToCache);
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

  // TODO - make reatsurants page live offline, ignore search string in url
  if (requestUrl.origin === location.origin && 
      requestUrl.pathname.startsWith('/restaurant')) {
    matchOptions.ignoreSearch = true;
  }

  evt.respondWith(
    caches.match(evt.request, matchOptions).then((response) => {
      // TODO - respond with cache data or fetch from network
      return response || 
        fetch(evt.request).then((resp) => {
          // TODO - save response for network request
          caches.open(cacheNameCurrent).then((cache) => {
            cache.put(evt.request, resp);
          });
          return resp.clone();
        });
    })
  );
});