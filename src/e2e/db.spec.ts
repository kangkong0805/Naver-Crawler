import test from "@playwright/test";
import loadGoogleSheet from "../config/spreadsheet";
import { productDB } from "./../config/db";

test("crawling data to db", async () => {
  test.setTimeout(99999999);

  const otaName: string = "데일리호텔";

  const sheet = await loadGoogleSheet(otaName);

  if (!sheet) return;

  const rows = await sheet.getRows();

  const data = rows.map((row, i) => {
    return [
      i,
      String(rows[i].get("업장ID")),
      rows[i].get("업장명"),
      rows[i].get("회사명"),
      rows[i].get("숙박타입"),
      rows[i].get("행정구역"),
      rows[i].get("세부지역"),
      rows[i].get("사업자등록번호"),
      rows[i].get("판매자이름"),
      rows[i].get("판매자전화번호"),
      rows[i].get("판매자이메일"),
      "",
    ];
  });

  const connection = await productDB.getConnection();
  await connection.query("truncate accommodations");
  await connection.commit();
  await connection.query("insert into accommodations values ?", [data]);
  await connection.commit();
  await connection.release();
});
