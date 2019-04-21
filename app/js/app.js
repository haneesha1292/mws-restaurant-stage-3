let map;
let neighborhoods;
let cuisines;
let restaurants;
let markers = [];
const endpointRestaurants = `http://localhost:1337/restaurants`;

const elementMapsContainer = document.getElementById('maps-container');
const elementGoogleMaps = document.getElementById('google-maps');
const elementGoogleStaticMaps = document.getElementById('google-static-maps');
const elementNeighborhoodsSelect = document.getElementById('neighborhoods-select');
const elementCuisinesSelect = document.getElementById('cuisines-select');
const elementRestaurantsList = document.getElementById('restaurants-list');

/**
 * Start the following when the initial HTML document has been
 * completely loaded and parsed, without waiting for stylesheets, images,
 * and subframes to finish loading.
 * Fetch neighborhoods and cuisines.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  createMapsStatic();
  loadMainNetworkFirst();
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

const showGoogleMaps = () => {
  if (elementGoogleMaps.style.display === 'none') {
    elementGoogleMaps.style.display = 'block';
    elementGoogleStaticMaps.style.display = 'none';
  }
}

/**
 * Fetch all neighborhoods and cuisines from network and fallback to IndexedDB,
 * update UI.
 */
const loadMainNetworkFirst = () => {
  DBHelper.getServerData(endpointRestaurants)
  .then(dataFromNetwork => {
    updateNeighborhoodsUI(dataFromNetwork);
    updateCuisinesUI(dataFromNetwork);
    saveRestaurantsDataLocally(dataFromNetwork)
    .then(() => {
      DBHelper.setLastUpdated(new Date());
    }).catch(err => {
      console.warn(err);
    });
  }).catch(err => {
    console.log('[DEBUG] Network requests have failed, this is expected if offline');
    getLocalRestaurantsData()
    .then(offlineData => {
      if (!offlineData.length) {
      } else {
        updateNeighborhoodsUI(offlineData);
        updateCuisinesUI(offlineData);
        refreshRestaurantsNetworkFirst();
      }
    });
  });
}

/**
 * Update UI of Neighborhoods select element.
 */
const updateNeighborhoodsUI = (result) => {
  let allNeighborhoods = result.map((v, i) => result[i].neighborhood);
  self.neighborhoods = allNeighborhoods.filter((v, i) => allNeighborhoods.indexOf(v) == i);
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    elementNeighborhoodsSelect.appendChild(option);
  });
}

/**
 * Update UI of Cuisines select element.
 */
const updateCuisinesUI = (result) => {
  let allCuisines = result.map((v, i) => result[i].cuisine_type);
  self.cuisines = allCuisines.filter((v, i) => allCuisines.indexOf(v) == i);
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    elementCuisinesSelect.appendChild(option);
  });
}

/**
 * Fetch all restaurants from network and fallback to IndexedDB, update UI.
 */
const refreshRestaurantsNetworkFirst = () => {
  DBHelper.getServerData(endpointRestaurants)
  .then(dataFromNetwork => {
    refreshRestaurantsUI(false, dataFromNetwork);
    saveRestaurantsDataLocally(dataFromNetwork)
    .then(() => {
      DBHelper.setLastUpdated(new Date());
    }).catch(err => {
      console.warn(err);
    });
  }).catch(err => {
    console.log('[DEBUG] Network requests have failed, this is expected if offline');
    getLocalRestaurantsData()
    .then(offlineData => {
      if (!offlineData.length) {
      } else {
        refreshRestaurantsUI(true, offlineData);
      }
    });
  });
}

/**
 * Update ul restaurants-list and markers on map for current restaurants.
 */
const refreshRestaurantsUI = (offline, result) => {
  const neighborhoodIndex = elementNeighborhoodsSelect.selectedIndex;
  const cuisineIndex = elementCuisinesSelect.selectedIndex;
  const neighborhood = elementNeighborhoodsSelect[neighborhoodIndex].value;
  const cuisine = elementCuisinesSelect[cuisineIndex].value;

  self.restaurants = [];
  elementRestaurantsList.innerHTML = '';
  markers.forEach(m => m.setMap(null));
  markers = [];

  self.restaurants = result;
  if (neighborhood != 'all') {
    self.restaurants = self.restaurants.filter(r => r.neighborhood == neighborhood);
  }
  if (cuisine != 'all') {
    self.restaurants = self.restaurants.filter(r => r.cuisine_type == cuisine);
  }

  self.restaurants.forEach(restaurant => {
    elementRestaurantsList.appendChild(addRestaurantCardUI(restaurant));
  });
  if (!offline) {
    addMarkersToMapUI();
  }
}

/**
 * Create a restaurant card in a li element.
 */
const addRestaurantCardUI = (restaurant) => {
  const li = document.createElement('li');
  li.className = 'restaurant-card';

  li.appendChild(createResponsivePicture(restaurant));

  const divCardPrimary = document.createElement('div');
  divCardPrimary.className = 'card-primary';
  const name = document.createElement('h2');
  name.className = 'card-title';
  name.innerHTML = restaurant.name;
  divCardPrimary.appendChild(name);
  const neighborhood = document.createElement('h3');
  neighborhood.className = 'card-subtitle';
  neighborhood.innerHTML = restaurant.neighborhood;
  divCardPrimary.appendChild(neighborhood);
  li.appendChild(divCardPrimary);

  const divCardSecondary = document.createElement('div');
  divCardSecondary.className = 'card-secondary';
  const address = document.createElement('address');
  address.className = 'card-secondary-content';
  address.innerHTML = restaurant.address;
  divCardSecondary.appendChild(address);
  li.appendChild(divCardSecondary);

  const divCardActions = document.createElement('div');
  divCardActions.className = 'card-actions';
  const more = document.createElement('a');
  more.className = 'card-actions-link';
  more.innerHTML = 'View Details';
  more.href = DBHelper.getRestaurantURL(restaurant);
  divCardActions.appendChild(more);
  li.appendChild(divCardActions);

  return li;
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

  const sizes = '(min-width: 80rem) 22.5vw, (min-width: 60rem) 30vw, (min-width: 37.5rem) 45vw, 100vw';

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
  picture.appendChild(defaultImg);

  return picture;
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {lat: 40.722216, lng: -73.987501};
  map = new google.maps.Map(elementGoogleMaps, {
    center: loc,
    zoom: 12
  });
  let setTitle = () => {
    const iFrameGoogleMaps = document.querySelector('#google-maps iframe');
    iFrameGoogleMaps.setAttribute('title', 'Google Maps overview of restaurants');
  }
  map.addListener('tilesloaded', setTitle);
  refreshRestaurantsNetworkFirst();
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMapUI = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    const marker = DBHelper.addMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    markers.push(marker);
  });
}
