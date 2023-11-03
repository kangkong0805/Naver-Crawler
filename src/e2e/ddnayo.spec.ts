import test from "@playwright/test";

test("떠나요", async ({ page }) => {
  page.setDefaultTimeout(99999999);
  test.setTimeout(99999999);
  const data = [];
  await page.goto(
    "https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=1&orderBy=recommend"
  );
  const numberElement = await page.$("span.jss120");
  const numberText = await page.evaluate(
    (numberElement) => numberElement.textContent,
    numberElement
  );
  const number = parseInt(numberText.replace(/,/g, ""), 10);
  const pageNumber = parseInt(number / 24) + 1;
  console.log(pageNumber);
  for (let i = 1; i <= pageNumber; i++) {
    await page.waitForTimeout(1000);
    await page.goto(
      `https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=${i}&orderBy=recommend`
    );
    await page.waitForTimeout(1000);
    const links = await page.$$eval(
      "li.jss79 a div.jss83 div.jss85",
      (anchors) => anchors.map((a) => a.textContent)
    );
    console.log(links);
    for (let i = 0; i < links.length; i++) {
      const linkText = links[i];
      await page.click(`text=${linkText}`);
      await page.waitForTimeout(1000);
      let address, phone;
      try {
        const addressElement = await page.$('dt:has-text("주소") + dd');
        address = await page.evaluate(
          (element) => element.textContent,
          addressElement
        );
      } catch (error) {
        console.error("주소를 가져오는 중 에러 발생:", error);
        continue;
      }
      try {
        const phoneElement = await page.$('dt:has-text("연락처") + dd');
        phone = await page.evaluate(
          (element) => element.textContent,
          phoneElement
        );
      } catch (error) {
        console.error("연락처를 가져오는 중 에러 발생:", error);
        continue;
      }
      const cleanedAddress = address.replace("지도 보기", "").trim();
      data.push({
        name: linkText,
        address: cleanedAddress,
        phone: phone,
      });
      await page.goBack();
    }
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet 1"); // 'Sheet 1'은 워크시트 이름
  // XLSX 파일을 저장
  XLSX.writeFile(wb, "전국숙박업체_떠나요.xlsx"); // 'output.xlsx'는 저장할 파일의 이름
  console.log("XLSX 파일이 성공적으로 생성되었습니다.");
});
