import {register} from "@shopify/web-pixels-extension";

register(({ analytics, browser, init, settings }) => {
    // Bootstrap and insert pixel script tag here

    // Sample subscribe to page view
    console.log("Hello world from the Pixel extension")

    analytics.subscribe('page_viewed', (event) => {
      console.log('[Pixel] Page viewed', event);
    });
    analytics.subscribe('checkout_completed', (event) => {
      console.log('[Pixel] Checkout Completed', event);
    });
    analytics.subscribe('product_added_to_cart', (event) => {
      console.log('[Pixel] Product Added to Cart', event);
    });
    analytics.subscribe('checkout_started', (event) => {
      console.log('[Pixel] Checkout Started', event);
    });

});
