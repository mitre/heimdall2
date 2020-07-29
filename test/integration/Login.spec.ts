import "expect-puppeteer";

jest.setTimeout(5000)
describe("Login and Logout", () => {

  beforeEach(async () => {
    await page.goto("http:/localhost:3000/");
  });
  afterEach(async () => {
    await page.evaluate(() => {
        localStorage.clear()         });
  });

        it("Login working", async () => {
        await expect(page).toFillForm('form[name="login_form"]', {
          login: "email_exists@mitre.com",
          password: "aaa111bbb222ccc333DDD444!"});
         
          const wait = page.waitForNavigation();
           page.click('#login')
           await wait;
           console.log(page.url())
           await expect(page.url()).toBe('http://localhost:3000/profile');
         //await expect(page).toClick("button", { text: "Upload" }) 
      });
      it("Login failure with wrong password", async () => {
        await expect(page).toFillForm('form[name="login_form"]', {
          login: "email_exists@mitre.org.com",
          password: "aaa111bb33DDD44!"});
         
          const wait = page.waitForNavigation();
          page.click('#login')
           await wait;
           await expect(page.url()).toBe('http://localhost:3000/login');
        /* const text = await page.evaluate(() => document.body.textContent);
         expect(text).toContain('Unauthorized');*/
        // await expect(page).toClick("button", { text: "Upload" })
      });
      it("Login failure with wrong email", async () => {
        await expect(page).toFillForm('form[name="login_form"]', {
        login: "email_doesn_exist@mitre.org.com",
        password: "aaa111bbb222ccc333DDD444!"});
        page.click('#login')
 

         await page.waitForFunction(
            'document.querySelector("body").innerText.includes("ERROR: Unauthorized")'
          );
          const text = await page.evaluate(() => document.body.innerHTML);
            await expect(text).toContain('ERROR: Unauthorized');

      });
      it("Logout working", async () => {
        await expect(page).toFillForm('form[name="login_form"]', {
          login: "email_exists@mitre.org",
          password: "aaa111bbb222ccc333DDD444!"});
         
          const wait = page.waitForNavigation();
           page.click('#login')
           await wait;
           console.log(page.url())
           page.click('#logout')
           
           await page.waitForSelector("#login");
           await expect(page.url()).toBe('http://localhost:3000/login');
      });

    


});