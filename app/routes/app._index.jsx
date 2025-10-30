import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

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

  // remove automatic top-level redirect (use buttons for navigation)
  const navigate = useNavigate();

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);

 // Button list to navigate to different pages
  return (
    <s-page heading="Welcome to AB Insightful">
     
      <div
        style={{display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 480, borderRadius: 6, background: '#fff', border: '1px solid rgba(0,0,0,0.04)'}}
      >
        {[
          { id: 'view-experiments', label: 'View Experiments', to: '/app/experiments' },
          { id: 'create-experiment', label: 'Create New Experiment', to: '/app/experiments/new' },
          { id: 'reports', label: 'Reports', to: '/app/reports' },
          { id: 'settings', label: 'Settings', to: '/app/settings' },
          { id: 'help', label: 'Help', to: '/app/help' },
        ].map((item, idx, arr) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.to)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderBottom: idx < arr.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};