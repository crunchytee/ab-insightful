// the additional CORS headers are so it stops getting blocked. I loosely understand why they are needed. 
// TLDR, since we are develping on a local environment, and we are connecting to the app + test website through a tunnel, they are required. 
// we can add a Max-Age header sothey don't need to be resent as often. 
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
  else if(request.method === "GET"){

    const origin = request.headers.get("Origin") ?? "";
    const request_method = request.headers.get("Access-Control-Request-Method") ?? "POST";
    const request_headers = request.headers.get("Access-Control-Request-Headers") ?? "";
    const {getUserbyID} = await import("../services/cookie.server");
    let url = new URL(request.url);
    let customer_id = url.searchParams.get("customer_id")??"";
    if(customer_id == ""){
      return new Response(JSON.stringify({
        error: "must supply an id",
      }),
        {
          status: 400,
          headers: {
        "Access-Control-Allow-Origin": origin, // or specific domain
        "Access-Control-Allow-Methods": `${request_method}, OPTIONS`,
        "Access-Control-Allow-Headers":  request_headers ||"Content-Type",
        "Access-Control-Allow-Private-Network": "true"
      },
        }
      );
    }
    const user = await getUserbyID(customer_id);
    console.log("user from getUserbyID: ", user);
    console.log("type of user: ", typeof user);
    if(!user){
      console.log("could not find user! ", customer_id);
      return new Response(null,
        {
          status: 404,
          headers: {
        "Access-Control-Allow-Origin": origin, // or specific domain
        "Access-Control-Allow-Methods": `${request_method}, OPTIONS`,
        "Access-Control-Allow-Headers":  request_headers ||"Content-Type",
        "Access-Control-Allow-Private-Network": "true"
      },
        }
      );
    }

    console.log('found a user!', user);
    return new Response(JSON.stringify({
      ...user
    }), {
      status: 200,
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
  if (request.method === "OPTIONS") { // handles options preflight
    const origin = request.headers.get("Origin") ?? "";
    const request_method = request.headers.get("Access-Control-Request-Method") ?? "POST";
    const request_headers = request.headers.get("Access-Control-Request-Headers") ?? "";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": `${request_method}, OPTIONS`,
        "Access-Control-Allow-Headers": request_headers || "Content-Type",
        "Access-Control-Allow-Private-Network": "true"
      },
    });
  }
  else if(request.method === "POST"){
    const origin = request.headers.get("Origin") ?? "";
  const content_type = request.headers.get("Content-Type") || "";

  // make sure the Request specifies the body's type as json, otherwise parsing will fail
  if(!content_type.includes("application/json")){ // gaurd against non-json body
    return new Response(
      JSON.stringify({error:"Expected application/json"}),
      {status:400, headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin
      }}
    );
  }
  // parse and consume the request's body. For now, log it, but completion of story requires the server to implement adding this user. 
  console.log("Parsing and handling the cookie POST request");
  const data = await request.json();
  const customer_id = data.shopifyCustomerID;
  const device_type = data.deviceType;
  
  console.log("customer id: ", customer_id);
  console.log("device_type: ", device_type);
  // create a new record in the database
  const {createUser} = await import("../services/cookie.server");
  const user = await createUser(data);
  console.log(`POST @api/pixel\nuser:\n${user}`);
  if(user){
      return new Response(
    JSON.stringify(
      {
      ...user
      }
  ),
    {
      status:201,
       headers: 
          {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin
          }
    }
  );
  }
  else{
    return new Response(
      JSON.stringify(
        {
          error: "Could not create user." // i need to come up with a more descriptive error message
        }
      ),
      {
        status: 500,
        headers:
          {
           "Content-Type": "application/json",
           "Access-Control-Allow-Origin": origin 
          }
      }
    );
  }
  }else if(request.method === "PATCH"){
        const origin = request.headers.get("Origin") ?? "";
  const content_type = request.headers.get("Content-Type") || "";

  // make sure the Request specifies the body's type as json, otherwise parsing will fail
  if(!content_type.includes("application/json")){ // gaurd against non-json body
    return new Response(
      JSON.stringify({error:"Expected application/json"}),
      {status:400, headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin
      }}
    );
  }
  // parse and consume the request's body. For now, log it, but completion of story requires the server to implement adding this user. 
  console.log("Parsing and handling the cookie POST request");
  const data = await request.json();
  const customer_id = data.shopifyCustomerID;
  const latestSession = data.latestSession;
  if(!customer_id || !latestSession){ 
    return new Response(
      JSON.stringify(
        {
          error: "request was missing 'data' or 'customer id'"
        }
      ),
      {
        status: 400,
        headers:
          {
           "Content-Type": "application/json",
           "Access-Control-Allow-Origin": origin 
          }
      }
    );
  }
  const {updateLatestSession} = await import('../services/cookie.server');
  const updated_user = await updateLatestSession(data);
  if(!updated_user){
        return new Response(
      JSON.stringify(
        {
          error: "Could not update user." // i need to come up with a more descriptive error message
        }
      ),
      {
        status: 500,
        headers:
          {
           "Content-Type": "application/json",
           "Access-Control-Allow-Origin": origin 
          }
      }
    );
  }
  else{
    return new Response(
      JSON.stringify({
        ...updated_user
      }),
      {
        status: 200,
                headers:
          {
           "Content-Type": "application/json",
           "Access-Control-Allow-Origin": origin 
          }
      }
    );
  }
  }
  // TODO, seperate into GET and POST handlers. 
  // GET will serve as a query on a customer_id to see if the user has already been registered. 
  // POST will serve as an update to the database, registering a new user in the analytics chain.  
  
};


