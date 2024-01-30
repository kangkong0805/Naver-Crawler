import dotenv from "dotenv";

dotenv.config();

const getEnv = (name: string) => process.env[name];

// db
export const db_host = getEnv("DB_HOST");
export const db_user = getEnv("DB_USER");
export const db_password = getEnv("DB_PASSWORD");
export const db_database = getEnv("DB_DATABASE");

// spreadsheet
export const private_key = getEnv("PRIVATE_KEY");
export const client_email = getEnv("CLIENT_EMAIL");
export const document_id = getEnv("DOCUMENT_ID");
