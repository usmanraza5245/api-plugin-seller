import pkg from "../package.json";
import SimpleSchema from "simpl-schema";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
const mySchema = importAsString("./schema.graphql");
import getOrdersByUserId from "./utils/getOrders.js";
import getVariantsByUserId from "./utils/getVariants.js";
import updateUserAccountBook from "./utils/updateUserAccountBook.js";

import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
var _context = null;
const resolvers = {
  Account: {
    async productVariants(parent, args, context, info) {
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

    async orderFulfillment(parent, args, context, info) {
      let userOrders = await getOrdersByUserId(
        context,
        parent.userId,
        true,
        args
      );
      console.log("userOrders", userOrders);
      return userOrders;
    },
  },
  ProductVariant: {
    async ancestorId(parent, args, context, info) {
      return parent.ancestors[0];
    },
    async parentId(parent, args, context, info) {
      return encodeOpaqueId("reaction/product", parent.ancestors[0]);
      //encode( encodeOpaqueId(parent.ancestors[0]))
    },
  },
  Query: {},
  Mutation: {
    async updateAccountpayBookEntry(parent, args, context, info) {
      let updateResponse=await updateUserAccountBook(context,args.input);
      return updateResponse;
    },
  },
};

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
  const AccountBook = new SimpleSchema({
    AccountNo: {
      type: String,
      max: 30,
      optional: true,
    },
    isActive: {
      type: Boolean,
      optional: true,
    },
  });
  context.simpleSchemas.ProductVariant.extend({
    uploadedBy: OwnerInfo,
    ancestorId: {
      type: String,
      optional: true,
    },
    parentId: {
      type: String,
      optional: true,
    },
  });
  context.simpleSchemas.CatalogProductVariant.extend({
    uploadedBy: OwnerInfo,
    ancestorId: {
      type: String,
      optional: true,
    },
    parentId: {
      type: String,
      optional: true,
    },
  });
  context.simpleSchemas.Account.extend({
    AccountBook: AccountBook,
  });
}
// The new myPublishProductToCatalog function parses our products,
// gets the new uploadedBy attribute, and adds it to the corresponding catalog variant in preparation for publishing it to the catalog
function myPublishProductToCatalog(
  catalogProduct,
  { context, product, shop, variants }
) {
  catalogProduct.variants &&
    catalogProduct.variants.map((catalogVariant) => {
      const productVariant = variants.find(
        (variant) => variant._id === catalogVariant.variantId
      );
      catalogVariant.uploadedBy = productVariant.uploadedBy || null;
      catalogVariant.ancestorId = productVariant["ancestors"][0]
        ? productVariant["ancestors"][0]
        : null;
      // catalogVariant.parentId=productVariant["parentId"]?productVariant["parentId"]:null;
    });
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
