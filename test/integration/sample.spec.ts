import "expect-puppeteer";

jest.setTimeout(5000)
describe("Integration tests", () => {
  beforeAll(async () => {
    await page.goto("http:/localhost:3000/signup");
  });

  it("Registration", async () => {
    await expect(page).toFillForm('form[name="signup_form"]', {
      email: "test@mitre.org",
      password: "aaa111bbb222ccc333DDD444!",
      password_confirmation:"aaa111bbb222ccc333DDD444!",
      role: "admin"
    });
    await expect(page).toClick("button", { text: "Register" });
    await page.waitForNavigation();
  });

  it("Login", async () => {
    await expect(page).toFillForm('form[name="login_form"]', {
      login: "test@mitre.org",
      password: "aaa111bbb222ccc333DDD444!"
    });
    await expect(page).toClick("button", { text: "Login" });
    await page.waitForNavigation();
  });

  it("Upload Sample", async () => {
   await expect(page).toClick("button", { text: "Upload" });
   await page.waitForSelector("#sample_tab");
    await page.click("#sample_tab");
    await page.waitForSelector("#sample_button");
    await expect(page).toClick("#sample_button", { text: "" });

  });


  it("Check Text for Results page", async () => {
   await page.waitForNavigation();
    await expect(page).toMatch('Sonarqube Java Heimdall_tools Sample')
    await expect(page).toMatch('OWASP ZAP Webgoat Heimdall_tools Sample')
    
    await expect(page).toMatch('Failed: 3')


});

  it("Upload Local", async () => {
    //await expect(page).toClick("a", { text: "Samples" });
   // await page.waitForNavigation();
   await expect(page).toClick("button", { text: "Upload" });
   await page.waitForSelector("#local_files_tab");

});
/*


  it("Click Another Sample ", async () => {
    await expect(page).toClick("#sample_button", { text: "" });
    //await page.click('#sample')
    await page.waitForNavigation();
  });
*/
  it("Logout", async () => {
    await expect(page).toClick("button", { text: "Logout" });
    //await page.click('#sample')
    //await page.waitForNavigation();
  });


});