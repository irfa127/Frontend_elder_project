document.querySelectorAll(".role-option").forEach((m) => {
  m.addEventListener("click", () => {
    document
      .querySelectorAll(".role-option")
      .forEach((n) => n.classList.remove("active"));
    m.classList.add("active");
    const role = m.dataset.role;
    document.getElementById("role").value = role;

    // Show/Hide Role Specific Fields
    const patientFields = document.getElementById("patientFields");
    const nurseFields = document.getElementById("nurseFields");
    const oahFields = document.getElementById("oahFields");
    const nameLabel = document.getElementById("nameLabel");

    if (role === "nurse") {
      patientFields.style.display = "none";
      nurseFields.style.display = "block";
      oahFields.style.display = "none";
      nameLabel.textContent = "Full Name";
    } else if (role === "oah_manager") {
      patientFields.style.display = "none";
      nurseFields.style.display = "none";
      oahFields.style.display = "block";
      nameLabel.textContent = "Old Age Home Name";
    } else {
      patientFields.style.display = "block";
      nurseFields.style.display = "none";
      oahFields.style.display = "none";
      nameLabel.textContent = "Full Name";
    }
  });
});

// Initialize on page load
const activeRole = document.querySelector(".role-option.active");
if (activeRole) activeRole.click();

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
    // Patient specific
    dob: document.getElementById("dob").value,
    gender: document.getElementById("gender").value,
    blood_group: document.getElementById("bloodGroup").value,
    emergency_contact_name: document.getElementById("emergencyName").value.trim(),
    emergency_contact_phone: document.getElementById("emergencyPhone").value.trim(),
    medical_condition: document.getElementById("medicalCondition").value.trim(),
    mobility_status: document.getElementById("mobilityStatus").value,
    // Nurse specific
    license_number: document.getElementById("licenseNumber").value.trim(),
    experience_years: parseInt(document.getElementById("experienceYears").value) || null,
    qualification: document.getElementById("qualification").value,
    specialization: document.getElementById("specialization").value,
    government_id: document.getElementById("governmentIdFile").value.trim(),
    // OAH specific
    total_beds: parseInt(document.getElementById("totalBeds").value) || null,
    registration_certificate: document.getElementById("regCertificateFile").value.trim(),
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

  // Patient Specific Validation
  if (userData.role === "patient") {
    if (!userData.dob) {
      errorDiv.textContent = "Date of Birth is required for Patients.";
      errorDiv.style.display = "block";
      return;
    }
    if (!userData.gender) {
      errorDiv.textContent = "Gender is required.";
      errorDiv.style.display = "block";
      return;
    }
    if (!userData.blood_group) {
      errorDiv.textContent = "Blood Group is required.";
      errorDiv.style.display = "block";
      return;
    }
    if (!userData.emergency_contact_name || !userData.emergency_contact_phone) {
      errorDiv.textContent = "Emergency contact details are required.";
      errorDiv.style.display = "block";
      return;
    }
    if (!userData.mobility_status) {
      errorDiv.textContent = "Mobility Status is required.";
      errorDiv.style.display = "block";
      return;
    }
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
