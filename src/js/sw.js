importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.3.0/workbox-sw.js');

/**
 * Workbox 3.3.0
 * Workbox - https://developers.google.com/web/tools/workbox/
 * Codelab - https://codelabs.developers.google.com/codelabs/workbox-lab/
 *
 * Workbox creates a configuration file (in this case workbox-config.js) that
 * workbox-cli uses to generate service workers. The config file specifies where
 * to look for files (globDirectory), which files to precache (globPatterns),
 * and the file names for our source and production service workers (swSrc and
 * swDest, respectively). We can also modify this config file directly to change
 * what files are precached.
 * The importScripts call imports the workbox-sw.js library so the workbox
 * object gives our service worker access to all the Workbox modules.
 */

if (workbox) {
  console.log(`[DEBUG] Workbox is loaded.`);

  workbox.setConfig({ debug: false });

  workbox.core.setCacheNameDetails({
    prefix: 'pwa',
    suffix: 'v1'
  });
  workbox.precaching.precacheAndRoute([]);

  workbox.routing.registerRoute(
    new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
    workbox.strategies.cacheFirst({
      cacheName: 'pwa-cache-googleapis',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 30,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
        new workbox.cacheableResponse.Plugin({
          statuses: [0, 200]
        }),
      ],
    }),
  );

  workbox.routing.registerRoute(
    /\.(?:png|gif|jpg|jpeg|svg|webp)$/,
    workbox.strategies.cacheFirst({
      cacheName: 'pwa-cache-images',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    }),
  );

  workbox.routing.registerRoute(
    /\.(?:js|css)$/,
    workbox.strategies.staleWhileRevalidate({
      cacheName: 'pwa-cache-static-resources',
    }),
  );


  // Restaurants
  workbox.routing.registerRoute(
    new RegExp('restaurant.html(.*)'),
    workbox.strategies.networkFirst({
      cacheName: 'pwa-cache-restaurants',
      cacheableResponse: {statuses: [0, 200]}
    })
  );

  // Reviews
  workbox.routing.registerRoute(
    new RegExp('review.html(.*)'),
    workbox.strategies.cacheFirst({
      cacheName: 'pwa-cache-restaurants',
      cacheableResponse: {statuses: [0, 200]}
    })
  );

  // Notifications
  const showNotification = () => {
    self.registration.showNotification('Background Sync', {
      body: 'Success!'
    });
  };

  const bgSyncPlugin = new workbox.backgroundSync.Plugin(
    'pwa-reviews-queue',
    {
      maxRetentionTime: 24 * 60, 
    },
    {
      callbacks: {
        queueDidReplay: showNotification
      }
    }
  );

  const networkWithBackgroundSync = new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  });
  
  // POST review
  workbox.routing.registerRoute(
    new RegExp('http://localhost:1337/reviews/'),
    networkWithBackgroundSync,
    'POST'
  );

} else {
  console.log(`[DEBUG] Workbox didn't load.`);
}
