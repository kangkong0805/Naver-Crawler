import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";

const getGoogleSheet = async () => {
  const createGoogleSheet = async () => {
    const client_email =
      "vendit-cms-daemon@vendit-cms-daemon.iam.gserviceaccount.com";
    const private_key =
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbbXt/QJDtSLEJ\nok958DeALnJIzh1UoUT47X7pc3equKkFqOMCH0CSRl8EENJdVCCkc+kg9UZ2SF1f\nTXHdMmuHn5p4+ImDHbRrVSSX5xTarGsEgbxd2O7ANFoUUuUQJPeVLpiquUhYvtGS\noIV3w4oGIRs544h+jGCZ1ePGJ14mQDay3F3Xcj0IGZeN8U6sqpt4VcXxOrMlAoFh\nvnBFeES5LTq7FuYQR9VLnFvatgpBewoKUKvEyVEx2hJ4C6qonilEz14mHPlmkEfl\n1c7cm07cOMHKsG2qe9wvLMQrEnUdqKdX55x+J+WUKcibqmpabm62/x5q4nVuBOw7\nfvLJVIP9AgMBAAECggEAGmCVWBfktBl+aq2Pxz/uCWMhSt44Hrx02ZsBxsIiJawl\naVrtewuoYU0Yo+5PviIG+y3nMuvj3gPXRvBnhShyo67hzLP3zS1XdbrvogZdy+cD\nxbAWJY6Wg2q8/19y+MIGNHE8WfLZnw1v4k6Yl2vdSN0BnwUFRffNrwB2wpMTRB6l\nVeia3T1jRPL+sKbUDFWE9xRKT9qxFUWAe3CYNqn4JP/O9Y7lkvOd3Iaw2fHIVkZX\nuRHKZs4k4Fgult/NEE+ISgSYQL4S8QUDL4n48wwngGY1IDSmbhIPihLMrRWbj5Zp\n/ZEurdyJR9+q7kAMKc8QfYWDMrHV2opNYMYW8+JC0wKBgQDyEENoXzy5gpLS97AQ\naM7XoAnhIGdjB4++8fx2bCxSIGCQsm/tP2asN+RR87XI5IXShgx54HY9xA5uu1eT\nqgTHSYC3FGvczh2rZAcAE++ch3r3kOgCnNH75AVH2xgZGBvmH85pfEeES9BoLRC3\nauxQDXKx0iEF8h40DcYLz4RznwKBgQDoD5e3FwI5yQJ7cQ73mCMaazreuqRkc92Z\njfLIoH6/rxC+ByP27kU2e2A25d7CnXGK1LkmeOUeQWZxH+GiJnIQ7U+msf6iEKy/\ns+eFPe4zgHY64gFZpo7C0mBEhyUg+kI4Rolq7fjHbuPEkrPw/p8wAwMhtJ5ueEip\nYVB4/g1C4wKBgQDkl9swe4/bGKYTOPk55eA/3NC3m2RHLuLezaM/KlSIki7fNsNg\nZxlM1dN2WRJ4zuZZs2GgzwqatcVzaNQBjPPKR22Yd16NPNDkBChgOHN1fLPxixSv\nMu1SVTlvbEZLnGrsXWkOUOEw3G/JkZVRwVW9G5YOu4OYG9fODJvUl3pbvQKBgFej\nO9qLN+32uZdAtTRQIkGh6VOgDOFa2H9bGismYXemd54sOCrTBRR0N3vECAJbTzvs\n5hdfZLeuXy+tqJqCBmXaGVCMu+scfQDQwkiRgNm2U/Ac1gGzYwq0RGLc3uq7WDLE\ngLT/NgqrGB1ugcIrhpatLIuYGJUDm/1LoQZwezWdAoGAakjTs1chnUP11nYIQTb0\nTWc0kbixNWRkKzLkECblizvobYfGO452og3HPC6oOSlVbefSEoAPODbWbAXI6cM3\n/TGF21pyeBKhi5QJlGH8fCfwXDqwcIO0nrMEzMtjzAjanTmnD6bziHVgvae46Gii\nocxkrbq6Ij0Tn76pnp1bqbk=\n-----END PRIVATE KEY-----\n";
    const client = new JWT({
      email: client_email,
      key: private_key,
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const docId = "19hVQLMSzvf6fgWoGlsv_OkFSHL1V1pXllTLk3MsrTN0";
    return new GoogleSpreadsheet(docId, client);
  };
  const doc = await createGoogleSheet();
  return doc;
};

const loadGoogleSheet = async (title: string, header?: string[]) => {
  const doc = await getGoogleSheet();

  if (!doc) return console.log("구글 스프레드 시트 생성에서 막힘");
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
