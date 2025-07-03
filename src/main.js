function showRegister() {
  document.getElementById('login-box').classList.add('hidden');
  document.getElementById('register-box').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('register-box').classList.add('hidden');
  document.getElementById('login-box').classList.remove('hidden');
}


//**api for the create account  */

function registerUser(event) {
  event.preventDefault();

  const fullName = document.getElementById("regFullName").value.trim();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fullName, username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Registration successful! Please log in.");
        showLogin(); // function to switch to login form
      } else {
        alert(data.message || "Registration failed");
      }
    })
    .catch(err => {
      console.error("Error:", err);
      alert("Something went wrong");
    });
}


//**api for the create account */

//**login */
function loginUser(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!username || !password) {
    alert("Please enter both Username and Password.");
    return;
  }

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        if (data.role === "admin") {
          window.location.href = "/PAGES/dashboard.html";
        } else if (data.role === "user") {
          window.location.href = "/PAGES/home.html";
        } else {
          alert("Unknown role. Cannot redirect.");
        }
      } else {
        alert(data.message || "Login failed");
      }
    })
    .catch((err) => {
      console.error("Login error:", err);
      alert("Network error. Please try again.");
    });
}

//**login */