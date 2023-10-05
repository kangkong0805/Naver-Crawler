import { chromium, devices } from 'playwright';

(async () => {
    // Setup
    const browser = await chromium.launch({headless: false});
    const context = await browser.newContext(devices['Desktop Chrome']);
    const page = await context.newPage()

    // The actual interesting bit
    await context.route('**.jpg', route => route.abort())
    await page.goto('https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=100')

    const entries = await page.$$(`.section_headline > ul > li`)

    let list:any = []

    for(let entrie of entries) {
        const obj:any = {}

        const title = await(await entrie.$(`div.sh_text > a`))?.innerText()
        const content = await(await entrie.$(`div.sh_text > div.sh_text_lede`))?.innerText()
        const company = await(await entrie.$(`div.sh_text > div.sh_text_info > div.sh_text_press`))?.innerText()

        obj.title = title
        obj.content = content
        obj.company = company

        list.push(obj)
    }
    console.log(list)
    await context.close()
    await browser.close()
})()