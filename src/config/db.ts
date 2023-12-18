import { PoolConnection, createPool } from "mysql2/promise";

// vendit용
export const productDB = createPool({
  host: "13.125.72.99",
  user: "crawler",
  password: "kfasokfoaskovksfas241a@!asd",
  database: "vendit-crawler",
});

// test용
export const testDB = createPool({
  host: "localhost",
  user: "root",
  password: "kangkong3095*",
  database: "vendit-crawler",
});

export const getDB = async (data: (string | number)[][]) => {
  const connection = await productDB.getConnection();
  await connection.query("truncate accommodations");
  await connection.commit();
  await connection.query("insert into accommodations values ?", [data]);
  await connection.commit();
  await connection.release();
};

class SellerInfoDB {
  dbType: 'live' | 'dev'
  connection: PoolConnection
  table: string

  constructor(
    dbType: 'live' | 'dev'
  ) {
    this.dbType = dbType
    this.table = 'accommodations'
  }

  getDB = async () => {
    this.connection = this.dbType === 'live' 
    ? await productDB.getConnection() 
    : await testDB.getConnection();
    return this.connection
  }

  setDB = async () => {
    await this.connection.query(`truncate ${this.dbType}`);
    await this.connection.commit();
  };

  setTable = async (name: string) => {
    this.table = name
  }
  
  getTable = () => this.table

  insert = async (data: (string | number)[][]) => {
    await this.connection.query(`insert into ${this.table} values ?`, [data]);
  }
  
}

export default SellerInfoDB