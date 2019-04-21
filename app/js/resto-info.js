import {MDCRipple} from '@material/ripple';
import {MDCIconButtonToggle} from '@material/icon-button';

let map;
let restaurant;
let restaurant_id;
let is_favorite = false;

const elementBreadcrumb = document.getElementById('breadcrumb');
const elementCardPrimary = document.getElementById('card-primary');
const elementRestaurantName = document.getElementById('restaurant-name');
const elementRestaurantAddress = document.getElementById('restaurant-address');
const elementAddToFavorites = document.getElementById('add-to-favorites');
const elementRestaurantCuisine = document.getElementById('restaurant-cuisine');
const elementRestaurantHours = document.getElementById('restaurant-hours');
const elementReviewLink = document.getElementById('review-link');
const elementMapsContainer = document.getElementById('maps-container');
const elementGoogleMaps = document.getElementById('google-maps');
const elementGoogleStaticMaps = document.getElementById('google-static-maps');
const elementReviewsContainer = document.getElementById('reviews-container');
const elementReviewsList = document.getElementById('reviews-list');

// Enhance icon button to have a ripple effect by instantiating MDCRipple 
// on the root element.
const iconButtonRipple = 
  new MDCRipple(document.querySelector('.mdc-icon-button'));
iconButtonRipple.unbounded = true;

const toggleFavoriteButton = 
  new MDCIconButtonToggle(elementAddToFavorites);

elementAddToFavorites.addEventListener('MDCIconButtonToggle:change', function(evt) {
  if (evt.detail.isOn) {
    is_favorite = true;
    postIsFavoriteNetworkFirst(self.restaurant_id, is_favorite)
  } else {
    is_favorite = false;
    postIsFavoriteNetworkFirst(self.restaurant_id, is_favorite);
  }
});

/**
 * Post the is_favorite status by restaurant_id, save data locally to IndexedDB,
 * send to API server, update UI.
 */
const postIsFavoriteNetworkFirst = (restaurant_id, is_favorite) => {
  let endpointPostIsFavorite = 
    `http://localhost:1337/restaurants/${restaurant_id}/?is_favorite=${is_favorite}`;
  DBHelper.postRequest(endpointPostIsFavorite)
  .then(dataFromNetwork => {
    console.log(`[DEBUG] POST is_favorite=${is_favorite}`);
  }).catch(err => {
    console.log('[DEBUG] Network requests have failed, this is expected if offline');
  });
}  

/**
 * Start the following when the initial HTML document has been
 * completely loaded and parsed, without waiting for stylesheets, images,
 * and subframes to finish loading.
 * Fetch neighborhoods and cuisines.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  createMapsStatic();
  self.restaurant_id = getParameterByName('id');
  loadRestaurantNetworkFirst(self.restaurant_id);
});

/**
 * Embed a Google Maps image on your web page using the Maps Static API.
 */
const createMapsStatic = () => {
  let mapsStaticUrl 
    = `https://maps.googleapis.com/maps/api/staticmap?parameters`;
  const mapsCenter = `40.722216,-73.987501`;
  const mapsZoom = 12;
  let mapsImageWidth = 640;
  let mapsImageHeight = 640;
  let mapsScale = 1;
  const mapsImageFormat = 'jpg';
  const mapsApiKey = `AIzaSyD0R6ba0eD7BDPcUEpQBmEQ1JyMSf7NRYc`;
  const imageMapsStatic = new Image();
  imageMapsStatic.id = 'static-map';
  imageMapsStatic.className = 'google-maps-static-img';
  imageMapsStatic.setAttribute('onclick', 'showGoogleMaps()');
  imageMapsStatic.alt 
    = 'Static map showing high level view of New York, Manhattan and Brooklyn';
  const intElemClientWidth = elementMapsContainer.clientWidth;
  if (intElemClientWidth <= 640) {
    mapsImageWidth = intElemClientWidth;
  } else {
    mapsScale = 2;
    mapsImageWidth = 640
  }
  const intElementClientHeight = elementMapsContainer.clientHeight;
  if (intElementClientHeight <= 640) {
    mapsImageHeight = intElementClientHeight;
  } else {
    mapsScale = 2;
    mapsImageHeight = 640
  }
  let mapsImageSizes = `${mapsImageWidth}x${mapsImageHeight}`;
  mapsStaticUrl = 
    `${mapsStaticUrl}&center=${mapsCenter}&zoom=${mapsZoom}&size=${mapsImageSizes}&scale=${mapsScale}&format=${mapsImageFormat}&key=${mapsApiKey}`;
  imageMapsStatic.src = mapsStaticUrl;
  imageMapsStatic.width = mapsImageWidth;
  imageMapsStatic.height = mapsImageHeight;
  elementGoogleStaticMaps.appendChild(imageMapsStatic);
}

