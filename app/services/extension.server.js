import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function registerWebPixel({ request }) {
  const { admin, session } = await authenticate.admin(request);

  // First check to see if the web pixel is already registered
  const webPixelId = await getWebPixelId(session);

  // Create and store webPixel if not created already
  if (!webPixelId) {
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

    // Get and store ID
    const newWebPixelId = responseAsJSON.data?.webPixelCreate?.webPixel?.id;
    await db.session.update({
      where: {
        id: session.id,
      },
      data: {
        webPixelId: newWebPixelId,
      },
    });
    console.log(`Created and stored web pixel with ID: ${newWebPixelId}`);
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

export async function updateWebPixel({ request }) {
  const { admin, session } = await authenticate.admin(request);

  // First check to see if the web pixel is already registered
  const webPixelId = await getWebPixelId(session);

  // If no web pixel, register one and get ID
  if (!webPixelId) {
    registerWebPixel({ request });

    webPixelId = await getWebPixelId(session);
  }

  // Next, update the web pixel on Shopify API
  const settings = {
    accountID: "123",
    appUrl: process.env.SHOPIFY_APP_URL,
  };

  const response = await admin.graphql(
    `#graphql
        mutation($id: ID!, $settings: JSON!) {
        webPixelUpdate(id: $id, webPixel: { settings: $settings }) {
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
        id: webPixelId,
      },
    },
  );

  // error check
  const responseAsJSON = await response.json();
  if (responseAsJSON.data?.webPixelCreate?.userErrors?.length > 0) {
    console.error(
      "An error occurred while trying to update the Web Pixel App Extension:",
      responseAsJSON.data.webPixelCreate.userErrors,
    );
    return new Response(
      JSON.stringify({
        message: "App pixel was unable to update.",
        action: "updateWebPixel",
      }),
      {
        status: 500,
      },
    );
  }
  const newWebPixelSettings =
    responseAsJSON.data?.webPixelUpdate?.webPixel?.settings;
  console.log(`Web pixel updated. New settings: ${newWebPixelSettings}`);
  return new Response(
    JSON.stringify({
      message: "App pixel updated successfully.",
      action: "updateWebPixel",
    }),
    { status: 200 },
  );
}

async function getWebPixelId(session) {
  const currentSession = await db.session.findUnique({
    where: {
      id: session.id,
    },
  });
  const webPixelId = currentSession?.webPixelId;
  if (webPixelId) {
    return webPixelId;
  } else {
    return null;
  }
}
