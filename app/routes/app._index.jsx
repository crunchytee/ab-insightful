import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const {admin} = await authenticate.admin(request);
  // [ryan] Code for automatically registering the Web-Pixel extension with the shop. 
  // I'm not sure if this is the right place to do it, but my gut tells me it needs to happen on app load, 
  // and this is as early as I can imagine it needs to be. 
  
  // im kinda just following the pattern below me in the action() function. 
  // check for web-pixels that already exist on this store

  const exists = await admin.graphql(
    `#graphql
      query {
        shop { webPixels(first: 1) { edges { node { id settings } } } }
      }
  `
  );

  const existsAsJSON = await exists.json();
  const alreadyExists = existsAsJSON?.data?.shop?.webPixels?.edges?.length > 0;
  
  if (!alreadyExists){ // register if there are no other web-pixels. 
    const response = await admin.graphql(
      `#graphql
        mutation {
        webPixelCreate(webPixel: { settings: "{"accountID":"123"}" }) {
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
    const responseAsJSON = await response.json()
    // how do i check for errors? user errors won't be populated when it succeeds right? 
    if(responseAsJSON.data?.webPixelCreate?.userErrors?.length > 0){
      console.error('An error occurred while trying to register the Web Pixel App Extension:', responseAsJSON.data.webPixelCreate.userErrors)
    }
  }
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);

  return (
    <s-page heading="Welcome to AB Insightful">
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
