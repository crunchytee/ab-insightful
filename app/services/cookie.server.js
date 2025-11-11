import db from "../db.server";

 // TODO refactor so methods all follow the flow of updateLatestSession
export async function getUserbyID(customer_id){
  console.log("[cookie.server.js] looking up user with id: ", customer_id ?? "[ERROR] cookie.server::getUserbyID: userdata is undefined.");
  if(customer_id){
    const customer = db.user.findUnique({
        where : {
            id: customer_id,
        },
    });
    return customer;
  }
  return null;
}

export async function createUser(userdata){
    console.log("[cookie.server.js] creating new user: ", userdata ?? "[ERROR] cookie.server::createUser: userdata is undefined.");
    if(userdata){
      const result = db.user.create({
        data: {
          ...userdata,
        }
      });
      console.log("Created User: ", result);
      return result;
    }
    return null;
}
export async function updateLatestSession(userdata){
  // should refactor to be a more generic "update user data" where this function is responsible for A) figuring out what has changed and B) sendign a PATCH to the database to update just those fields. 
  if(!userdata){
    console.log("[cookieStore.server.js] creating new user:",userdata ??" [ERROR] cookieStore,server::updateLatestSession: userdata is undefined.");
    return null;
  }else{
    const result = await db.user.update({
      where: {
        id: userdata.customer_id,
      },
      update: {
        latestSession: userdata.latestSession,
      }
    });
    return result;
  }
}

