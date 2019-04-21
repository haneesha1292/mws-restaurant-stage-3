import {MDCRipple} from '@material/ripple';
import {MDCTextField} from '@material/textfield';
import {MDCSelect} from '@material/select';

let restaurant;

const elementBreadcrumb = document.getElementById('breadcrumb');
const elementReviewForm = document.getElementById('review-form');
const elementRestaurantIdInput = document.getElementById('restaurant-id-input');
const elementRestaurantIdLabel = document.getElementById('restaurant-id-label');

const classRestaurantIdInput = 
  new MDCTextField(document.querySelector('.restaurant-id-input'));
const classNameInput = 
  new MDCTextField(document.querySelector('.name-input'));
const classRestaurantRatingSelect = 
  new MDCSelect(document.querySelector('.restaurant-rating-select'));
const classCommentsInput = 
  new MDCTextField(document.querySelector('.comments-input'));

new MDCRipple(document.querySelector('.cancel'));
new MDCRipple(document.querySelector('.next'));

document.addEventListener('DOMContentLoaded', (event) => {
  const id = getParameterByName('id');

  elementRestaurantIdInput.setAttribute('value', id);
  elementRestaurantIdLabel.classList.add('mdc-floating-label--float-above');

  getRestaurantInfoNetworkFirst(id);
});

const cancelReview = () => {
  window.location = `index.html`;
}
window.cancelReview = cancelReview;

elementReviewForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  let reviewFormData = new FormData(elementReviewForm);
  createReviewNetworkFirst(reviewFormData);
});

const getRestaurantInfoNetworkFirst = (id) => {
  const endpointRestaurantById = `http://localhost:1337/restaurants/${id}`;
  DBHelper.getServerData(endpointRestaurantById)
  .then(dataFromNetwork => {
    self.restaurant = dataFromNetwork;
    createBreadcrumb();
  }).catch(err => {
    console.log('[DEBUG] Network requests have failed, this is expected if offline');
    getLocalRestaurantByIdData(id)
    .then(offlineData => {
      self.restaurant = offlineData;
      createBreadcrumb();
    }).catch(err => {
      console.warn(err);
    });
  });
}

const createReviewNetworkFirst = (reviewFormData) => {
  const endpointPostReview =
    `http://localhost:1337/reviews/`;
  const data = {
    restaurant_id: parseInt(reviewFormData.get('restaurant_id')),
    name: reviewFormData.get('name'),
    rating: parseInt(reviewFormData.get('rating')),
    comments: reviewFormData.get('comments')
  };
  console.log(data);
  DBHelper.postRequest(endpointPostReview, data)
  .then(dataFromNetwork => {
    alert('Your review has been submitted successfully!');
    window.location = `restaurant.html?id=${elementRestaurantIdInput.value}`;
  }).catch(err => {
    console.log('[DEBUG] Network requests have failed, this is expected if offline');
    window.location = `restaurant.html?id=${elementRestaurantIdInput.value}`;
  });
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
