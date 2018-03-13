/**
 * Create address markup
 */
const createAddressHTML = (restaurant) => {
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.classList.add("adr");
  address.tabIndex = 0;
  
  const div = document.createElement('div');
  div.classList.add("vcard");

  div.append(address);
  return div;
}