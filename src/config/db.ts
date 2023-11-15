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

  constructor() {
    this.dbType = 'live'
    this.table = 'accommodations'
  }

  createDB = async () => {
    this.connection = this.dbType === 'live' 
    ? await productDB.getConnection() 
    : await testDB.getConnection();
  }

  getDB = async () => {
    this.connection = await productDB.getConnection();
    await this.connection.query("truncate accommodations");
    await this.connection.commit();
  };

  setTable = async (name: string) => {
    this.table = name
  }

  insert = async (data: (string | number)[][]) => {
    await this.connection.query(`insert into ${this.table} values ?`, [data]);
  }
  
}

export default SellerInfoDB