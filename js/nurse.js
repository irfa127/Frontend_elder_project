initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(userStr);

  if (user.role !== "nurse") {
    alert("Access denied. Only nurses can view this dashboard.");
    window.location.href = "login.html";
    return;
  }
  // apoinment chages function updated booking

  window.updateStatus = async (id, newStatus) => {
    if (typeof id === "string") return;


    try {
      const response = await fetch(`http://127.0.0.1:8000/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert(`Status successfully updated to ${newStatus}`);
        location.reload();
      } else {
        const err = await response.json();
        const errorMsg =
          typeof getErrorMessage !== "undefined"
            ? getErrorMessage(err.detail)
            : typeof err.detail === "object"
              ? JSON.stringify(err.detail)
              : err.detail;

        if (response.status === 400 && errorMsg.includes("already attending")) {
          console.warn(
            "Update blocked: This nurse is already attending another patient.",
          );
        } else {
          alert("Failed to update status: " + (errorMsg || "Server Error"));
        }
      }
    } catch (e) {
      console.error(e);
      alert("Connection error. Please check if backend is running.");
    }
  };
  // complete button
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (typeof showToast !== "undefined") {
        showToast(
          "Health results successfully uploaded and shared with the patient dashboard! <i class='fas fa-check-circle'></i>",
        );
      } else {
        alert(
          "Health results successfully uploaded and shared with the patient dashboard!",
        );
      }
      uploadForm.reset();
    });
  }
}
// dashboard data load function
async function loadNurseDashboard(user) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/appointments/nurse/${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    if (!response.ok) throw new Error("Failed to fetch dashboard data");

    const appointments = await response.json();

    const normalized = appointments.map((a) => ({
      ...a,
      status: a.status.toUpperCase(),
    }));

    const pending = normalized.filter((a) => a.status === "PENDING").length;
    const completed = normalized.filter((a) => a.status === "COMPLETED").length;

    const statPending = document.getElementById("stat-pending");
    const statCompleted = document.getElementById("stat-completed");

    if (statPending)
      statPending.innerText = pending.toString().padStart(2, "0");
    if (statCompleted)
      statCompleted.innerText = completed.toString().padStart(2, "0");
// Next Visit container
    const upcoming = normalized
      .filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED")
      .sort(
        (a, b) => new Date(a.appointment_date) - new Date(b.appointment_date),
      )[0];

    const nextContainer = document.getElementById("next-visit-container");
    if (nextContainer) {
      if (upcoming) {
        const date = new Date(upcoming.appointment_date);
        const [hoursStr, minutes] = upcoming.appointment_time.split(":");
        const hours = parseInt(hoursStr);
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;

        nextContainer.innerHTML = `
          <div style="display: flex; align-items: start; gap: 20px">
            <div style="padding: 15px; background: var(--bg-body); border-radius: 15px; text-align: center;">
              <p style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">
                ${displayHours}:${minutes}
              </p>
              <p style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">
                ${ampm}
              </p>
            </div>
            <div style="flex: 1">
              <h4 style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">
                Patient #${upcoming.patient_id}
              </h4>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                ${upcoming.service_type || "General Care"} • ${date.toLocaleDateString()}
              </p>
              <div style="margin-top: 15px; display: flex; gap: 10px">
                <button class="btn btn-primary btn-small">
                  <i class="fas fa-location-arrow"></i> Navigate
                </button>
                <a href="nurse-portal.html" class="btn btn-outline btn-small">View Details</a>
              </div>
            </div>
          </div>`;
      } else {
        nextContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted)">No upcoming visits scheduled.</p>`;
      }
    }
  } catch (error) {
    console.error("Dashboard Error:", error);
    const statPending = document.getElementById("stat-pending");
    const statCompleted = document.getElementById("stat-completed");
    if (statPending) statPending.innerText = "00";
    if (statCompleted) statCompleted.innerText = "00";
    const nextContainer = document.getElementById("next-visit-container");
    if (nextContainer) {
      nextContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: red">Error loading dashboard data.</p>`;
    }
  }
}
