initPage();

async function initPage() {
  try {
    checkAuth();
  } catch (e) {
    console.error("Auth check failed:", e);
  }

  const currentPath = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  const logoutBtn = document.querySelector(".logout-link");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/frontend/index.html";
      }
    });
  }

  // Sidebar Toggle Logic
  const menuToggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  // i don't undertand thi part
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent immediate closing
      sidebar.classList.toggle("active");
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !menuToggle.contains(e.target) &&
        sidebar.classList.contains("active")
      ) {
        sidebar.classList.remove("active");
      }
    });
  }
}

// Login irukka nu check pannrom
function checkAuth() {
  const protectedPages = [
    "dashboard",
    "profile",
    "appointments",
    "vitals",
    "senior-living",
  ];
  const currentPath = window.location.pathname;
  const isProtected = protectedPages.some((page) => currentPath.includes(page));

  const token = localStorage.getItem("token");
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Error parsing user data:", e);
    localStorage.removeItem("user");
  }

  if (isProtected && (!token || !user)) {
    window.location.href = "login.html";
    return;
  }

  if (user) {
    const greeting = document.getElementById("user-greeting");
    const avatar = document.getElementById("user-avatar");

    if (greeting && user.full_name)
      greeting.innerHTML = `Hello, ${user.full_name} <i class="fas fa-hand-peace"></i>`;
    if (avatar && user.full_name)
      avatar.src = `https://ui-avatars.com/api/?name=${user.full_name}&background=eff6ff&color=3b82f6`;
  }
}

// Modal Logic Popup open pannradhu
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

// Global Notification Helper
function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === "success" ? "#10b981" : "#ef4444"};
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        z-index: 9999;
        font-weight: 700;
        animation: slideIn 0.3s ease;
    `;
  toast.innerHTML = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Refresh User Data (Sync with Backend) Profile update pannina udane reflect aagum
async function refreshUserData(userId) {
  if (!userId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) userId = user.id;
    else return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (response.ok) {
      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Update LocalStorage

      const greeting = document.getElementById("user-greeting");
      const avatar = document.getElementById("user-avatar");
      if (greeting) greeting.innerHTML = `Hello, ${updatedUser.full_name} <i class="fas fa-hand-peace"></i>`;
      if (avatar)
        avatar.src = `https://ui-avatars.com/api/?name=${updatedUser.full_name}&background=eff6ff&color=3b82f6`;

      console.log("User data refreshed");
    }
  } catch (error) {
    console.error("Failed to refresh user data:", error);
  }
}

// Helper to parse error messages from API
function getErrorMessage(detail) {
  if (!detail) return "An error occurred.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((err) => err.msg || JSON.stringify(err)).join(", ");
  }
  return detail.message || JSON.stringify(detail);
}

// Password Visibility Toggle
function togglePasswordVisibility(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    iconElement.classList.replace("fa-eye-slash", "fa-eye");
  } else {
    input.type = "password";
    iconElement.classList.replace("fa-eye", "fa-eye-slash");
  }
}
