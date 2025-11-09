import db from "../db.server";


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
