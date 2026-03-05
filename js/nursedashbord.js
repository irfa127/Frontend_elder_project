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


  await refreshDashboard();

 
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
    if (userRes.status == 200) {
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
            <span class="badge ${(next.status || "").trim().toUpperCase() === 'PENDING' ? 'badge-warning' :
          (next.status || "").trim().toUpperCase() === 'ACCEPTED' ? 'badge-primary' :
            (next.status || "").trim().toUpperCase() === 'ON_THE_WAY' ? 'badge-info" style="background: #8b5cf6;' :
              (next.status || "").trim().toUpperCase() === 'ARRIVED' ? 'badge-info" style="background: #14b8a6;' :
                ((next.status || "").trim().toUpperCase() === 'REJECTED' || (next.status || "").trim().toUpperCase() === 'CANCELLED') ? 'badge-danger' :
                  'badge-success'}" style="text-transform: uppercase;">${(next.status || "").trim().toUpperCase() === "CANCELLED" ? "REJECTED" : next.status.replace(/_/g, " ")}</span>
          </div>
          <div style="margin-left: auto;">
            <a href="nurse-portal.html" class="btn btn-primary btn-small">View All</a>
          </div>
        </div>
      `;
    } else {
      nextVisitContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px; width: 100%;">No upcoming visits scheduled.</p>`;
    }
    // Load reviews panel
    await loadNurseReviews(user.id);

  } catch (e) {
    console.error("Dashboard Refresh Error:", e);
  }
}

async function loadNurseReviews(nurseId) {
  const listEl = document.getElementById("nurse-reviews-list");
  if (!listEl) return;

  try {
    // Fetch all nurse appointments
    const res = await fetch(`${API_URL}/appointments/nurse/${nurseId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (!res.ok) throw new Error("Failed");

    const appointments = await res.json();

    // Only look at COMPLETED ones
    const completed = appointments.filter(
      a => (a.status || "").trim().toUpperCase() === "COMPLETED"
    );

    if (completed.length === 0) {
      listEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No completed visits yet.</p>`;
      return;
    }

    // For each completed appointment, check if a review exists
    const reviewChecks = await Promise.all(
      completed.map(async apt => {
        try {
          const rRes = await fetch(`${API_URL}/reviews/check/${apt.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          if (!rRes.ok) return null;
          const data = await rRes.json();
          return data.exists ? { apt, review: data } : null;
        } catch {
          return null;
        }
      })
    );

    // Filter only those with reviews, then take the latest 5
    const reviewedApts = reviewChecks
      .filter(r => r !== null)
      .sort((a, b) => new Date(b.apt.appointment_date) - new Date(a.apt.appointment_date))
      .slice(0, 5);

    if (reviewedApts.length === 0) {
      listEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No patient reviews yet.</p>`;
      return;
    }

    // Fetch nurse user data to get overall rating
    let overallRating = null;

    try {
      const uRes = await fetch(`${API_URL}/users/${nurseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (uRes.ok) {
        const uData = await uRes.json();
        overallRating = uData.rating ? Number(uData.rating).toFixed(1) : null;
      }
    } catch { }

    // Render each reviewed appointment
    listEl.innerHTML = reviewedApts.map(({ apt }) => {
      const dateStr = new Date(apt.appointment_date).toLocaleDateString();
      const patientName = apt.patient_name || "Patient";

      return `
        <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border);">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=eff6ff&color=3b82f6"
               style="width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;" />
          <div style="flex: 1; min-width: 0;">
            <p style="font-weight: 700; font-size: 0.85rem; margin-bottom: 2px;">${patientName}</p>
            <p style="font-size: 0.72rem; color: var(--text-muted);">${dateStr} • ${apt.service_type || "General Care"}</p>
            <div style="margin-top: 4px;">
              <i class="fas fa-star" style="color: #f59e0b; font-size: 0.8rem;"></i>
              <span style="font-size: 0.78rem; font-weight: 700; color: #1e293b;">Reviewed</span>
            </div>
          </div>
        </div>`;
    }).join("");

    // Show total count note
    if (overallRating) {
      listEl.innerHTML += `<p style="text-align: center; font-size: 0.78rem; color: var(--text-muted); margin-top: 5px;">Overall Rating: <strong style="color: var(--primary);">${overallRating} ★</strong></p>`;
    }

  } catch (e) {
    console.error("Reviews load error:", e);
    listEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Could not load reviews.</p>`;
  }
}

// User role check
// setInterval(() => {
//   const storedUser = localStorage.getItem("user");
//   if (!storedUser) {
//     window.location.href = "login.html";
//     return;
//   }
//   const parsed = JSON.parse(storedUser);
//   if (parsed.role !== "nurse") {
//     window.location.reload();
//   }
// }, 5000);
