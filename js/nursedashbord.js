const API_URL = "https://elder-backend-a7db.vercel.app";

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;
  const user = JSON.parse(userStr);

  document.querySelector(".page-title").innerText =
    `Welcome, ${user.full_name}`;

  const avatarEl = document.getElementById("nurse-avatar");
  if (avatarEl) {
    avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=3b82f6&color=fff`;
  }

  // Initial load
  await refreshDashboard();

  // Auto-refresh every 1 minute
  setInterval(refreshDashboard, 60000);
}

async function refreshDashboard() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;
  const user = JSON.parse(userStr);

  try {
    const userRes = await fetch(
      `${API_URL}/users/${user.id}?t=${new Date().getTime()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    if (userRes.ok) {
      const userData = await userRes.json();

      const ratingEl = document.getElementById("nurse-rating-value");
      if (ratingEl) {
        const ratingVal = userData.rating ? Number(userData.rating) : 0;
        ratingEl.innerHTML = `${ratingVal.toFixed(1)} <small style="font-size: 1rem"><i class="fas fa-star"></i></small>`;

        const labelEl = ratingEl.nextElementSibling;
        if (labelEl) {
          let text = "POOR";
          let color = "var(--danger)";

          if (ratingVal >= 4.5) {
            text = "EXCELLENT";
            color = "var(--success)";
          } else if (ratingVal >= 3.5) {
            text = "GOOD";
            color = "var(--primary)";
          } else if (ratingVal >= 2.5) {
            text = "AVERAGE";
            color = "#f59e0b";
          }

          labelEl.innerText = text;
          labelEl.style.color = color;
        }
      }
    }

    // Fetch Nurse Appointments
    const response = await fetch(`${API_URL}/appointments/nurse/${user.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch appointments");

    const appointments = await response.json();

    const pending = appointments.filter((a) => a.status === "PENDING").length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;

    document.getElementById("stat-pending").innerText = pending;
    document.getElementById("stat-completed").innerText = completed;

    const now = new Date();

    // Filter logic: NOT COMPLETED and future datetime
    const upcoming = appointments
      .filter((a) => a.status !== "COMPLETED")
      .filter((a) => {
        const datePart = a.appointment_date.split('T')[0];
        const [h, m] = a.appointment_time.split(':');
        const apptDate = new Date(`${datePart}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`);
        return apptDate > now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.appointment_date.split('T')[0]}T${a.appointment_time.split(':')[0].padStart(2, '0')}:${a.appointment_time.split(':')[1].padStart(2, '0')}:00`);
        const dateB = new Date(`${b.appointment_date.split('T')[0]}T${b.appointment_time.split(':')[0].padStart(2, '0')}:${b.appointment_time.split(':')[1].padStart(2, '0')}:00`);
        return dateA - dateB;
      });

    const nextVisitContainer = document.getElementById("next-visit-container");

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const displayDate = new Date(next.appointment_date);

      nextVisitContainer.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center; width: 100%;">
          <div style="background: #eff6ff; padding: 15px; border-radius: 12px; text-align: center; min-width: 80px;">
            <div style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">${displayDate.getDate()}</div>
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">${displayDate.toLocaleString("default", { month: "short" })}</div>
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(next.patient_name)}&background=random"
                   style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
              <h4 style="font-weight: 700; margin: 0;">${next.patient_name}</h4>
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">
              <i class="far fa-clock"></i> ${next.appointment_time} • ${next.service_type || "General Care"}
            </p>
            <span class="badge badge-warning" style="text-transform: uppercase;">${next.status.replace(/_/g, " ")}</span>
          </div>
          <div style="margin-left: auto;">
            <a href="nurse-portal.html" class="btn btn-primary btn-small">View All</a>
          </div>
        </div>
      `;
    } else {
      nextVisitContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px; width: 100%;">No upcoming visits scheduled.</p>`;
    }
  } catch (e) {
    console.error("Dashboard Refresh Error:", e);
  }
}

// User role check
setInterval(() => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    window.location.href = "login.html";
    return;
  }
  const parsed = JSON.parse(storedUser);
  if (parsed.role !== "nurse") {
    window.location.reload();
  }
}, 5000);
