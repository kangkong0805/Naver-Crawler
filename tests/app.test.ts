import { test, devices, expect } from '@playwright/test';

test.use(devices['Desktop Chrome'])

test('naver news crawling', async({page, context}) => {
    await context.route('**.jpg', route => route.abort())
    await page.goto('https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=100')

    const entries = await page.$$(`.section_headline > ul > li`)

    let list:any = []

    for(let entrie of entries) {
        const obj:any = {}

        const articleTitle = await(await entrie.$(`div.sh_text > a`))?.innerText()
        obj.articleTitle = articleTitle

        list.push(obj)
    }
    console.log(list)
})