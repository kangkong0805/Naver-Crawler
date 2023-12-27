import * as mysql from "mysql2/promise";

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

export const getDB = async (data: any[][]) => {
  const connection = await productDB.getConnection();
  await connection.query("truncate accommodations");
  await connection.commit();
  await connection.query("insert into accommodations values ?", [data]);
  await connection.commit();
  await connection.release();
};

// class SellerInfoDB {
//   db: mysql.Pool | null

//   constructor() {
//     db: null
//   }

//   getDB = async () => {
//     const connection = await productDB.getConnection();
//     await connection.query("truncate accommodations");
//     await connection.commit();
//   };

//   setDB = async () => {
//     await connection.query("insert into accommodations values ?", [data]);
//   };
// }
