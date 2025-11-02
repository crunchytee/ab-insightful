import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { registerWebPixel } from "../services/extension.server";
// TODO in the /app/services, add a extension.server.js that will do this "register" part.
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  await registerWebPixel({ request });
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  // remove automatic top-level redirect (use buttons for navigation)
  const navigate = useNavigate();

  // Button list to navigate to different pages
  return (
    <s-page heading="Welcome to AB Insightful">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          maxWidth: 480,
          borderRadius: 6,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {[
          {
            id: "view-experiments",
            label: "View Experiments",
            to: "/app/experiments",
          },
          {
            id: "create-experiment",
            label: "Create New Experiment",
            to: "/app/experiments/new",
          },
          { id: "reports", label: "Reports", to: "/app/reports" },
          { id: "settings", label: "Settings", to: "/app/settings" },
          { id: "help", label: "Help", to: "/app/help" },
        ].map((item, idx, arr) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.to)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "none",
              borderBottom:
                idx < arr.length - 1 ? "1px solid rgba(0,0,0,0.08)" : "none",
              background: "transparent",
              textAlign: "left",
              cursor: "pointer",
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
