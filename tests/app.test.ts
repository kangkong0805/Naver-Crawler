import { devices, test } from '@playwright/test';

test.use(devices['Desktop Chrome'])

test('naver news crawling', async({page, context}) => {
    await page.goto('https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=100')

    const entries = await page.locator('.section_headline > ul > li').all()

    let list:Array<Object> = []

    const promise = entries.map(async (entrie) => {
        const title = await entrie.locator('.sh_text > a')?.innerText()
        const content = await entrie.locator('.sh_text > .sh_text_lede')?.innerText()
        const company = await entrie.locator('.sh_text .sh_text_press')?.innerText()
        const thumbnail = await entrie.locator('.sh_thumb_link > img').getAttribute('src')

        list.push({title, content, company, thumbnail})
    })

    await Promise.all(promise)

    console.log(list)
})