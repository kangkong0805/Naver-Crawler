import { devices, test } from '@playwright/test';

test.use(devices['Desktop Chrome'])

const newsPage = 'https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=100'

test('naver news crawling', async({page}) => {
    await page.goto(newsPage)

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

test('naver news detail crawling', async({page}) => {
    await page.goto(newsPage)
    await page.locator('.section_headline > ul > li >> nth=0 >> .sh_text > a').click()
    
    const title = await page.locator('#title_area > span')?.innerText()
    const content = await page.locator('#newsct_article > *')?.innerText()
    const company = await page.locator('.ra_title > em').first()?.innerText()
    let images: any = await page.locator('#dic_area img').all()

    images = await Promise.all(images.map(async (image) =>  {
        return image.getAttribute('src')
    }))
    const news = {title, content, company, images}

    console.log(news)
})