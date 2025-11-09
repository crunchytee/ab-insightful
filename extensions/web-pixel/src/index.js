import { register } from "@shopify/web-pixels-extension";
// [ryan] this seems like a really brittle and obtuse way of doing this.
// but the page_viewed event doesn't have an explicit field
// for the 'page associated resource' (blog, product, other?)
// i can't seem to find an enumeration of possible resources, so I'm reverting
// to an explicit enumeration of the possible resources.

// limitations of my approach:
// does not give which blog post it is. merely, the URL is given.
const associated_resources_search = {
  // enum for the list of resources to parse.
  // add an entry here if you would like the url parser to be able to
  // identify another type of resource.
  BLOG: "/blog",
  ARTICLE: "/article",
  PRODUCT: "/products",
  COLLECTION: "/collections",
  PAGE: "/pages",
  OTHER: "/other",
};

const IPAD= /(?=.*iPad)(?=.*Mac OS).*/gmi;
const   OTHER_TABLET= /(?=.*linux)(?=.*Android).*/gmi;
const   ANDROID_MOBILE= /(?=.*Linux)(?=.*Android).*|(?=.*Pixel).*|(?=.*SM-).*/gmi;
const   APPLE_DESKTOP= /(?=.*Macintosh)(?=.*Mac OS).*/gmi;
const   WINDOWS_DESKTOP= /(?=.*Windows)(?=.*Win64).*/gmi; 
const   LINUX_DESKTOP= /(?=.*Ubuntu)(?=.*Linux).*/gmi;

register(({ analytics, browser, init, settings }) => {
  // todo, add some sort of client side cache. It seems like on every page view, 
  // everything defined in here will fire. So we could potentially be hammering our APIs with requests. 
  // We don't want to send a new request when we already know the user is registered. 
  // Get shop from the current page URL or from pixel context
  
  // get device type. sniff the User-Agent String using the above regex patterns.  
  const user_agent_string = init.context.navigator.userAgent ?? "";
  console.log("user agent string: " ,user_agent_string);
  let device_type = "";
  if(IPAD.test(user_agent_string)){
    device_type = "ipad";
  }
  else if(OTHER_TABLET.test(user_agent_string)){
    device_type = "other_tablet";
  }
  else if(ANDROID_MOBILE.test(user_agent_string)){
    device_type = "android_mobile";
  }
  else if(APPLE_DESKTOP.test(user_agent_string)){
    device_type = "apple_desktop";
  }
  else if(WINDOWS_DESKTOP.test(user_agent_string)){
    device_type = "windows_desktop";
  }
  else if(LINUX_DESKTOP.test(user_agent_string)){
    device_type = "linux_desktop";
  }
  else{
    device_type = "UNRECOGNIZED_DEVICE_TYPE";
  }
  console.log("device typeL ", device_type);
  const appUrl = settings.appUrl;
  
  const collectUrl = `${appUrl}/api/collect`;
  const cookieURL= `${appUrl}/api/pixel`;
  
  // check if our user has a cookie
  browser.cookie.get("user_id_exptable")
  .then(cookie => {
    if(cookie == ""){ // the cookie doesn't exist. We need to register this user
      let customer_id = init?.data?.customer?.id ?? "invalid id"; // get the customer's ID. 
      if (customer_id == "invalid id"){
        console.log("This customer doesn't have an ID. We can't use this to create the cookie. Don't send the request");
      }
      else{
        // first, check with the server to see if the user already exists within the database
        console.log("[cookie.server.js] About to send GET request for user: ", customer_id);
        return fetch(cookieURL + new URLSearchParams({customer_id: customer_id,}).toString(),{
          method: "GET",
        })
        .then(response => {
            if(response.status == 200){ // the user does exist in the database. The server will send information for creating the cookie, and then the pixel will update the "last seen" field in the database.
              // response should have a body:
              /*
                body: {
                  customer_id:customer_id,
                  device_type: device_type,
                  last_seen: <DateTime>,
                  lastest_session: <DateTime>

                }
                // we should create a cookie with custoemr_id, and then send a PATCH request to update the record with new last_seen and latest_session
              */
              return response.json()
              .then(data => {
                browser.cookie.set(`user_id_exptable=${data.customer_id}; expires=Mon, 10 Nov 2025 12:00:00 UTC;`);
                // TODO replace with sending a patch request
              })
              .catch(error => {
                console.log("an error occurred: ", error);
              });
            }        
            else if(response.status == 404){ // the user does not exist in the database, we can consider this to be a new user. Send the post request, and create the cookie
              console.log("About to send the post request for the cookie.");
              return fetch(cookieURL, {
                method:"POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  "customer_id":customer_id,
                  "device_type": device_type,
                }),
                }
              );         
            }
            else{ // an error occurred, likely a 500. 
              console.log("an error occurred");
              // TODO replace with proper error handling
            }
        })
        .catch(error => {
          console.log("An error occurred", error);
        });

      }
    }else { // send a PATCH to update the LAST_SEEN
      
    }
  })
  .then(res => {
    return res.json();
  })
  .then(data => {
    console.log("Cookie post request response: ", data);
    
    

  })
  .catch(err => {
    console.log("an error occurred", err);
  });

  


  
  // Micro-function for sending events to server
  function sendData(payload) {
    fetch(collectUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Indicate that the body is JSON
      },
      body: JSON.stringify(payload),
    });
  }

  analytics.subscribe("product_viewed", (event) => {
    let payload = {
      event_type: "product_viewed",
      client_id: event.clientId,
      timestamp: event.timestamp,
      product: event.data.productVariant,
      url: event.context.document.location.href,
    };
    sendData(payload);
  });

  // determine what the "resource" at this page is.
  // parse the location attribute, try to match it against the registered
  // resources in associated_resources_search
  analytics.subscribe("page_viewed", (event) => {
    let resource = associated_resources_search.OTHER;
    for (const key in associated_resources_search) {
      if (
        event.context.document.location.href.includes(
          associated_resources_search[key],
        )
      ) {
        resource = associated_resources_search[key];
      }
    }
    // create the payload of attributes of the event we are interested.
    let payload = {
      event_type: "page_viewed",
      client_id: event.clientId,
      timestamp: event.timestamp,
      page_url: event.context.document.location.href,
      associated_resource: resource,
    };
    sendData(payload);
  });

  analytics.subscribe("checkout_completed", (event) => {
    let payload = {
      event_type: "checkout_completed",
      client_id: event.clientId,
      timestamp: event.timestamp,
      products: event.data.checkout.lineItems,
    };
    sendData(payload);
  });

  analytics.subscribe("product_added_to_cart", (event) => {
    let payload = {
      event_type: "product_added_to_cart",
      client_id: event.clientId,
      timestamp: event.timestamp,
      product: event.data.cartLine.merchandise,
      add_to_cart_source: event.context.document.referrer,
    };
    sendData(payload);
  });

  analytics.subscribe("checkout_started", (event) => {
    let payload = {
      event_type: "checkout_started",
      client_id: event.clientId,
      timestamp: event.timestamp,
      products: event.data.checkout.lineItems,
    };
    sendData(payload);
  });
});
