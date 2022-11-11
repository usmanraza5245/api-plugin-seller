function myStartup(context) {
    context.simpleSchemas.Product.extend({
      uploadedBy: {
        type: Number,
        min: 0,
        optional: true
      }
    });
  
    context.simpleSchemas.CatalogProduct.extend({
      uploadedBy: {
        type: Number,
        min: 0,
        optional: true
      }
    })
  }

  export {myStartup};