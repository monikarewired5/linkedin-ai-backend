const swaggerJsdoc =
  require("swagger-jsdoc");

const options = {

  definition: {
    openapi: "3.0.0",

    info: {
      title:
        "LinkedIn Smart Feed API",

      version: "1.0.0",

      description:
        "AI backend for LinkedIn extension"
    },

    servers: [
      {
        url:
          "https://www.photospot.com"
      }
    ]
  },

  apis: ["./server.js"]
};

module.exports =
  swaggerJsdoc(options);