exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === "build-html") {
    // actions.setWebpackConfig({
    //   module: {
    //     rules: [
    //       {
    //         test: /storm-react-diagrams/,
    //         use: loaders.null(),
    //       },
    //     ],
    //   },
    // })
  }
}
