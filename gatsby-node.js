exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === "build-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /mobx-react-devtools/,
            use: loaders.null(),
          },
        ],
      },
    })
  }
}