// Show the Google Maps when the static image is clicked.
const showGoogleMaps = () => {
  if (elementGoogleMaps.style.display === 'none') {
    elementGoogleMaps.style.display = 'block';
    elementGoogleStaticMaps.style.display = 'none';
  }
}
window.showGoogleMaps = showGoogleMaps;

// Ask permission for Push Notifications.
Notification.requestPermission((status) => {
  console.log('[DEBUG] Notification permission status:', status);
});

/**
 * Fetch a restaurant by its ID from network and fallback to IndexedDB,
 * update UI.
 */
const loadRestaurantNetworkFirst = (id) => {
  const endpointRestaurantById = `http://localhost:1337/restaurants/${id}`;
  DBHelper.getServerData(endpointRestaurantById)
  .then(dataFromNetwork => {
    self.restaurant = dataFromNetwork;
    if (self.restaurant.is_favorite === 'true') {
      is_favorite = true;
      toggleFavoriteButton.on = true;
    }
    updateRestaurantUI(id);
    createBreadcrumb();
    saveRestaurantsDataLocally(dataFromNetwork)
    .then(() => {
      DBHelper.setLastUpdated(new Date());
    }).catch(err => {
      console.warn(err);
    });
    createGoogleMaps();
  }).catch(err => {
    console.log('[DEBUG] Network requests have failed, this is expected if offline');
    getLocalRestaurantByIdData(id)
    .then(offlineData => {
      self.restaurant = offlineData;
      if (self.restaurant.is_favorite === 'true') {
        is_favorite = true;
        toggleFavoriteButton.on = true;
      }
      updateRestaurantUI(id);
      createBreadcrumb();
    }).catch(err => {
      console.warn(err);
    });
  });
}

/**
 * Fetch reviews from a restaurant by its ID from network and fallback to
 * IndexedDB, update UI.
 */
const loadReviewsNetworkFirst = (id) => {
  const endpointReviewsById =
    `http://localhost:1337/reviews/?restaurant_id=${id}`;
  DBHelper.getServerData(endpointReviewsById)
  .then(dataFromNetwork => {
    updateReviewsUI(dataFromNetwork);
    saveReviewsDataLocally(dataFromNetwork)
    .then(() => {
      DBHelper.setLastUpdated(new Date());
    }).catch(err => {
      console.warn(err);
    });
  }).catch(err => {
    console.log('[DEBUG] Network requests have failed, this is expected if offline');
    getLocalReviewsByIdData(id)
    .then(offlineData => {
      updateReviewsUI(offlineData);
    }).catch(err => {
      console.warn(err);
    });
  });
}

const createGoogleMaps = () => {
  let loc = {lat: 40.722216, lng: -73.987501};
  map = new google.maps.Map(elementGoogleMaps, {
    center: loc,
    zoom: 12
  });
  DBHelper.addMarkerForRestaurant(self.restaurant, map);
  let setTitle = () => {
    const iFrameGoogleMaps = document.querySelector('#google-maps iframe');
    iFrameGoogleMaps.setAttribute('title', 'Google Maps overview of restaurants');
  }
  map.addListener('tilesloaded', setTitle);
};


/**
 * Create restaurant details, update operating hours and the review cards.
 */
const updateRestaurantUI = (id) => {
  const picture = createResponsivePicture(self.restaurant);
  const parentElement = elementCardPrimary.parentNode;
  parentElement.insertBefore(picture, elementCardPrimary);

  elementRestaurantName.innerHTML = self.restaurant.name;
  elementRestaurantName.tabIndex = '0';

  elementRestaurantAddress.innerHTML = self.restaurant.address;

  elementRestaurantCuisine.innerHTML = self.restaurant.cuisine_type;

  if (self.restaurant.operating_hours) {
    updateRestaurantHoursUI();
  }

  // Add the restaurant id as url parameter.
  elementReviewLink.setAttribute('href', `review.html?id=${id}`);

  loadReviewsNetworkFirst(self.restaurant.id);
}

/**
 * Create table data with restaurant operating hours.
 */
const updateRestaurantHoursUI = () => {
  let operatingHours = self.restaurant.operating_hours;
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.className = 'restaurant-card-table-content';
    row.tabIndex = '0';

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    elementRestaurantHours.appendChild(row);
  }
}

/**
 * Create reviews cards.
 */
