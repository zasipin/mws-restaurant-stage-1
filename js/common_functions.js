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
});

function lazyLoadImages(){
  lazyLoad("img.lazy");
}

function lazyLoad(selector){
   // TODO: setup InersectionObserver for images
  if (window.IntersectionObserver) {
    let lazyImageObserver = new IntersectionObserver((images, observer) => {
      images.forEach((image) => {
        if (image.isIntersecting) {
          let lazyImage = image.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    
    document.querySelectorAll(selector).forEach((lazyImage) => {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // TODO: no IntersectObserver - fall back to a more compatible method
  }
}

function loadScript(source, timeout){
  // setTimeout(function() {
    let script = document.createElement('script');
    script.src = source;
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