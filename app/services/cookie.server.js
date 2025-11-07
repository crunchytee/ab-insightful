import {authenticate} from "../shopify.server";
import db from "../db.server";


export async function getCustomerByID({request}){
    const admin = await authenticate.admin(request);
    const user = await db.user.findUnqiue

}
