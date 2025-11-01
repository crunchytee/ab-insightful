import { authenticate } from "../shopify.server";
export async function registerWebPixel({request}){
    const {admin} = await authenticate.admin(request);
      // [ryan] Code for automatically registering the Web-Pixel extension with the shop. 

    const response = await admin.graphql( 
      `#graphql
        mutation {
        webPixelCreate(webPixel: { settings: "{\\"accountID\\":\\"123\\"}" }) {
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
  `
    );
// error check
    const responseAsJSON = await response.json()
    if(responseAsJSON.data?.webPixelCreate?.userErrors?.length > 0){
      console.error('An error occurred while trying to register the Web Pixel App Extension:', responseAsJSON.data.webPixelCreate.userErrors)
    }
    return null
}