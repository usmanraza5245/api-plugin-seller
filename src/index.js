import pkg from "../package.json";
import SimpleSchema from "simpl-schema";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
const mySchema = importAsString("./schema.graphql");
// import getMedia from "./utils/getMedia.js";

var _context = null;

const resolvers = {
  Account: {
     async productVariants(parent, args, context, info) {
       console.log("parent",parent);
      let productVariant=await getVariantsByUserId(context, parent.userId, true, args);
      return productVariant;
    }
  },
  ProductVariant:{
    async ancestorId (parent, args, context, info){
      return parent.ancestors[0];
    }
  }

};
function myStartup1(context) {
  _context = context;
  const { app, collections, rootUrl } = context;
  if (app.expressApp) {
    app.expressApp.post("/uploadByURL", function (req, res, next) {
      console.log("body",req.body)
      // write your callback code here.
      res.send("asdasdasds")
    });
  }
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


  context.simpleSchemas.ProductVariant.extend({
    uploadedBy: OwnerInfo,
    ancestorId    :{
      type: String,
      optional: true,
    },
  });

  context.simpleSchemas.CatalogProductVariant.extend({
    uploadedBy: OwnerInfo,
    ancestorId    :{
      type: String,
      optional: true,
    },

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
console.log("publish product",productVariant);

      catalogVariant.uploadedBy = productVariant.uploadedBy || null;
      catalogVariant.ancestorId=productVariant["ancestors"][0]?productVariant["ancestors"][0]:null;
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
      resolvers
    },
  });
}
