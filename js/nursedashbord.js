const API_URL = "http://127.0.0.1:8000";

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return;
  const user = JSON.parse(userStr);

  document.querySelector(".page-title").innerText = `Welcome, ${user.full_name}`;
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
    const userRes = await fetch(`${API_URL}/users/${user.id}?t=${new Date().getTime()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
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
          if (ratingVal >= 4.5) { text = "EXCELLENT"; color = "var(--success)"; }
          else if (ratingVal >= 3.5) { text = "GOOD"; color = "var(--primary)"; }
          else if (ratingVal >= 2.5) { text = "AVERAGE"; color = "#f59e0b"; }
          labelEl.innerText = text;
          labelEl.style.color = color;
        }
      }
    }

    const response = await fetch(`${API_URL}/appointments/nurse/${user.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!response.ok) throw new Error("Failed to fetch appointments");

    const appointments = await response.json();
    document.getElementById("stat-pending").innerText = appointments.filter((a) => a.status === "PENDING").length;
    document.getElementById("stat-completed").innerText = appointments.filter((a) => a.status === "COMPLETED").length;

    const now = new Date();
    const upcoming = appointments
      .filter((a) => a.status !== "COMPLETED")
      .filter((a) => {
        const datePart = a.appointment_date.split('T')[0];
        const [h, m] = a.appointment_time.split(':');
        const apptDate = new Date(`${datePart}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`);
        return apptDate > now;
      })
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    const nextVisitContainer = document.getElementById("next-visit-container");
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const displayDate = new Date(next.appointment_date);
      const curStat = (next.status || "").trim().toUpperCase();

      nextVisitContainer.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center; width: 100%;">
          <div style="background: #eff6ff; padding: 15px; border-radius: 12px; text-align: center; min-width: 80px;">
            <div style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">${displayDate.getDate()}</div>
            <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">${displayDate.toLocaleString("default", { month: "short" })}</div>
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(next.patient_name)}&background=random" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
              <h4 style="font-weight: 700; margin: 0;">${next.patient_name}</h4>
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;"><i class="far fa-clock"></i> ${next.appointment_time} • ${next.service_type || "General Care"}</p>
            <span class="badge ${curStat === 'PENDING' ? 'badge-warning' : curStat === 'ACCEPTED' ? 'badge-primary' : curStat === 'ON_THE_WAY' ? 'badge-info" style="background: #8b5cf6;' : curStat === 'ARRIVED' ? 'badge-info" style="background: #14b8a6;' : (curStat === 'REJECTED' || curStat === 'CANCELLED') ? 'badge-danger' : 'badge-success'}" style="text-transform: uppercase;">
              ${curStat === "CANCELLED" ? "REJECTED" : next.status.replace(/_/g, " ")}
            </span>
          </div>
          <div style="margin-left: auto;"><a href="nurse-portal.html" class="btn btn-primary btn-small">View All</a></div>
        </div>`;
    } else {
      nextVisitContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px; width: 100%;">No upcoming visits scheduled.</p>`;
    }
    await loadNurseReviews(user.id);
  } catch (e) {
    console.error("Dashboard Refresh Error:", e);
  }
}

async function loadNurseReviews(nurseId) {
  const listEl = document.getElementById("nurse-reviews-list");
  if (!listEl) return;
  try {
    const res = await fetch(`${API_URL}/appointments/nurse/${nurseId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    if (!res.ok) throw new Error("Failed");
    const appointments = await res.json();
    const completed = appointments.filter(a => (a.status || "").trim().toUpperCase() === "COMPLETED");
    if (completed.length === 0) { listEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No completed visits yet.</p>`; return; }
    const reviewChecks = await Promise.all(completed.map(async apt => {
      try {
        const rRes = await fetch(`${API_URL}/reviews/check/${apt.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        if (!rRes.ok) return null;
        const data = await rRes.json();
        return data.exists ? { apt, review: data } : null;
      } catch { return null; }
    }));
    const reviewedApts = reviewChecks.filter(r => r !== null).sort((a, b) => new Date(b.apt.appointment_date) - new Date(a.apt.appointment_date)).slice(0, 5);
    if (reviewedApts.length === 0) { listEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No patient reviews yet.</p>`; return; }
    listEl.innerHTML = reviewedApts.map(({ apt }) => `
      <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border);">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient_name || "Patient")}&background=eff6ff&color=3b82f6" style="width: 38px; height: 38px; border-radius: 50%;" />
        <div style="flex: 1;">
          <p style="font-weight: 700; font-size: 0.85rem;">${apt.patient_name || "Patient"}</p>
          <p style="font-size: 0.72rem; color: var(--text-muted);">${new Date(apt.appointment_date).toLocaleDateString()} • ${apt.service_type || "General Care"}</p>
          <div style="margin-top: 4px;"><i class="fas fa-star" style="color: #f59e0b; font-size: 0.8rem;"></i> Reviewed</div>
        </div>
      </div>`).join("");
  } catch (e) {
    console.error("Reviews load error:", e);
  }
}
