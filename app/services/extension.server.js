import { authenticate } from "../shopify.server";
export async function registerWebPixel({ request }) {
  const { admin } = await authenticate.admin(request);
  // [ryan] Code for automatically registering the Web-Pixel extension with the shop.

  const settings = {
    accountID: "123",
    appUrl: process.env.SHOPIFY_APP_URL,
  };

  const response = await admin.graphql(
    `#graphql
        mutation($settings: JSON!) {
        webPixelCreate(webPixel: { settings: $settings }) {
          userErrors {
            code
            field
            message
          }
          webPixel {
            settings
            id
          }
        }
      }
      `,
    {
      variables: {
        settings: settings,
      },
    },
  );
  // error check
  const responseAsJSON = await response.json();
  if (responseAsJSON.data?.webPixelCreate?.userErrors?.length > 0) {
    console.error(
      "An error occurred while trying to register the Web Pixel App Extension:",
      responseAsJSON.data.webPixelCreate.userErrors,
    );
    return new Response(
      JSON.stringify({
        message:
          "App pixel was unable to register. Please check Shopify Admin -> Settings -> Customer events. If ab-insightful is already registered, mark this item as complete. Otherwise, please try again.",
        action: "enableTracking",
      }),
      {
        status: 500,
      },
    );
  }
  return new Response(
    JSON.stringify({
      message:
        "App pixel registered successfully. You can mark this step as complete!",
      action: "enableTracking",
    }),
    { status: 200 },
  );
}
