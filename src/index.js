import pkg from "../package.json";
import cors from "cors";
import bodyParser from "body-parser";
import SimpleSchema from "simpl-schema";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
const mySchema = importAsString("./schema.graphql");
import getOrdersByUserId from "./utils/getOrders.js";
import getVariantsByUserId from "./utils/getVariants.js";
import getUserByUserId from "./utils/getUser.js";
import updateUserAccountBook from "./utils/updateUserAccountBook.js";
import updateUserFulfillmentMethod from "./utils/updateUserFulfillmentMethod.js";

import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
var _context = null;
const resolvers = {
  Account: {
    async Product(parent, args, context, info) {
      let productVariant = await getVariantsByUserId(
        context,
        parent.userId,
        true,
        args
      );
      return productVariant;
    },
    async identityVerified(parent, args, context, info) {
      //  let productVariant=await getVariantsByUserId(context, parent.userId, true, args);
      return parent.profile.identityVerified
        ? parent.profile.identityVerified
        : false;
    },
    async AccountBook(parent, args, context, info) {
      return parent.profile.accountBook ? parent.profile.accountBook : [];
    },

    async orderFulfillment(parent, args, context, info) {
      let userOrders = await getOrdersByUserId(
        context,
        parent.userId,
        true,
        args
      );
      return userOrders;
    },
    AvailableFulfillmentMethods(parent, args, context, info){
      let reaction_response=parent.fulfillmentMethods&&parent.fulfillmentMethods.length>0?parent.fulfillmentMethods.map(id=>{ return encodeOpaqueIdFunction("reaction/fulfillmentMethod",id)}):[]
      return reaction_response;
    }
  },
  Product: {
    async ancestorId(parent, args, context, info) {
      return parent.ancestors[0];
    },
    async parentId(parent, args, context, info) {
      return encodeOpaqueId("reaction/product", parent.ancestors[0]);
      //encode( encodeOpaqueId(parent.ancestors[0]))
    },
  },
  CatalogProduct: {
    async uploadedBy(parent, args, context, info) {
      // console.log("uploadedBy parent", parent);
      console.log("uploadedBy userId", parent.uploadedBy.userId);
      if (parent.uploadedBy.userId) {
        let userInfo = await getUserByUserId(context, parent.uploadedBy.userId);
        let FulfillmentMethods=userInfo.fulfillmentMethods&&userInfo.fulfillmentMethods.length>0?userInfo.fulfillmentMethods.map(id=>{ return encodeOpaqueIdFunction("reaction/fulfillmentMethod",id)}):[];

        return {
          name: userInfo.profile.username,
          userId: userInfo.userId,
          Image: userInfo.profile.picture,
          FulfillmentMethods:FulfillmentMethods
        };
      }
    },
  },
  Query: {},
  Mutation: {
    async updateAccountpayBookEntry(parent, args, context, info) {
      let updateResponse = await updateUserAccountBook(context, args.input);
      return updateResponse;
    },
    async updateAvailableFulfillmentMethodEntry(parent, args, context, info) {
      let updateResponse = await updateUserFulfillmentMethod(context, args.input);
      let reaction_response=updateResponse.length>0?updateResponse.map(id=>{ return encodeOpaqueIdFunction("reaction/fulfillmentMethod",id)}):[]
      return reaction_response;
    },
    async deleteAccount(parent, args, context, info) {
      try {
        let { userId } = args;
        let {  Products, Accounts, users, Bids, Catalog } = context.collections;
        console.log("userId", userId)
        let deletedBids = await Bids.remove({$or: [ { soldBy:  userId }, { createdBy: userId } ]});
        let deletedCatalog = await Catalog.remove({ "product.uploadedBy.userId": userId });
        let deletedProducts = await Products.remove({ "uploadedBy.userId": userId });
        let deletedUser = await users.remove({ _id: userId });
        let deletedAccount = await Accounts.remove({ userId })
        console.log("deletedBids", deletedBids, deletedCatalog, deletedProducts, deletedUser, deletedAccount);
        if( deletedUser?.deletedCount > 0 || deletedAccount?.deletedCount > 0 )
          return {
            success: true,
            message: "deleted successfully.",
            status: 200
          }
        else
          return {
            success: false,
            message: "please refresh again!",
            status: 200
          } 
      } catch(err){
        console.log("error", err)
        return {
          success: false,
          message: "Server Error.",
          status: 500
        }
      }
    },
    async updateUserPassword(parent, args, context, info) {
      try {
        let { email, password } = args.input;
        let { users } = context.collections;
        console.log("email, password", email, password);
        let updatedPassword = await users.updateOne(
          { "emails.address": email },
          { $set: { "services.password.bcrypt": password } }
        );
        console.log("updatedPassword", updatedPassword);
        if( updatedPassword?.result?.nModified > 0 )
          return {
            success: true,
            message: "updated successfully.",
            status: 200
          }
        else
          return {
            success: false,
            message: "please refresh again!",
            status: 200
          } 
      } catch(err){
        console.log("error", err)
        return {
          success: false,
          message: "Server Error.",
          status: 500
        }
      }
    }
  },
};
function encodeOpaqueIdFunction(source,id){
  return encodeOpaqueId(source, id)
}
function myStartup1(context) {
  _context = context;
  const { app, collections, rootUrl } = context;
  const OwnerInfo = new SimpleSchema({
    userId: {
      type: String,
      max: 30,
      optional: true,
    },
    image: {
      type: String,
      max: 20,
      optional: true,
    },
    name: {
      type: String,
      optional: true,
    },
  });

  context.simpleSchemas.Product.extend({
    uploadedBy: OwnerInfo,
    ancestorId: {
      type: String,
      optional: true,
    },
    parentId: {
      type: String,
      optional: true,
    },
    upVotes: {
      type: Number
    }
  });
  context.simpleSchemas.CatalogProduct.extend({
    uploadedBy: OwnerInfo,
    ancestorId: {
      type: String,
      optional: true,
    },
    parentId: {
      type: String,
      optional: true,
    },
    upVotes: {
      type: Number
    }
  });
    app.expressApp.use(cors());
    app.expressApp.use(bodyParser.json());
    app.expressApp.use(bodyParser.urlencoded({ extended: true }));
    app.expressApp.post("/permission", async (req, res) => {
      try{
        let _id = req.body.userId;
        let seller = {
          "_id" : "y4PTFE8LEFbsnEjkP",
          "name" : "seller",
          "slug" : "seller",
          "createdAt" : "2022-07-18T08:33:50.835Z",
          "createdBy" : null,
          "shopId" : "",
          "updatedAt" : "2022-07-18T08:33:51.852Z",
          "permissions" : [
            "reaction:legacy:accounts/add:address-books",
            "reaction:legacy:accounts/read",
            "reaction:legacy:accounts/remove:address-books",
            "reaction:legacy:accounts/update:address-books",
            "reaction:legacy:accounts/update:currency",
            "reaction:legacy:accounts/update:emails",
            "reaction:legacy:accounts/update:language",
            "reaction:legacy:carts:/update",
            "reaction:legacy:fulfillment/read",
            "reaction:legacy:inventory/read",
            "reaction:legacy:inventory/update:settings",
            "reaction:legacy:inventory/update",
            "reaction:legacy:media/update",
            "reaction:legacy:orders/approve:payment",
            "reaction:legacy:orders/cancel:item",
            "reaction:legacy:orders/capture:payment",
            "reaction:legacy:orders/move:item",
            "reaction:legacy:orders/read",
            "reaction:legacy:orders/refund:payment",
            "reaction:legacy:orders/update",
            "reaction:legacy:products/archive",
            "reaction:legacy:products/clone",
            "reaction:legacy:products/create",
            "reaction:legacy:products/publish",
            "reaction:legacy:products/read",
            "reaction:legacy:products/update:prices",
            "reaction:legacy:products/update",
            "reaction:legacy:shipping-rates/update:settings",
            "reaction:legacy:shippingMethods/create",
            "reaction:legacy:shippingMethods/delete",
            "reaction:legacy:shippingMethods/read",
            "reaction:legacy:shippingMethods/update",
            "reaction:legacy:shippingRestrictions/create",
            "reaction:legacy:shippingRestrictions/delete",
            "reaction:legacy:shippingRestrictions/read",
            "reaction:legacy:shippingRestrictions/update"
          ]
        }
        let userData = await collections.Groups.find({ name: seller.name }).toArray()
        if( userData?.length ){
          console.log("this is the sample api for giving permissions.", userData, await collections.Accounts.find({ _id }).toArray());
          let updatedUser = await collections.Accounts.updateOne(
            { _id },
            { $set: { groups: [userData[0]._id]}}
          )
          console.log("updatedUser", updatedUser);
          res.status(200).send({ success: true, messsage: "permissions added.", userData: userData })
  
        } else {
          let addedGroup = await collections.Groups.insertOne(seller)
          console.log("addedGroup", addedGroup.insertedId);
          await collections.Accounts.updateOne(
            { _id },
            { $set: { groups: [addedGroup.insertedId]}}
          )
          res.status(200).send({ success: true, messsage: "permissions added.", userData: userData })
        }
      } catch( err ){
        console.log("error", err);
        res.status(500).send({ success: false, messsage: "Server Error." })
      }
    })
  }
