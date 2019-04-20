let map;
let restaurant;

const elementBreadcrumb = document.getElementById('breadcrumb');
const elementCardPrimary = document.getElementById('card-primary');
const elementRestaurantName = document.getElementById('restaurant-name');
const elementRestaurantAddress = document.getElementById('restaurant-address');
const elementRestaurantCuisine = document.getElementById('restaurant-cuisine');
const elementRestaurantHours = document.getElementById('restaurant-hours');
const elementGoogleMap = document.getElementById('map');
const elementReviewsContainer = document.getElementById('reviews-container');
const elementReviewsList = document.getElementById('reviews-list');

window.initMap = () => {
  const id = getParameterByName('id');
  loadRestaurantNetworkFirst(id);
}

const loadRestaurantNetworkFirst = (id) => {
  const endpointRestaurantById = `http://localhost:1337/restaurants/${id}`;
  DBHelper.getServerData(endpointRestaurantById)
  .then(dataFromNetwork => {
    self.restaurant = dataFromNetwork;
    updateRestaurantUI();
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
      updateRestaurantUI();
      createBreadcrumb();
      createGoogleMaps();
    }).catch(err => {
      console.warn(err);
    });
  });
}

const createGoogleMaps = () => {
  let loc = {lat: 40.722216, lng: -73.987501};
  map = new google.maps.Map(elementGoogleMap, {
    center: loc,
    zoom: 12
  });
  DBHelper.addMarkerForRestaurant(self.restaurant, self.map);
  let setTitle = () => {
    const iFrameGoogleMaps = document.querySelector('#map iframe');
    iFrameGoogleMaps.setAttribute('title', 'Google Maps overview of restaurants');
  }
  map.addListener('tilesloaded', setTitle);
};

const updateRestaurantUI = () => {
  const picture = createResponsivePicture(self.restaurant);
  const parentElement = elementCardPrimary.parentNode;
  parentElement.insertBefore(picture, elementCardPrimary);

  elementRestaurantName.innerHTML = self.restaurant.name;
  elementRestaurantName.tabIndex = '0';

  elementRestaurantAddress.innerHTML = self.restaurant.address;

  elementRestaurantCuisine.innerHTML = self.restaurant.cuisine_type;

  if (restaurant.operating_hours) {
    updateRestaurantHoursUI();
  }
  updateReviewsUI();
}

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

const updateReviewsUI = (reviews = self.restaurant.reviews) => {
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
  date.innerHTML = review.date;
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

const createBreadcrumb = (restaurant=self.restaurant) => {
  const li = document.createElement('li');
  li.className = 'breadcrumb';
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  elementBreadcrumb.appendChild(li);
}

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
