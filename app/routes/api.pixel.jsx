// Loader for handling OPTIONS requests
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {

    const origin = request.headers.get("Origin") ?? "";
    const request_method = request.headers.get("Access-Control-Request-Method") ?? "POST";
    const request_headers = request.headers.get("Access-Control-Request-Headers") ?? "";

    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin, // or specific domain
        "Access-Control-Allow-Methods": `${request_method}, OPTIONS`,
        "Access-Control-Allow-Headers":  request_headers ||"Content-Type",
        "Access-Control-Allow-Private-Network": "true"
      },
    });
  }
  return null;
};


export const action = async ({request}) => {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("Origin") ?? "";
    const request_method = request.headers.get("Access-Control-Request-Method") ?? "POST";
    const request_headers = request.headers.get("Access-Control-Request-Headers") ?? "";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": `${request_method}, OPTIONS`,
        "Access-Control-Allow-Headers": request_headers || "Content-Type",
        "Access-Control-Request-Private-Network": "true"
      },
    });
  }

  const origin = request.headers.get("Origin") ?? "";
  const content_type = request.headers.get("Content-Type") || "";


  if(!content_type.includes("application/json")){
    return new Response(
      JSON.stringify({error:"Expected application/json"}),
      {status:400, headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin
      }}
    );
  }
  const data = await request.json();
  console.log("[api.pixel/action] ",data);
  return new Response(
    JSON.stringify({success:true}),
    {
      status:200,
       headers: 
          {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin
          }
    }
  );

};