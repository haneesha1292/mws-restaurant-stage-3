// Create the IndexedDB database.
function createIndexedDB() {
  if (!('indexedDB' in window)) {
    console.log('[INFO] This browser doesn\'t support IndexedDB.');
    return null;
  }
  return idb.open('pwa-resto-db1', 3, function(upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
      case 1:
        if (!upgradeDb.objectStoreNames.contains('restaurants')) {
          console.log('[DEBUG] Creating a new object store for restaurants.');
          const restaurantsOS =
            upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
        }
      case 2:
        if (!upgradeDb.objectStoreNames.contains('reviews')) {
          console.log('[DEBUG] Creating a new object store for reviews.');
          const reviewsOS =
            upgradeDb.createObjectStore('reviews', {keyPath: 'id', autoIncrement: true});
          console.log(
            '[DEBUG] Creating a restaurant_id index on object store reviews');
          reviewsOS.createIndex(
            'restaurant_id', 'restaurant_id', {unique: false});
        }
    }
  });
}

// Database object.
const dbPromise = createIndexedDB();

function saveRestaurantsDataLocally(restaurants) {
  if (!('indexedDB' in window)) {return null;}
  return dbPromise.then(db => {
    const tx = db.transaction('restaurants', 'readwrite');
    const store = tx.objectStore('restaurants');
    if (restaurants.length > 1) {
      return Promise.all(restaurants.map(restaurant => store.put(restaurant)))
        .catch(() => {
          tx.abort();
          throw Error('[ERROR] Restaurants were not added to the store.');
        });
    } else {
      store.put(restaurants);
    }
  });
}

// Get restaurants data from object store restaurants.
function getLocalRestaurantsData() {
  if (!('indexedDB' in window)) {return null;}
  return dbPromise.then(db => {
    const tx = db.transaction('restaurants', 'readonly');
    const store = tx.objectStore('restaurants');
    return store.getAll();
  });
}

// Get restaurant by id data from object store restaurants.
function getLocalRestaurantByIdData(id) {
  if (!('indexedDB' in window)) {return null;}
  return dbPromise.then(db => {
    const tx = db.transaction('restaurants', 'readonly');
    const store = tx.objectStore('restaurants');
    return store.get(parseInt(id));
  });
}

function saveReviewsDataLocally(reviews) {
  if (!('indexedDB' in window)) {return null;}
  return dbPromise.then(db => {
    const tx = db.transaction('reviews', 'readwrite');
    const store = tx.objectStore('reviews');
    if (reviews.length > 1) {
      return Promise.all(reviews.map(review => store.put(review)))
        .catch(() => {
          tx.abort();
          throw Error('[ERROR] Reviews were not added to the store.');
        });
    } else {
      store.put(reviews);
    }
  });
}

// Get reviews by id data from object store reviews, using the index on
// restaurant_id
function getLocalReviewsByIdData(id) {
  if (!('indexedDB' in window)) {return null;}
  return dbPromise.then(db => {
    const tx = db.transaction('reviews', 'readonly');
    const store = tx.objectStore('reviews');
    const index = store.index('restaurant_id');
    return index.getAll(parseInt(id));
  });
}
