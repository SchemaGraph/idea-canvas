# Idea Canvas

A protype for quickly sketching up network diagrams.

Can be run in either local mode by navigating to the root
or in a shared mode by specifying a graph name in the url path (e.g. [/my-awesome-graph](https://idea-canvas.netlify.com/my-awesome-graph)).

Supports either local persistence with the browser's `localStorage`
or realtime sync with AWS's [AppSync](https://github.com/dabit3/awesome-aws-appsync).

User authentication is implemented using Amazon Cognito and currently supports social
sign-in with either Facebook or Google.


Additional functionality:
- `/actions/signin`
- `/actions/sigout`
- `/actions/profile`
