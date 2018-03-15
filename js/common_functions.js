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
