const API_URL = "https://elder-backend-a7db.vercel.app";
let currentUser = null;

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) { window.location.href = 'login.html'; return; }
  currentUser = JSON.parse(userStr);

  const isNurse = currentUser.role === 'nurse';

  document.getElementById("dynamicSidebar").innerHTML = `
    <a href="/frontend/index.html" class="nav-brand"><i class="fas fa-hand-holding-medical"></i> ElderConnect</a>
    <ul class="nav-menu">
      ${isNurse ? `
        <li class="nav-item"><a href="nurse-dashboard.html" class="nav-link"><i class="fas fa-columns"></i> Dashboard</a></li>
        <li class="nav-item"><a href="nurse-portal.html" class="nav-link"><i class="fas fa-calendar-check"></i> Appointment Portal</a></li>
        <li class="nav-item"><a href="nurse-profile.html" class="nav-link active"><i class="fas fa-user-md"></i> My Profile</a></li>
      ` : `
        <li class="nav-item"><a href="patient-dashboard.html" class="nav-link"><i class="fas fa-home"></i> Home</a></li>
        <li class="nav-item"><a href="patient-appointments.html" class="nav-link"><i class="fas fa-calendar-check"></i> Appointments</a></li>
        <li class="nav-item"><a href="patient-senior-living.html" class="nav-link"><i class="fas fa-hotel"></i> Senior Living</a></li>
        <li class="nav-item"><a href="patient-vitals.html" class="nav-link"><i class="fas fa-chart-line"></i> Health Vitals</a></li>
        <li class="nav-item"><a href="patient-profile.html" class="nav-link"><i class="fas fa-user-circle"></i> My Profile</a></li>
      `}
      <li class="nav-item"><a href="#" class="nav-link logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
    </ul>`;

  await loadProfile();
  document.querySelector(".section-head .btn-primary").onclick = updateProfile;
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/users/${currentUser.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!res.ok) return;

    const user = await res.json();
    currentUser = user;
    localStorage.setItem("user", JSON.stringify(user));

    document.getElementById("profileName").innerText = user.full_name;
    let roleText = user.role.toUpperCase();
    if (user.role === 'nurse' && user.rating) {
      roleText += ` • ⭐ ${user.rating}`;
    }
    document.getElementById("profileRole").innerText = roleText;

    // NAME BASED AVATAR
    setAvatar(user.full_name);

    document.getElementById("inputName").value = user.full_name;
    document.getElementById("inputEmail").value = user.email;
    document.getElementById("inputPhone").value = user.phone || "";
    document.getElementById("inputAddress").value = user.address || "";

    // Professional Details
    if (document.getElementById("inputLicense")) document.getElementById("inputLicense").value = user.license_number || "";
    if (document.getElementById("inputQualification")) document.getElementById("inputQualification").value = user.qualification || "";
    if (document.getElementById("inputExperience")) document.getElementById("inputExperience").value = user.experience_years || "";
    if (document.getElementById("inputSpecialization")) document.getElementById("inputSpecialization").value = user.specialization || "";
  } catch (e) {
    console.error("Error loading profile", e);
  }
}

function setAvatar(name) {
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=150`;
  document.getElementById("profileAvatar").src = url;
}

async function updateProfile() {
  const newName = document.getElementById("inputName").value.trim();
  const newEmail = document.getElementById("inputEmail").value.trim();
  const newPhone = document.getElementById("inputPhone").value.trim();
  const newAddress = document.getElementById("inputAddress").value.trim();
  const newPassword = document.getElementById("inputPassword").value.trim();

  // Validation: Don't allow clearing fields that already have values
  if (currentUser.full_name && !newName) {
    showToast("Please provide current value for Name.", "warning");
    return;
  }
  if (currentUser.email && !newEmail) {
    showToast("Please provide current value for Email.", "warning");
    return;
  }
  if (currentUser.phone && !newPhone) {
    showToast("Please provide current value for Phone Number.", "warning");
    return;
  }
  if (currentUser.address && !newAddress) {
    showToast("Please provide current value for Address.", "warning");
    return;
  }

  const updateBody = {
    full_name: newName,
    email: newEmail,
    phone: newPhone,
    address: newAddress,
    license_number: document.getElementById("inputLicense") ? document.getElementById("inputLicense").value.trim() : currentUser.license_number,
    qualification: document.getElementById("inputQualification") ? document.getElementById("inputQualification").value : currentUser.qualification,
    experience_years: document.getElementById("inputExperience") ? parseInt(document.getElementById("inputExperience").value) || 0 : currentUser.experience_years,
    specialization: document.getElementById("inputSpecialization") ? document.getElementById("inputSpecialization").value.trim() : currentUser.specialization
  };

  if (newPassword) {
    updateBody.password = newPassword;
  }

  try {
    const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(updateBody)
    });

    const data = await response.json();

    if (response.ok) {
      showToast("Profile Updated Successfully!");
      setAvatar(newName);
      await loadProfile();
    } else {
      showToast(data.detail || "Failed to update profile", "error");
    }
  } catch (e) {
    console.error(e);
    showToast("Connection Error", "error");
  }
}
