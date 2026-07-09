import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-southeast-1_zGjdn5K3U",
      userPoolClientId: "cpppgh9rt7kj1t3i5paej5526",
      loginWith: {
        email: true,
      },
    },
  },
});