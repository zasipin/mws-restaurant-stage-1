let mapLoaded = false;

/**
 * Create address markup
 */
const createAddressHTML = (restaurant) => {
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.classList.add('adr');
  address.setAttribute('aria-label', 'Restaurant address');
  address.tabIndex = 0;
  
  const div = document.createElement('div');
  div.classList.add('vcard');

  div.append(address);
  return div;
}

/**
 * TODO: install service worker
 */
if(navigator.serviceWorker) {
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    //console.log("sw registered");
  });
}

/**
 * TODO: remove markers from taborder
 */
window.addEventListener('load', () => {
  document.querySelectorAll('#map area').forEach((el) => {el.setAttribute('tabindex', '-1')});

  let mapElement = document.getElementById('map');
  mapElement.addEventListener('click', loadMapScript);
  document.body.addEventListener('mouseover', loadMapScript);
  document.body.addEventListener('scroll', loadMapScript);
});

// document.addEventListener('DOMContentLoaded', (event) => {
 
// });

function loadMapScript(evt){
  if(!mapLoaded){
    mapLoaded = true;
    loadScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyBVCrR9mb9pJ_ep5aiC7q0KBYs6SJThzb0&libraries=places&callback=initMap");
  }
  if(evt && evt.target)
    evt.target.removeEventListener(evt.type, loadMapScript);
}

function lazyLoadImages(){
  lazyLoad("img.lazy");
}

function lazyLoad(selector){
   // TODO: setup InersectionObserver for images
  if (window.IntersectionObserver) {
    let lazyItemsObserver = new IntersectionObserver((items, observer) => {
      items.forEach((item) => {
        if (item.isIntersecting) {
          let lazyItem = item.target;
          lazyItem.src = lazyItem.dataset.src;
          lazyItem.srcset = lazyItem.dataset.srcset;
          lazyItem.classList.remove('lazy');
          lazyItemsObserver.unobserve(lazyItem);
        }
      });
    });
    
    document.querySelectorAll(selector).forEach((lazyItem) => {
      lazyItemsObserver.observe(lazyItem);
    });
  } else {
    // TODO: no IntersectObserver - fall back to a more compatible method
  }
}

function loadScript(source, timeout){
  // setTimeout(function() {
    let script = document.createElement('script');
    script.src = source;
    script.async = true;
    script.type = 'text/javascript';
    // script.setAttribute('async', 'true');
    document.body.appendChild(script);
  // }, timeout || 10);
  
}

function loadCss(hrefLink){
  let css = document.createElement('link');
  css.type = 'text/css';
  css.rel = 'stylesheet';
  css.href = hrefLink;
  document.head.appendChild(css);
}