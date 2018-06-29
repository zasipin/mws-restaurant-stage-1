let restaurant,
    map, 
    reviews = [];

// document.addEventListener('DOMContentLoaded', () => {
// });

window.addEventListener('load', () => {
  loadCss('public/styles_restaurant.css');

  // loadScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyBVCrR9mb9pJ_ep5aiC7q0KBYs6SJThzb0&libraries=places&callback=initMap");
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  if (!self.restaurant) {
    return;
  }
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);

  lazyLoadImages();
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

function fetchReviewsForRestaurant(restaurantId){
  if (!restaurantId) { // no id found in URL
    return [];    
  }

  DBHelper.fetchReviewsForRestaurant(restaurantId, (error, reviews) => {
    self.reviews = reviews;
    if (!reviews && error) {
      console.error(error);
      return;
    }
    fillReviewsHTML(reviews);
    // callback(null, restaurant);
  });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;

  const address = document.getElementById('restaurant-address');
  // address.innerHTML = restaurant.address;
  address.appendChild(createAddressHTML(restaurant));
  address.tabIndex = 0;
  
  const image = document.getElementById('restaurant-img');
  const photograph = restaurant.photograph;
  restaurant.photograph = undefined;
  image.classList.add('restaurant-img', 'lazy');
  image.alt = `${restaurant.name} restaurant photo`;
  
  let imgSrc_266 = DBHelper.imageUrlForRestaurant(restaurant, "resized_266/"); 
  let imgSrc_430 = DBHelper.imageUrlForRestaurant(restaurant, "resized_430/"); 
  let imgSrc_600 = DBHelper.imageUrlForRestaurant(restaurant, "resized_600/"); 
  let imgSrc_650 = DBHelper.imageUrlForRestaurant(restaurant, "resized_650/"); 
  let imgSrc_800 = DBHelper.imageUrlForRestaurant(restaurant); 
  image.src = imgSrc_430;
  image.srcset = `${imgSrc_266} 266w, ${imgSrc_430} 430w, ${imgSrc_600} 600w, ${imgSrc_650} 650w`;
  // TODO: Set dataset attributes
  restaurant.photograph = photograph;
  imgSrc_266 = DBHelper.imageUrlForRestaurant(restaurant, "resized_266/"); 
  imgSrc_430 = DBHelper.imageUrlForRestaurant(restaurant, "resized_430/"); 
  imgSrc_600 = DBHelper.imageUrlForRestaurant(restaurant, "resized_600/"); 
  imgSrc_650 = DBHelper.imageUrlForRestaurant(restaurant, "resized_650/"); 
  imgSrc_800 = DBHelper.imageUrlForRestaurant(restaurant); 
  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.srcset = `${imgSrc_266} 266w, ${imgSrc_430} 430w, ${imgSrc_600} 600w, ${imgSrc_650} 650w, ${imgSrc_800} 800w`;  

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-label', 'restaurant cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.tabIndex = 0;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  // fillReviewsHTML();
  fetchReviewsForRestaurant(restaurant.id);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.tabIndex = 0;
    day.setAttribute('aria-label', 'day');
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.tabIndex = 0;
    time.setAttribute('aria-label', 'open hours');
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {

  // add form events listener
  addFormEventListener();

  const container = document.getElementById('reviews-container');
  
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.setAttribute('tabindex', '0');
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const divRL = document.getElementById('reviews-list');
  divRL.setAttribute('aria-label', 'reviews list');
  reviews.forEach(review => {
    divRL.appendChild(createReviewHTML(review));
  });
  container.appendChild(divRL);
}

function appendChildReview(review){
  const divRL = document.getElementById('reviews-list');
  divRL.appendChild(createReviewHTML(review));
}

/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review){
  const article = document.createElement('article');
  article.setAttribute('aria-label', 'review item');
 
  const div = document.createElement('div');
  div.classList.add("list-header");
  
  const date = document.createElement('p');
  date.innerHTML = (new Date(review.updatedAt)).toDateString();
  date.setAttribute('aria-label', 'review date');
  date.setAttribute('tabindex', '0');
  date.classList.add("comment-date");
  div.appendChild(date);
  
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('aria-label', 'username');
  name.setAttribute('tabindex', '0');
  div.appendChild(name);
  article.appendChild(div);
  
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add("rating");
  rating.setAttribute('aria-label', 'rating');
  rating.setAttribute('tabindex', '0');
  article.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add("review");
  comments.setAttribute('aria-label', 'review');
  comments.setAttribute('tabindex', '0');
  article.appendChild(comments);

  return article;
}

function addFormEventListener(){
  const formR = document.getElementById('review-form');
  formR.addEventListener('submit', (event)=>{
    event.preventDefault();
    let elems = event.target.elements;
    let review = {
      "restaurant_id": this.restaurant.id,
      "name": elems.name.value,
      "rating": elems.rating.value,
      "comments": elems.comments.value
    };
    DBHelper.saveReviewForRestaurant(review, (err, response)=>{
      if(err){
        // console.log(err, response);
        appendChildReview(review);
        return;
      }
      // createReviewHTML(response);
      appendChildReview(response);
    });
  })
};

// function createReviewHTML(response){

// }

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-label', 'active page');
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

fetchRestaurantFromURL((error, restaurant) => {
  if (error) { // Got an error!
    console.error(error);
  } else {
    fillBreadcrumb(); 
    lazyLoadImages();
  }
});

