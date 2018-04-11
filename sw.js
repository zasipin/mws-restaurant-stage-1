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
          let clonedResp = resp.clone();
          caches.open(cacheNameCurrent).then((cache) => {
            cache.put(evt.request, clonedResp);
          });
          return resp;
        });
    })
  );
});