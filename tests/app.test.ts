import { devices, test } from '@playwright/test';

test.use(devices['Desktop Chrome'])

test('naver news crawling', async({page, context}) => {
    await page.goto('https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=100')

    const entries = await page.locator(`.section_headline > ul > li`).all()
    let list:any = []

    console.log(entries)

    entries.map(async (entrie) => {
        console.log(entrie)
        let obj:any = {}

        const title = await entrie.allInnerTexts
        const content = await entrie.locator(`div.sh_text > div.sh_text_lede`)?.innerText()
        const company = await entrie.locator(`div.sh_text > div.sh_text_info > div.sh_text_press`)?.innerText()

        obj.title = title
        obj.content = content
        obj.company = company

        list.push(obj)
    })

    console.log(list)



    // console.log(await Promise.all(entries).)
    // console.log(await Promise.all(entries))

    // for (const li of await Promise.all(entries))

    // Promise.all(entries)

    // onClick = async () => {
    //     console.time("ABC");
    //     try {
    //       const data001 = new Promise((resolve) =>
    //         setTimeout(resolve, 3000, "promise001")
    //       );
      
    //       const data002 = Promise.reject("promise002 reject");
      
    //       const data003 = await Promise.all([data001, data002]);
    //       console.log(data003);
    //     } catch (error) {
    //       console.error(error);
    //     } finally {
    //       console.timeEnd("ABC");
    //     }
    //   };

    // for(let entrie of entries) {
    //     const obj:any = {}
        
    //     const title = await(await entrie.locator(`div.sh_text > a`))?.innerText()
    //     const content = await(await entrie.locator(`div.sh_text > div.sh_text_lede`))?.innerText()
    //     const company = await(await entrie.$(`div.sh_text > div.sh_text_info > div.sh_text_press`))?.innerText()

    //     obj.title = title
    //     obj.content = content
    //     obj.company = company

    //     list.push(obj)

    //     break
    // }

    // console.log(list)
})