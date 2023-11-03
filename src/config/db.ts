import mysql from "mysql2/promise";

// vendit용
export const productDB = mysql.createPool({
  host: "13.125.72.99",
  user: "crawler",
  password: "kfasokfoaskovksfas241a@!asd",
  database: "vendit-crawler",
});

// test용
export const testDB = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "kangkong3095*",
  database: "vendit-crawler",
});
