# How To Install This Extension

First, you need to make sure you have all required dependencies. Run `npm install`.
Do the following to uninstall any existing AB-Insightful Apps from your dev store. 

1. In your store's dashboard, navigate to Settings -> Apps and Sales Channels. You will see an entry for AB-Insightful. Click the three dots, select uninstall and confirm.

Next, install the app again.

1. Run `shopify app deploy`, and follow the prompts to confirm. If it tells you to override an existing app, do it, but let the team know you have done it.
2. Once the app successfully deploys, you can run `shopify app dev`.

# Web Pixel Extension

Web pixel app extensions provide developers with a simplified process for managing and processing behavioral data, by loading pixels in a secure sandbox environment with APIs for subscribing to customer events. Web pixel app extensions provide the following benefits to app users and developers:

- Eliminate or minimize the need for users to add tracking code
- Securely access all surfaces, like storefront, checkout and post-purchase pages
- Control what data the developers have access to
- Avoid performance and privacy alerts
- Provide a smaller pixel code library with the removal of excess DOM manipulation code

To learn more about web pixels, see Shopify’s [developer documentation](https://shopify.dev/docs/apps/marketing/pixels/getting-started).

## API

> The web pixel extension API gives you access to a select set of controlled APIs for accessing browser APIs and subscribing to customer events, within one of our Lax or Strict sandboxes.

This template project already provides a basic extension setup. For more information, see the [Web pixel extension API documentation](https://shopify.dev/docs/api/pixels/pixel-extension).

## Customer Events

> Customer events represent and describe the behavior of your customers, including key events during the customer journey, such as page views, product views, cart updates, searches, and purchases.

See all available events in the [Customer Events API documentation](https://shopify.dev/docs/api/pixels/customer-events).
