# Debugging Tips

## Integration tests

When running the integration tests it is possible to break execution of the test suite by adding the following lines to your test:

    // add .only to the test when debugging to get to the test faster and skip the rest of the suite
    it.only('example test', async () => {
      // Raise the jest timeout to a much higher number
      jest.setTimeout(300000);
      ...
      // Place the following line to stop execution at a specific point in the code
      await IntegrationSpecHelper.sleep(300000);
      ...
    });
