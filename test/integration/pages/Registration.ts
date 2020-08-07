import axios from 'axios';

export async function register(page, USER) {
  await expect(page).toFillForm('form[name="signup_form"]', {
    email: USER.email,
    password: USER.password,
    passwordConfirmation: USER.passwordConfirmation,
    role: USER.role
  });
  const wait = page.waitForNavigation();
  expect(page).toClick('button', {text: 'Register'});
  const response = await page.waitForResponse(
    res => res.url() === process.env.APP_URL + '/users'
  );
  if (response.status() == 200) {
    await wait;
  }
  const data = await response.status();
  return data;
}

export async function addUser(USER) {
  return axios
    .post(process.env.APP_URL + '/users', USER)
    .then(({data}) => {
      return data;
    })
    .catch(error => {
      console.log(error);
    });
}
