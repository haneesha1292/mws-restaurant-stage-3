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

  static messageOffline() {
    const lastUpdated = this.getLastUpdated();
    if (lastUpdated) {
     offlineMessage.textContent += ' Last fetched server data: ' + lastUpdated;
    }
    offlineMessage.style.display = 'block';
  }

  static messageNoData() {
    //
    noDataMessage.style.display = 'block';
  }

  static messageDataSaved() {
    const lastUpdated = this.getLastUpdated();
    if (lastUpdated) {dataSavedMessage.textContent += ' on ' + lastUpdated;}
    dataSavedMessage.style.display = 'block';
  }

  static messageSaveError() {
    saveErrorMessage.style.display = 'block';
  }

  // Util network function.
  static getLastUpdated() {
    return localStorage.getItem('lastUpdated');
  }

  // Util network function.
  static setLastUpdated(date) {
    localStorage.setItem('lastUpdated', date);
  }

  static logResult(result) {
    console.log(result);
  }

  static logError(error) {
    console.log('[ERROR] Looks like there was a problem: \n', error);
  }

  static validateResponse(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  static readResponseAsJSON(response) {
    return response.json();
  }

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

  
  static getRestaurantURL(restaurant) {
    return `restaurant.html?id=${restaurant.id}`
  }

  static getImageUrlForRestaurant(restaurant, imageType, width) {
    // Default image type is jpeg.
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
