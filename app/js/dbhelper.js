const offlineMessage = document.getElementById('offline');
const noDataMessage = document.getElementById('no-data');
const dataSavedMessage = document.getElementById('data-saved');
const saveErrorMessage = document.getElementById('save-error');


/**
 * DBHelper provides functions to interact with the local development API server
 * provided by Udacity for project 2.
 */

class DBHelper {

  /**
   * Alternative Text as the API server doesn't provide it.
   */
  static getAlternativeText(id) {
    const altTexts = {
      1: "Interior of Mission Chinese Food",
      2: "Pizza Quattro Formaggi",
      3: "Interior of Kang Ho Dong Baekjeong",
      4: "Outside view of Katz's Delicatessen at night",
      5: "Open kitchen of Roberta's Pizza",
      6: "People queueing at Hometown BBQ",
      7: "Outside view of Superiority Burger",
      8: "Outside view of The Dutch",
      9: "People eating at Mu Ramen",
      10: "Interior of Casa Enrique"
    };
    return altTexts[id];
  }

  // Alert user that data may not be current
  // "You're offline and viewing stored data."
  static messageOffline() {
    const lastUpdated = this.getLastUpdated();
    if (lastUpdated) {
     offlineMessage.textContent += ' Last fetched server data: ' + lastUpdated;
    }
    offlineMessage.style.display = 'block';
  }

  // Alert user that there is no data available.
  // "You're offline and local data is unavailable."
  static messageNoData() {
    //
    noDataMessage.style.display = 'block';
  }

  // Alert user that data has been saved for offline.
  // "Server data was saved for offline mode.""
  static messageDataSaved() {
    const lastUpdated = this.getLastUpdated();
    if (lastUpdated) {dataSavedMessage.textContent += ' on ' + lastUpdated;}
    dataSavedMessage.style.display = 'block';
  }

  // Alert user that data couldn't be saved offline
  // "Server data couldn't be saved offline.""
  static messageSaveError() {
    saveErrorMessage.style.display = 'block';
  }

  static getLastUpdated() {
    return localStorage.getItem('lastUpdated');
  }

  static setLastUpdated(date) {
    localStorage.setItem('lastUpdated', date);
  }

  /*
   * logResult is available for debugging puprposes, it does some logging
   * of the JSON data.
   */
  static logResult(result) {
    console.log(result);
  }

  /*
   * The fetch call returns a promise that resolves to a response object.
   * If the request does not complete, .catch takes over and is passed the
   * corresponding error.
   */
  static logError(error) {
    console.log('[ERROR] Looks like there was a problem: \n', error);
  }

  /*
   * validateResponse checks if the response is valid (is it a 200-299?).
   */
  static validateResponse(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  /*
   * readResponseAsJSON reads the body of the response using the Response.json()
   * method.
   */
  static readResponseAsJSON(response) {
    return response.json();
  }

  /*
   * readResponseAsText reads the body of the response using the Response.text()
   * method.
   */
  static readResponseAsText(response) {
    return response.text();
  }

  /**
   * Get the database URL.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}`;
  }

  /**
   * getServerData
   */
  static getServerData(pathToResource) {
    return fetch(pathToResource)
      .then(this.validateResponse)
      .then(this.readResponseAsJSON)
  }

  /**
   * postRequest
   */
  static postRequest(pathToAPI, data) {
    const headers = new Headers({'Content-Type': 'application/json'});
    const body = JSON.stringify(data);
    return fetch(pathToAPI, {
      method: 'POST',
      headers: headers,
      body: body
    })
    .then(this.validateResponse)
    .then(this.readResponseAsText)
  }

  /**
   * Returns the relative url for a restaurant.
   */
  static getRestaurantURL(restaurant) {
    return `restaurant.html?id=${restaurant.id}`
  }

  /**
   * Returns the restaurant image URL.
   */
  static getImageUrlForRestaurant(restaurant, imageType, width) {
    let fileExtension = 'jpg';
    switch (imageType) {
      case 'jpeg':
        break;
      case 'webp':
        fileExtension = 'webp';
        break;
      default:
        console.log(`[DEBUG] unhandled imageType: ${imageType}`);
    }
    if (typeof width !== 'undefined') {
      return `img/${restaurant.id}_w_${width}.${fileExtension}`;
    } else {
      return `img/${restaurant.id}_w_800.${fileExtension}`;
    }
  }

  /**
   * Add a Google Maps marker for a restaurant.
   */
  static addMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.getRestaurantURL(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