const updateReviewsUI = (reviews) => {
  const title = document.createElement('h3');
  title.className = 'reviews-title';
  title.innerHTML = 'Reviews';
  elementReviewsContainer.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    elementReviewsContainer.appendChild(noReviews);
    return;
  }

  reviews.forEach(review => {
    elementReviewsList.appendChild(createReviewHTML(review));
  });
  elementReviewsContainer.appendChild(elementReviewsList);
}

/**
 * Create a review card.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.className = 'review-card';

  const divCardPrimary = document.createElement('div');
  divCardPrimary.className = 'card-primary';
  const name = document.createElement('h2');
  name.className = 'card-title';
  name.innerHTML = review.name;
  divCardPrimary.appendChild(name);

  const date = document.createElement('h3');
  date.className = 'card-subtitle';
  const reviewDate = new Date(review.createdAt);
  date.innerHTML = reviewDate.toDateString();
  divCardPrimary.appendChild(date);
  li.appendChild(divCardPrimary);

  const divCardActions = document.createElement('div');
  divCardActions.className = 'review-card-rating';
  const rating = document.createElement('p');
  rating.className = 'review-card-rating-content';
  rating.innerHTML = `Rating: ${review.rating}`;
  divCardActions.append(rating);
  li.appendChild(divCardActions);

  const divCardSecondary = document.createElement('div');
  divCardSecondary.className = 'card-secondary';
  const comments = document.createElement('p');
  comments.className = 'card-secondary-content';
  comments.innerHTML = review.comments;
  divCardSecondary.appendChild(comments);
  li.appendChild(divCardSecondary);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu.
 */
const createBreadcrumb = (restaurant=self.restaurant) => {
  const li = document.createElement('li');
  li.className = 'breadcrumb';
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  elementBreadcrumb.appendChild(li);
}

/**
 * Get an URL parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
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

/**
 * Create a responsive image.
 *
 * Main page
 * 0 to 479px: card has width 100%, so 1 img 100% (455 x 321).
 * 480 to 599px: card has width 100%, so 1 img fullwidth (567 x 425).
 * 600 to 839px: card has width 45%, so 2 img 45% (378 x 283).
 * 840 to 959px: card has width 45%, so 2 img 45% (432 x 324).
 * 960 to 1279px: card has width 30%, so 3 img 30% (384 x 289).
 * 1280px to x: card has width 22.5%, so 4 img 22.5% (minimum 288 x 216).
 *
 * Restaurant Info
 * 0 to 479px: card has width 100%, so 1 img 100% (479 x 359).
 * 480 to 599px: card has width 100%, so 1 img fullwidth (599 x 449).
 * 600 to 839px: card has width 50%, so 1 img 50% (419.5 x 315).
 * 840 to 959px: card has width 50%, so 1 img 50% (479.5 x 360).
 * 960 to 1279px: card has width 50%, so 1 img 50% (639.5 x 480).
 * 1280px to x: card has width 50%, so 1 img 50% (minimum 640 x 480).
 *
 */
const createResponsivePicture = (restaurant) => {
  const picture = document.createElement('picture');

  const sizes = '(max-width: 37.4375rem) 100vw, (min-width: 37.5rem) 50vw, 100vw';

  const srcsetWebP =
    `${DBHelper.getImageUrlForRestaurant(restaurant, 'webp', 300)} 300w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'webp', 433)} 433w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'webp', 552)} 552w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'webp', 653)} 653w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'webp', 752)} 752w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'webp', 800)} 800w`;

  const srcsetJPEG =
    `${DBHelper.getImageUrlForRestaurant(restaurant, 'jpeg', 300)} 300w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'jpeg', 433)} 433w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'jpeg', 552)} 552w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'jpeg', 653)} 653w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'jpeg', 752)} 752w,
    ${DBHelper.getImageUrlForRestaurant(restaurant, 'jpeg', 800)} 800w`;

  const sourceWebP = document.createElement('source');
  sourceWebP.srcset = srcsetWebP;
  sourceWebP.sizes = sizes;
  sourceWebP.type = 'image/webp';
  picture.appendChild(sourceWebP);

  const sourceDefault = document.createElement('source');
  sourceDefault.srcset = srcsetJPEG;
  sourceDefault.sizes = sizes;
  sourceDefault.type = 'image/jpeg';
  picture.appendChild(sourceDefault);

  const defaultImg = document.createElement('img');
  const imageSrc = DBHelper.getImageUrlForRestaurant(restaurant, 'jpeg', 800);
  defaultImg.src = imageSrc;

  let altText = DBHelper.getAlternativeText(restaurant.id);
  if (!altText) {
    altText = `Restaurant ${restaurant.name}`;
  }
  defaultImg.alt = altText;
  defaultImg.tabIndex = '0';
  picture.appendChild(defaultImg);

  return picture;
}
