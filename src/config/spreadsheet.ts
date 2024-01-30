import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { client_email, document_id, private_key } from "./getEnv";

const getGoogleSheet = async () => {
  const client = new JWT({
    email: client_email,
    key: private_key,
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const docId = document_id;
  if (docId) return new GoogleSpreadsheet(docId, client);
};

const loadGoogleSheet = async (title: string, header?: string[]) => {
  const doc = await getGoogleSheet();

  if (!doc) return console.log("구글 스프레드 시트 생성이 안됨");
  await doc.loadInfo();

  let dataSheet = doc.sheetsByTitle[title];
  const getHeaderRow = async () => {
    try {
      await dataSheet.loadHeaderRow();
      return true;
    } catch {
      return false;
    }
  };

  if (!dataSheet)
    dataSheet = await doc.addSheet({ title: title, headerValues: header });
  if (!(await getHeaderRow()) && header) dataSheet.setHeaderRow(header);

  await doc.loadInfo();
  return dataSheet;
};

export default loadGoogleSheet;
