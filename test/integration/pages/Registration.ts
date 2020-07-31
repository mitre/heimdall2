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
    res => res.url() === 'http://localhost:3000/users'
  );
  if (response.status() == 200) {
    await wait;
  }
  const data = await response.status();
  return data;
}

/*
export async function login( USER) {


       return  axios.post('http://localhost:3000/authn/login', {email: USER.email, password: USER.password}).then(({data}) => {
          return data.accessToken
        }).catch(error => {
            console.log(error)
        });
}

export async function unregister(USER , Response){
    const token = await login(USER)


    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await axios.delete('http://localhost:3000/users/'+Response.id,{ data: {password: USER.password}}).then(({data}) => {
        return console.log(data)
      }).catch(error => {
          console.log(error)
      }); 
    return token; 
    //console.log(USER_INFO.id)

}
*/
