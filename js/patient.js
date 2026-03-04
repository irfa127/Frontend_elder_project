const API_URL = "https://elder-backend-a7db.vercel.app";
let isRequestInProgress = false;
let currentUser = null;

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html";
    return;
  }
  currentUser = JSON.parse(userStr);

  if (currentUser.role !== "patient") {
    document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f8fafc; font-family:sans-serif;">
                <div style="background:white; padding:40px; border-radius:20px; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1); text-align:center; max-width:400px;">
                    <div style="width:60px; height:60px; background:#fee2e2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
                         <i class="fas fa-user-lock" style="color:#ef4444; font-size:24px;"></i>
                    </div>
                    <h2 style="color:#1e293b; margin-bottom:10px;">Session Changed</h2>
                    <p style="color:#64748b; line-height:1.6; margin-bottom:25px;">
                        A different user (${currentUser.role.replace("_", " ")}) is currently logged in. Please log in again to access your dashboard.
                    </p>
                    <button onclick="localStorage.clear(); window.location.href='login.html'" 
                        style="width:100%; padding:14px; background:#3b82f6; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:700; font-size:1rem;">
                        Go to Login
                    </button>
                </div>
            </div>
          `;
    return;
  }

  document.getElementById("user-greeting").innerHTML =
    `Hello, ${currentUser.full_name} <i class="fas fa-hand-peace"></i>`;

  refreshDashboard(currentUser.id);

  setInterval(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "login.html";
      return;
    }
    const parsed = JSON.parse(storedUser);
    if (parsed.id !== currentUser.id) {
      console.warn("Session changed, reloading...");
      window.location.reload();
      return;
    }
    refreshDashboard(currentUser.id);
  }, 5000);

  // Star rating events
  document.addEventListener("click", (e) => {
    if (e.target.parentElement && e.target.parentElement.id === "starContainer" && e.target.tagName === "I") {
      const value = parseInt(e.target.getAttribute("data-value"));
      currentRating = value;
      const stars = e.target.parentElement.querySelectorAll("i");
      stars.forEach(s => {
        const v = parseInt(s.getAttribute("data-value"));
        if (v <= value) {
          s.style.color = "#ffd700";
          s.className = "fas fa-star";
        } else {
          s.style.color = "#e2e8f0";
          s.className = "far fa-star";
        }
      });
    }
  });
}

let allAppointments = [];
let currentRating = 5;
let currentReviewAppointmentId = null;

async function refreshDashboard(userId) {
  if (isRequestInProgress) return;
  isRequestInProgress = true;

  try {
    // ── 1. Appointments (for Recent Visits only) ──────────────────────
    const aptResponse = await fetch(
      `${API_URL}/appointments/patient/${userId}?t=${new Date().getTime()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (aptResponse.ok) {
      const appointments = await aptResponse.json();
      allAppointments = appointments;

      // Show completed appointments in Recent Visits
      const completedApts = appointments
        .filter(a => (a.status || "").trim().toUpperCase() === "COMPLETED")
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

      const visitList = document.getElementById("recentVisitsList");
      if (visitList) {
        if (completedApts.length === 0) {
          visitList.innerHTML = `<li style="text-align: center; color: var(--text-muted)">No recent visits found.</li>`;
        } else {
          visitList.innerHTML = completedApts.map(apt => {
            const nurseName = (apt.nurse_name || "Nurse Visit").replace(/'/g, "&#39;");
            const rateBtn = !apt.has_review
              ? `<button class="btn btn-primary btn-small" onclick="openReviewModal(${apt.id}, '${nurseName}')" style="padding: 5px 10px; font-size: 0.7rem;">Rate</button>`
              : `<span style="font-size: 0.7rem; color: #10b981; font-weight: 700;"><i class="fas fa-star"></i> Rated</span>`;
            return `
            <li style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border);">
              <div style="width: 45px; height: 45px; background: #f0fdf4; color: #10b981; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i class="fas fa-check-circle"></i>
              </div>
              <div style="flex: 1">
                <p style="font-weight: 700; font-size: 0.9rem">${apt.nurse_name || "Nurse Visit"}</p>
                <p style="font-size: 0.75rem; color: var(--text-muted)">${new Date(apt.appointment_date).toLocaleDateString()} • ${apt.service_type || "General Care"}</p>
              </div>
              ${rateBtn}
            </li>`;
          }).join("");
        }
      }
    }

    // ── 2. Vitals ─────────────────────────────────────────────────────
    const vitalsResponse = await fetch(`${API_URL}/vitals/patient/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (vitalsResponse.ok) {
      const vitals = await vitalsResponse.json();
      if (vitals.length > 0) {
        const latest = vitals[0];

        document.getElementById("dash-bp").innerText =
          latest.blood_pressure || "--";
        document.getElementById("dash-hr").innerHTML =
          `${latest.heart_rate || "--"} <small style="font-size: 1rem">BPM</small>`;
        document.getElementById("dash-sugar").innerHTML =
          `${latest.sugar_level || "--"} <small style="font-size: 1rem">mg/dL</small>`;

        document.getElementById("reportsList").innerHTML = `
          <li style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--border);">
            <i class="fas fa-file-medical-alt" style="color: var(--primary); font-size: 1.5rem"></i>
            <div>
              <p style="font-weight: 700; font-size: 0.9rem">Health Summary</p>
              <p style="font-size: 0.75rem; color: var(--text-muted)">Latest reading recorded</p>
            </div>
          </li>
        `;
      }
    }

    // ── 3. OAH Notice: Only show if an inquiry is accepted ───────────
    const oahContainer = document.getElementById("oahNoticeContainer");
    if (oahContainer) {
      oahContainer.innerHTML = ""; // clear before re-checking
    }

    const inqResponse = await fetch(`${API_URL}/inquiries/patient/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (inqResponse.ok) {
      const inquiries = await inqResponse.json();
      const acceptedInq = inquiries.find((i) => i.status === "accepted");

      if (acceptedInq && oahContainer) {
        const comm = acceptedInq.old_age_home || {};
        const applicant = acceptedInq.applicant || {};
        const applicantName = applicant.name || currentUser.full_name || "Applicant";
        const oahEmail = comm.email || "N/A";

        oahContainer.style.marginBottom = "0";
        oahContainer.innerHTML = `
          <div class="glass-card animate-slide" style="background: #ecfdf5; border-color: #a7f3d0; display: flex; gap: 20px; align-items: center; margin-bottom: 0;">
            <img src="${comm.image_url || "https://via.placeholder.com/100"}" 
                 style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover; flex-shrink: 0;" />
            <div style="flex: 1;">
              <h3 style="color: #065f46; font-weight: 800; margin-bottom: 5px;">
                <i class="fas fa-check-circle"></i> Your Old Age Home booking was successful!
              </h3>
              <p style="color: #047857; font-size: 0.95rem;">
                <strong>${comm.name || "Community"}</strong> has accepted your request. They will contact you shortly.
              </p>
              <p style="margin-top: 5px; color: #047857; font-size: 0.9rem;">
                <strong>Applicant:</strong> ${applicantName}
              </p>
              <p style="margin-top: 3px; color: #047857; font-size: 0.9rem;">
                <i class="fas fa-envelope"></i> <strong>OAH Email:</strong> ${oahEmail}
              </p>
              <p style="margin-top: 3px; color: #047857; font-size: 0.9rem;">
                <i class="fas fa-phone-alt"></i> ${comm.phone || "Contact Admin"}
              </p>
            </div>
          </div>
        `;
      }
      // If no accepted inquiry, oahContainer remains empty — nothing is shown
    }

  } catch (e) {
    console.error("Auto-refresh error:", e);
  } finally {
    isRequestInProgress = false;
  }
}

function openRecordsModal() {
  const container = document.getElementById("allRecordsContainer");
  if (!container) return;

  if (allAppointments.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px;">No records found.</p>`;
  } else {
    container.innerHTML = allAppointments.sort((a, b) => b.id - a.id).map(apt => {
      const statusUp = (apt.status || "").trim().toUpperCase();
      let statusColor = "#64748b";
      if (statusUp === "COMPLETED") statusColor = "#10b981";
      if (statusUp === "PENDING") statusColor = "#f59e0b";
      const nurseName = (apt.nurse_name || "Nurse visit").replace(/'/g, "&#39;");

      const actionBtn = (statusUp === "COMPLETED" && !apt.has_review)
        ? `<button class="btn btn-primary btn-small" onclick="openReviewModal(${apt.id}, '${nurseName}')">Rate Visit</button>`
        : apt.has_review
          ? `<span style="color: #10b981; font-weight: 700; font-size: 0.9rem;"><i class="fas fa-star"></i> Rated</span>`
          : "";

      return `
            <div style="background: #f8fafc; border-radius: 15px; padding: 20px; margin-bottom: 15px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="font-weight: 800; color: #1e293b;">${apt.nurse_name || "Nurse visit"}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 4px 0;">
                        <i class="far fa-calendar-alt"></i> ${new Date(apt.appointment_date).toLocaleDateString()} at ${apt.appointment_time}
                    </p>
                    <span style="font-size: 0.75rem; font-weight: 700; color: ${statusColor}; text-transform: uppercase;">
                        ${apt.status}
                    </span>
                </div>
                <div>${actionBtn}</div>
            </div>`;
    }).join("");
  }

  openModal("recordsModal");
}

function openReviewModal(appointmentId, nurseName) {
  currentReviewAppointmentId = appointmentId;
  const nameSpan = document.getElementById("nurseNameRating");
  if (nameSpan) nameSpan.innerText = nurseName;

  // Reset stars
  currentRating = 5;
  const stars = document.querySelectorAll("#starContainer i");
  stars.forEach(s => {
    s.style.color = "#ffd700";
    s.className = "fas fa-star";
  });

  document.getElementById("reviewText").value = "";

  openModal("reviewModal");
}

async function submitReview() {
  if (!currentReviewAppointmentId) return;

  const comment = document.getElementById("reviewText").value;

  try {
    const response = await fetch(`${API_URL}/reviews/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        appointment_id: currentReviewAppointmentId,
        rating: currentRating,
        comment: comment
      })
    });

    if (response.ok) {
      showToast("Thank you for your rating!");
      closeModal("reviewModal");
      closeModal("recordsModal");
      refreshDashboard(currentUser.id);
    } else {
      const err = await response.json();
      showToast(err.detail || "Failed to submit rating", "error");
    }
  } catch (e) {
    console.error(e);
    showToast("Connection error", "error");
  }
}
