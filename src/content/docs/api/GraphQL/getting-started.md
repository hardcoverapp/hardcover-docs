---
title: Getting Started with the GraphQL API
---

## Introduction
Our API is accessible using GraphQL. The API that you can use is exactly the same API used by the website, iOS and Android apps.
This means that you can build your own tools and services that interact with the same data that you see on the website.

The API is currently in beta, and we are actively working on it. 
We are looking for feedback on the API, and we are constantly improving it.

## Getting an API Key
To get an API token, you need to go to your account profile and click on the "API" tab, the token will be available
at the top of the page. This token will be used to authenticate your requests to the API.

API tokens are not meant to be shared, and should be kept private, as they can be used to access your account and data.

After you have your token, you can start making requests to the API.

## Making Your First Request
After you have your token, you can head over to the GraphQL console.
Next, add a header just called "authorization" (no quotes) with your token as the value.

Tab out of the field, and you should see a list of available resources.

### Example Request
To test that it's working, try the following GraphQL query:

```graphql
query Test {
  me {
    username
  }
} 
```
Click the play button and you should see your username!

## Important Notes About the Hardcover API
- The API is still heavily in flux right now. Anything you build using it could break in the future.
- We may reset tokens without notice while in beta.
- The same ownership rights exist for this as anything on the site. You own your data. This means you can't use the API to access and use someone elses data.
- This API is running the same as if you were using the browser. Any actions you take will be under your user.
- #### <span style="color:red"><span style="color:red">Don't share your token! Someone could delete your account with it.</span>
- This should only be used from a code backend - never from a browser.
- This is only for offline use at this time. You can only access this API from localhost or APIs. Later on we hope to allow developers to join a group that whitelists specific sites, but that's a ways down the line.

## Further Reading
- [GraphQL API Reference](https://graphql.org/learn/)