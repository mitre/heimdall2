const vueJest = require('vue-jest/lib/template-compiler');

module.exports = {
  process(content) {
    const {render} = vueJest({
      content,
      attrs: {
        functional: false
      }
    });

    return {code: `module.exports = { render: ${render} }`};
  }
};