// The new myPublishProductToCatalog function parses our products,
// gets the new uploadedBy attribute, and adds it to the corresposellernding catalog variant in preparation for publishing it to the catalog
function myPublishProductToCatalog(
  catalogProduct,
  { context, product, shop, variants }
) {
  let { collections } = context;
  console.log("cataLogProduct", catalogProduct)
  // console.log("check product", catalogProduct, product, collections)
  catalogProduct.uploadedBy = product.uploadedBy || null;
  catalogProduct.upVotes = product.upVotes || 0
  // catalogProduct.variants &&
  //   catalogProduct.variants.map((catalogVariant) => {
  //     const productVariant = variants.find(
  //       (variant) => variant._id === catalogVariant.variantId
  //     );
  //     catalogVariant.uploadedBy = productVariant.uploadedBy || null;
  //     catalogVariant.ancestorId = productVariant["ancestors"][0]
  //       ? productVariant["ancestors"][0]
  //       : null;
  //     // catalogVariant.parentId=productVariant["parentId"]?productVariant["parentId"]:null;
  //   });
}
/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionAPI} app The ReactionAPI instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "api-plugin-seller",
    name: "api-plugin-seller",
    version: pkg.version,
    functionsByType: {
      startup: [myStartup1],
      publishProductToCatalog: [myPublishProductToCatalog],
    },
    graphQL: {
      schemas: [mySchema],
      resolvers,
    },
  });
}
