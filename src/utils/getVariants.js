import { getUserByOpportunityId } from "./UserService.js";

/**
 *
 * @method getVariants
 * @summary Get all of a Unit's Variants or only a Unit's top level Variants.
 * @param {Object} context - an object containing the per-request state
 * @param {String} unitOrVariantId - A Unit or top level Unit Variant ID.
 * @param {Boolean} topOnly - True to return only a units top level variants.
 * @param {Object} args - an object of all arguments that were sent by the client
 * @param {Boolean} args.shouldIncludeHidden - Include hidden units in results
 * @param {Boolean} args.shouldIncludeArchived - Include archived units in results
 * @returns {Promise<Object[]>} Array of Unit Variant objects.
 */
export default async function getVariantsByUserId(
  context,
  ownerId,
  topOnly,
  args
) {
  const { shouldIncludeHidden, shouldIncludeArchived } = args;
  const { collections } = context;
  const { Products } = collections;

  let userServiceId = "";
  try {
    // const variables = {
    //   userId: ownerId,
    // };
    const userResponse = await getUserByOpportunityId(ownerId);
    const { data } = userResponse;
    if (data && Object.keys(data).length > 0) {
      userServiceId =
        data &&
        data.data &&
        data.data.getUserByOpportunityId &&
        data.data.getUserByOpportunityId.user &&
        data.data.getUserByOpportunityId.user._id;
    }
    console.log("user Response...", data.data.getUserByOpportunityId);
  } catch (err) {
    console.log("error...", err);
  }
  // const selector = {
  //   "uploadedBy.userId": ownerId,
  //   "metafields.valueType": ownerId,
  //   type: "simple",
  // };
  let selector;
  if (userServiceId) {
    selector = {
      $and: [
        {
          type: "simple",
          $or: [
            { "uploadedBy.userId": ownerId },
            {
              metafields: {
                $elemMatch: { valueType: userServiceId, key: "collaborator" },
              },
            },
          ],
        },
      ],
    };
  } else {
    selector = {
      "uploadedBy.userId": ownerId,
      type: "simple",
    };
  }
  console.log("owner id...", ownerId);
  console.log("user id...", userServiceId);
  console.log("selector...", selector);
  // Only include visible variants if `false`
  // Otherwise both hidden and visible will be shown
  // if (shouldIncludeHidden === false) {
  //   selector.isVisible = true;
  // }

  // // Exclude archived (deleted) variants if set to `false`
  // // Otherwise include archived variants in the results
  // if (shouldIncludeArchived === false) {
  //   selector.isDeleted = {
  //     $ne: true,
  //   };
  // }

  return Products.find(selector).toArray();
}
