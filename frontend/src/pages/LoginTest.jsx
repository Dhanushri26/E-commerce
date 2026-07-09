import { useState } from "react";
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
} from "aws-amplify/auth";
export default function LoginTest({ onLogin }) {
  const [email, setEmail] = useState("testuser@jewelcart.com");
  const [password, setPassword] = useState("JewelCart@123");
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");

async function handleLogin() {
  try {
    const result = await signIn({
      username: email,
      password,
    });

    console.log("========== SIGN IN RESULT ==========");
    console.log(result);
    console.log("isSignedIn:", result.isSignedIn);
    console.log("nextStep:", result.nextStep);
    if (result.isSignedIn) {
      console.log("✅ User is signed in.");

      const session = await fetchAuthSession();

      console.log("========== SESSION ==========");
      console.log(session);

      console.log("========== TOKENS ==========");
      console.log(session.tokens);

      console.log("========== ID TOKEN ==========");
      console.log(session.tokens?.idToken?.toString());

      console.log("========== ACCESS TOKEN ==========");
      console.log(session.tokens?.accessToken?.toString());

      setMessage("Login Successful");

      onLogin();

      return;
    }

    if (
      result.nextStep?.signInStep ===
      "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
    ) {
      setMessage("Enter a new password below.");
      return;
    }

  } catch (err) {

    if (err.name === "UserAlreadyAuthenticatedException") {
      console.log("Already logged in.");

      const session = await fetchAuthSession();

      console.log(session);

      onLogin();

      return;
    }

    console.error(err);
    setMessage(err.message);
  }
}

async function handleNewPassword() {
  try {
    const result = await confirmSignIn({
      challengeResponse: newPassword,
    });

    console.log(result);

    setMessage(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
    setMessage(err.message);
  }
}
async function getSession() {
  try {
    const session = await fetchAuthSession();

    console.log("Complete Session:");
    console.log(session);

    console.log("Tokens:");
    console.log(session.tokens);

    console.log("Access Token:");
    console.log(session.tokens?.accessToken);

    console.log("ID Token:");
    console.log(session.tokens?.idToken);

  } catch (err) {
    console.error(err);
  }
}

  return (
    <div style={{ padding: 40 }}>
      <h2>Login Test</h2>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <br /><br />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <br /><br />

      <button onClick={handleLogin}>
        Login
      </button>
      <br /><br />

<input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
/>

<br /><br />

<button onClick={handleNewPassword}>
  Set New Password
</button>

      <pre>{message}</pre>
      <br /><br />

<button onClick={getSession}>
  Get JWT Token
</button>
    </div>


  );
}