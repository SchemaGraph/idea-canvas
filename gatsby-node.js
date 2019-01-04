const path = require('path');
exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === 'build-html') {
    console.log(loaders.null());
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /mobx-react-devtools/,
            use: loaders.null(),
          },
          {
            test: /.*\/codemirror\/.*/,
            use: loaders.null(),
          },
        ],
      },
    });
  }
};

// Implement the Gatsby API “onCreatePage”. This is
// called after every page is created.
exports.onCreatePage = ({ page, actions }) => {
  const { createPage } = actions;
  // Make the front page match everything client side.
  // Normally your paths should be a bit more judicious.
  // console.log(page.path);
  if (page.path === `/`) {
    page.matchPath = `/*`;
    createPage(page);
  }
};
