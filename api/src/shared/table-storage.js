const { TableClient } = require("@azure/data-tables");

const USER_PROFILE_TABLE_NAME =
  process.env.AZURE_STORAGE_REVIEW_USER_TABLE_NAME || "reviewusers";
const PROJECT_REVIEW_TABLE_NAME =
  process.env.AZURE_STORAGE_PROJECT_REVIEW_TABLE_NAME || "projectreviews";
const ARB_REVIEW_TABLE_NAME =
  process.env.AZURE_STORAGE_ARB_REVIEW_TABLE_NAME || "arbreviews";

function getTablesConnectionString() {
  const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage;

  if (!connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING or AzureWebJobsStorage is required for Azure Table Storage."
    );
  }

  return connectionString;
}

function encodeTableKey(value) {
  return Buffer.from(String(value ?? ""), "utf8").toString("base64url");
}

async function getTableClient(name) {
  const client = TableClient.fromConnectionString(getTablesConnectionString(), name);

  try {
    await client.createTable();
  } catch (error) {
    if (error?.statusCode !== 409) {
      throw error;
    }
  }

  return client;
}

module.exports = {
  ARB_REVIEW_TABLE_NAME,
  PROJECT_REVIEW_TABLE_NAME,
  USER_PROFILE_TABLE_NAME,
  encodeTableKey,
  getTableClient
};
