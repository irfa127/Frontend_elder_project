const API_URL = "http://127.0.0.1:8000";
let currentUser = null;

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) { window.location.href = "login.html"; return; }
  currentUser = JSON.parse(userStr);

  loadSidebar();
  await loadProfile();

  const saveBtn = document.querySelector(".section-head .btn-primary");
  if (saveBtn) saveBtn.onclick = updateProfile;
}

function loadSidebar() {
  document.getElementById("dynamicSidebar").innerHTML = `
    <a href="/frontend/index.html" class="nav-brand"><i class="fas fa-hand-holding-medical"></i> ElderConnect</a>
    <ul class="nav-menu">
      <li class="nav-item"><a href="patient-dashboard.html" class="nav-link"><i class="fas fa-home"></i> Home</a></li>
      <li class="nav-item"><a href="patient-appointments.html" class="nav-link"><i class="fas fa-calendar-check"></i> Appointments</a></li>
      <li class="nav-item"><a href="patient-senior-living.html" class="nav-link"><i class="fas fa-hotel"></i> Senior Living</a></li>
      <li class="nav-item"><a href="patient-vitals.html" class="nav-link"><i class="fas fa-chart-line"></i> Health Vitals</a></li>
      <li class="nav-item"><a href="patient-profile.html" class="nav-link active"><i class="fas fa-user-circle"></i> My Profile</a></li>
      <li class="nav-item"><a href="#" class="nav-link logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
    </ul>`;
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
    document.getElementById("profileRole").innerText = user.role.toUpperCase();

    //name BASED AVATAR
    setAvatar(user.full_name);

    document.getElementById("inputName").value = user.full_name;
    document.getElementById("inputEmail").value = user.email;
    document.getElementById("inputPhone").value = user.phone || "";
    document.getElementById("inputAddress").value = user.address || "";
  } catch (e) {
    console.error("Error loading profile", e);
  }
}

function setAvatar(name) {
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eff6ff&color=3b82f6&size=150`;
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
    address: newAddress
  };

  if (newPassword) {
    updateBody.password = newPassword;
  }

  try {
    const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
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
