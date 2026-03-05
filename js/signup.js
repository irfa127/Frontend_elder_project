document.querySelectorAll(".role-option").forEach((m) => {
  m.addEventListener("click", () => {
    document
      .querySelectorAll(".role-option")
      .forEach((n) => n.classList.remove("active"));
    m.classList.add("active");
    document.getElementById("role").value = m.dataset.role;
  });
});

const form = document.getElementById("signupForm");

form.addEventListener("submit", async (a) => {
  a.preventDefault();
  const errorDiv = document.getElementById("errorMessage");
  const successDiv = document.getElementById("successMessage");
  errorDiv.style.display = "none";
  successDiv.style.display = "none";
  const userData = {
    email: document.getElementById("email").value.trim(),
    username: document.getElementById("username").value.trim(),
    full_name: document.getElementById("fullName").value.trim(),
    password: document.getElementById("password").value,
    role: document.getElementById("role").value,
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
  };

  // Form Validation

  if (!userData.full_name) {
    errorDiv.textContent = "Full Name is required.";
    errorDiv.style.display = "block";
    return;
  }

  if (!userData.username) {
    errorDiv.textContent = "Username is required.";
    errorDiv.style.display = "block";
    return;
  }
  if (!userData.email.includes("@") || !userData.email.includes(".")) {
    errorDiv.textContent = "Please enter a valid email address.";
    errorDiv.style.display = "block";
    return;
  }
  if (userData.password.length < 6) {
    errorDiv.textContent = "Password must be at least 6 characters long.";
    errorDiv.style.display = "block";
    return;
  }

  if (
    userData.phone &&
    (userData.phone.length !== 10 || isNaN(userData.phone))
  ) {
    errorDiv.textContent = "Please enter a valid 10-digit phone number.";
    errorDiv.style.display = "block";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    
    console.log(response)
    // console.log(data)

    if (response.status == 200) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      successDiv.textContent = "Account created successfully! Redirecting...";
      successDiv.style.display = "block";

      setTimeout(() => {
        const role = data.user.role;

        if (role === "patient") {
          window.location.href = "patient-dashboard.html";
        } else if (role === "nurse") {
          window.location.href = "nurse-dashboard.html";
        } else if (role === "oah_manager") {
          window.location.href = "oah-dashboard.html";
        }
      }, 1500);
    } else {
      let errorMessage = "Signup failed. Please try again.";
      if (data.detail) {
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((err) => err.msg || JSON.stringify(err))
            .join(", ");
        } else {
          errorMessage = data.detail.message || JSON.stringify(data.detail);
        }
      }
      errorDiv.textContent = errorMessage;
      errorDiv.style.display = "block";
    }
  } catch (error) {
    errorDiv.textContent =
      "Connection error. Please make sure the backend is running.";
    errorDiv.style.display = "block";
    console.error("Error:", error);
  }
});
