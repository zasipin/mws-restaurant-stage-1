let restaurants,
  neighborhoods,
  cuisines;
var map,
    markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

window.addEventListener('load', () => {
  loadScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyBVCrR9mb9pJ_ep5aiC7q0KBYs6SJThzb0&libraries=places&callback=initMap");
  loadCss('css/styles.css');
  loadCss('css/styles_main.css');
  loadCss('css/styles_media.css');
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let self = this;
  setTimeout(()=>{
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    updateRestaurants();
  }, 100);
  
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      lazyLoadImages();
    }
  });
  
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  // TODO - add class to list item
  li.classList.add("restaurant-item");
  li.setAttribute('aria-label', 'restaurant item');
 

    const image = document.createElement('img');
    let photograph = restaurant.photograph;
    restaurant.photograph = undefined;
    image.classList.add('restaurant-img','lazy');
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = `${restaurant.name} restaurant photo`;
    let imgSrc_266 = DBHelper.imageUrlForRestaurant(restaurant, "resized_266/"); 
    let imgSrc_430 = DBHelper.imageUrlForRestaurant(restaurant, "resized_430/"); 
    let imgSrc_600 = DBHelper.imageUrlForRestaurant(restaurant, "resized_600/"); 
    let imgSrc_650 = DBHelper.imageUrlForRestaurant(restaurant, "resized_650/"); 
    let imgSrc_800 = DBHelper.imageUrlForRestaurant(restaurant);
    image.src = imgSrc_430;
    image.srcset = `${imgSrc_266} 266w, ${imgSrc_430} 430w, ${imgSrc_600} 600w, ${imgSrc_650} 650w`;
      
    restaurant.photograph = photograph;
    // setTimeout(()=>{
      // TODO: set data for lazy loading
      imgSrc_266 = DBHelper.imageUrlForRestaurant(restaurant, "resized_266/"); 
      imgSrc_430 = DBHelper.imageUrlForRestaurant(restaurant, "resized_430/"); 
      imgSrc_600 = DBHelper.imageUrlForRestaurant(restaurant, "resized_600/"); 
      imgSrc_650 = DBHelper.imageUrlForRestaurant(restaurant, "resized_650/"); 
      imgSrc_800 = DBHelper.imageUrlForRestaurant(restaurant);
      image.dataset.src = imgSrc_430;
      image.dataset.srcset = `${imgSrc_266} 266w, ${imgSrc_430} 430w, ${imgSrc_600} 600w, ${imgSrc_650} 650w`;

    // }, 300);

  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;
  name.setAttribute('aria-label', 'restaurant name');
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.classList.add("neighborhood");
  neighborhood.tabIndex = 0;
  neighborhood.setAttribute('aria-label', 'Neighborhood');
  li.append(neighborhood);

  li.append(createAddressHTML(restaurant));

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);
 
  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

// function lazyLoadImages(){
//   //  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  
//    // TODO: setup InersectionObserver for images
//   if (window.IntersectionObserver) {
//     let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
//       entries.forEach(function(entry) {
//         if (entry.isIntersecting) {
//           let lazyImage = entry.target;
//           lazyImage.src = lazyImage.dataset.src;
//           lazyImage.srcset = lazyImage.dataset.srcset;
//           lazyImage.classList.remove("lazy");
//           lazyImageObserver.unobserve(lazyImage);
//         }
//       });
//     });
    
//     document.querySelectorAll("img.lazy").forEach(function(lazyImage) {
//       lazyImageObserver.observe(lazyImage);
//     });
//   } else {
//     // TODO: no IntersectObserver - fall back to a more compatible method here
//  }

// }