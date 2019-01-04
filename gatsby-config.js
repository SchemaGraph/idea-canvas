// require('dotenv').config({
//   path: `.env.${process.env.NODE_ENV}`,
// })
// console.log(process.env)
module.exports = {
  siteMetadata: {
    siteName: `Idea Canvas`,
    cognitoDomain: process.env.COGNITO_DOMAIN,
    cognitoUserPoolClientId: process.env.COGNITO_USER_POOL_CLIENT_ID,
    externalBaseUrl: process.env.EXTERNAL_BASE_URL,
  },
  plugins: [
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-typescript`,
    `gatsby-plugin-netlify`,
    `gatsby-plugin-react-helmet`,
  ],
}
