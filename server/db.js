const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION_DF,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_DF,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_DF,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports = { docClient };
