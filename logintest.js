// login-test.js
import fetch from "node-fetch"; // only if Node <18

async function testLogin() {
  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "your@email.com",
        password: "yourpassword"
      })
    });

    const data = await res.json();
    console.log("Login response:", data);
  } catch (err) {
    console.error("Error calling login:", err);
  }
}

testLogin();
