import {register} from "@shopify/web-pixels-extension";
// [ryan] this seems like a really brittle and obtuse way of doing this.
// but the page_viewed event doesn't have an explicit field
// for the 'page associated resource' (blog, product, other?) 
// i can't seem to find an enumeration of possible resources, so I'm reverting 
// to an explicit enumeration of the possible resources. 

// limitations of my approach:
// does not give which blog post it is. merely, the URL is given. 
const associated_resources_search = { // enum for the list of resources to parse. 
  // add an entry here if you would like the url parser to be able to
  // identify another type of resource. 
  BLOG: "/blog",
  ARTICLE: "/article",
  PRODUCT:"/products",
  COLLECTION: "/collections",
  PAGE: "/pages",
  OTHER: "/other"
};
register(({ analytics, browser, init, settings }) => {
  analytics.subscribe('product_viewed', (event) => {
    let payload = {
      "client_id": event.clientId,
      "timestamp": event.timestamp,
      "product": event.data.productVariant,
      "url": event.context.document.location.href
    }
    console.log('[Pixel] product viewed ', payload)
  })
    console.log("Hello world from the Pixel extension")
    // determine what the "resource" at this page is. 
    // parse the location attribute, try to match it against the registered
    // resources in associated_resources_search 
    analytics.subscribe('page_viewed', (event) => {
      console.log(event)
      let resource = associated_resources_search.OTHER;
      for (const key in associated_resources_search){
        if(event.context.document.location.href.includes(associated_resources_search[key])){
          resource = associated_resources_search[key];
        }
      }
      // create the payload of attributes of the event we are interested. 
      let payload = {
        "client_id": event.clientId,
        "timestamp":event.timestamp,
        "page_url":event.context.document.location.href,
        "associated_resource": resource
      }
      console.log('[Pixel] Page viewed', payload);
    });
    
    analytics.subscribe('checkout_completed', (event) => {
      let payload = {
        "client_id": event.clientId,
        "timestamp": event.timestamp,
        "products": event.data.checkout.lineItems
      }
      console.log('[Pixel] Checkout Completed', payload);
    }); 
    analytics.subscribe('product_added_to_cart', (event) => {
      console.log('debug: product_added_to_cart: ', event)
      let payload = {
        "client_id": event.clientId,
        "timestamp": event.timestamp,
        "product": event.data.cartLine.merchandise, 
        "add_to_cart_source": event.context.document.referrer
      }
      console.log('[Pixel] Product Added to Cart', payload);
    });
    analytics.subscribe('checkout_started', (event) => {
      let payload = {
        "client_id": event.clientId,
        "timestamp": event.timestamp,
        "products": event.data.checkout.lineItems,

      }
      console.log('[Pixel] Checkout Started', payload);
    });

});
