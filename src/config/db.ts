import * as mysql from "mysql2/promise";
import { db_database, db_host, db_password, db_user } from "./getEnv";

// vendit용
export const productDB = mysql.createPool({
  host: db_host,
  user: db_user,
  password: db_password,
  database: db_database,
});

// test용
export const testDB = mysql.createPool({
  host: "ip 주소",
  user: "사용자 이름",
  password: "비밀번호",
  database: "데이터베이스 이름",
});

export const getDB = async (data: any[][]) => {
  const connection = await productDB.getConnection();
  await connection.query("truncate accommodations");
  await connection.commit();
  await connection.query("insert into accommodations values ?", [data]);
  await connection.commit();
  await connection.release();
};
