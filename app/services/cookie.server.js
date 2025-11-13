import db from "../db.server";

// TODO refactor so methods all follow the flow of updateLatestSession
export async function getUserbyID(customer_id) {
  console.log(
    "[cookie.server.js] looking up user with id: ",
    customer_id ?? "[ERROR] cookie.server::getUserbyID: userdata is undefined.",
  );
  if (customer_id) {
    const customer = await db.user.findUnique({
      where: {
        shopifyCustomerID: customer_id,
      },
    });
    console.log("found customer: ", customer);
    return customer;
  }
  console.log("did not find customer!");
  return null;
}

export async function createUser(userdata) {
  console.log(
    "[cookie.server.js] creating new user: ",
    userdata ?? "[ERROR] cookie.server::createUser: userdata is undefined.",
  );
  if (userdata) {
    const result = await db.user.create({
      data: {
        ...userdata,
      },
    });
    console.log("Created User: ", result);
    return result;
  }
  return null;
}
export async function updateLatestSession(userdata) {
  // should refactor to be a more generic "update user data" where this function is responsible for A) figuring out what has changed and B) sendign a PATCH to the database to update just those fields.
  if (!userdata) {
    console.log(
      "[cookieStore.server.js] [ERROR] cookieStore,server::updateLatestSession: userdata is undefined.",
    );
    return null;
  } else {
    console.log(
      `Updating User's latest session...\nUser ID: ${userdata.shopifyCustomerID}\n New Session Date: ${userdata.latestSession}`,
    );
    const result = await db.user.update({
      where: {
        shopifyCustomerID: userdata.shopifyCustomerID,
      },
      update: {
        latestSession: userdata.latestSession,
      },
    });
    return result;
  }
}
