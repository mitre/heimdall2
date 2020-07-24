import "expect-puppeteer";

jest.setTimeout(5000)
describe("Login and Logout", () => {

  beforeAll(async () => {
   // await page.goto("http:/localhost:3000/");
  });
  beforeEach(async () => {
    await page.goto("http:/localhost:3000/");
  });
  afterEach(async () => {
  //  await page.close();;
  });
  it("Login working", async () => {
        await expect(page).toFillForm('form[name="login_form"]', {
          login: "sam@gmail.com",
          password: "aaa111bbb222ccc333DDD444!"});
         
          const wait = page.waitForNavigation();
            page.click('#login')
            //expect(page).toClick("button", { text: "Login" });
         //  await expect(page).toClick("button", { text: "Login" });
           await wait;
        await expect(page).toClick("button", { text: "Upload" });

      });
    


});