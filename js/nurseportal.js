const API_URL = "http://127.0.0.1:8000";
let currentUser = null;

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html";
    return;
  }
  currentUser = JSON.parse(userStr);
  if (currentUser.role !== "nurse") {
    alert("Access Denied: Nurse area only");
    window.location.href = "/frontend/index.html";
    return;
  }

  await fetchAppointments();
}

async function fetchAppointments() {
  const container = document.getElementById("appointmentsContainer");
  try {
    const response = await fetch(
      `${API_URL}/appointments/nurse/${currentUser.id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    if (!response.ok) {
      const err = await response.json();
      const msg =
        typeof getErrorMessage !== "undefined"
          ? getErrorMessage(err.detail)
          : typeof err.detail === "object"
            ? JSON.stringify(err.detail)
            : err.detail;
      throw new Error(msg || "Server Error");
    }

    const appointments = await response.json();
    container.innerHTML = "";

    const seenIds = new Set();
    const uniqueAppointments = appointments.reverse().filter(apt => {
      if (seenIds.has(apt.id)) return false;
      seenIds.add(apt.id);
      return true;
    }).reverse();

    if (uniqueAppointments.length === 0) {
      container.innerHTML =
        "<p style='text-align:center; padding: 20px;'>No pending appointments found.</p>";
      return;
    }
    // later i will see this function because little bit doubt this function 
    uniqueAppointments.forEach((apt) => {
      const date = new Date(apt.appointment_date).toLocaleDateString();
      const time = apt.appointment_time;
      const curStatus = (apt.status || "").trim().toUpperCase();
      const displayStatus = curStatus.replace(/-/g, " ");

      let statusClass = "info";
      let statusStyle = "";

      if (curStatus === "PENDING") statusClass = "warning";
      else if (curStatus === "ACCEPTED") statusClass = "primary";
      else if (curStatus === "ON_THE_WAY") { statusClass = "info"; statusStyle = "background: #8b5cf6;"; }
      else if (curStatus === "ARRIVED") { statusClass = "info"; statusStyle = "background: #14b8a6;"; }
      else if (curStatus === "COMPLETED") statusClass = "success";
      else if (curStatus === "REJECTED" || curStatus === "CANCELLED") statusClass = "danger";

      const isPending = curStatus === "PENDING";
      const isAccepted = curStatus === "ACCEPTED";
      const isOnWay = curStatus === "ON_THE_WAY";
      const isArrived = curStatus === "ARRIVED";
      const isCompleted = curStatus === "COMPLETED";
      const isRejected = curStatus === "REJECTED" || curStatus === "CANCELLED";

      let statusButtons = `<div class="status-timeline" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">`;

      if (isRejected) {
        statusButtons += `<span style="color: #ef4444; font-weight: 800; text-transform: uppercase;"><i class="fas fa-times-circle"></i> Rejected</span>`;
      } else {
        if (isPending) {
          statusButtons += `
            <button class="btn-step" style="background: #3b82f6; border-color: #3b82f6; width: auto; padding: 8px 15px;" onclick="updateStatus(this, ${apt.id}, 'ACCEPTED')">Accept</button>
            <button class="btn-step" style="background: #ef4444; border-color: #ef4444; width: auto; padding: 8px 15px;" onclick="updateStatus(this, ${apt.id}, 'CANCELLED')">Reject</button>`;
        }
        if (isAccepted || isOnWay || isArrived || isCompleted) {
          statusButtons += `<button class="btn-step ${isOnWay || isArrived || isCompleted ? "completed" : ""}" ${!isAccepted ? "disabled" : ""} onclick="updateStatus(this, ${apt.id}, 'ON_THE_WAY')">On Way</button>`;
        }
        if (isOnWay || isArrived || isCompleted) {
          statusButtons += `<button class="btn-step ${isArrived || isCompleted ? "completed" : ""}" ${!isOnWay ? "disabled" : ""} onclick="updateStatus(this, ${apt.id}, 'ARRIVED')">Arrived</button>`;
        }
        if (isArrived || isCompleted) {
          statusButtons += `<button class="btn-step ${isCompleted ? "completed" : ""}" ${isCompleted ? "disabled" : ""} onclick="openUploadModal(this, '${apt.id}', 'Patient #${apt.patient_id}')">${isCompleted ? "Completed" : "Complete Visit"}</button>`;
        }
      }
      statusButtons += `</div>`;

      const patientImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient_name)}&background=random`;
      const card = document.createElement("div");
      card.className = "apt-info-card animate-fade";
      card.setAttribute("data-aos", "fade-up");
      card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div style="display: flex; gap: 15px; align-items: center;">
                  <img src="${patientImg}" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover;">
                  <div><h2 style="font-size: 1.5rem; font-weight: 800; color: white;">${apt.patient_name}</h2><span class="apt-tag">ID: #${apt.id}</span></div>
                </div>
                <span class="badge badge-${statusClass}" style="${statusStyle}">${displayStatus}</span>
              </div>
              <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                <div><div style="font-size: 0.75rem; color: var(--text-muted);">DATE</div><div style="font-weight: 700;">${date}</div></div>
                <div><div style="font-size: 0.75rem; color: var(--text-muted);">TIME</div><div style="font-weight: 700;">${time}</div></div>
              </div>
              ${statusButtons}`;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = "Error loading appointments.";
  }
}

async function updateStatus(btn, id, newStatus) {
  if (btn) btn.disabled = true;
  try {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      showToast(`Status updated to ${newStatus}`);
      fetchAppointments();
    } else {
      const err = await response.json();
      const msg = typeof getErrorMessage !== "undefined" ? getErrorMessage(err.detail) : (err.detail || "Update failed");
      showToast(msg, "error");
      if (btn) btn.disabled = false;
    }
  } catch (e) {
    showToast("Connection error", "error");
    if (btn) btn.disabled = false;
  }
}

let lastTriggerBtn = null;


function openUploadModal(btn, id, name) {
  lastTriggerBtn = btn;
  document.getElementById("targetPatientName").innerText = name;
  document.getElementById("targetAppointmentId").value = id;
  document.getElementById("targetPatientId").value = name.split("#")[1] || "";
  openModal("uploadModal");
}

async function finalizeUpload() {
  const id = document.getElementById("targetAppointmentId").value;
  const patientId = document.getElementById("targetPatientId").value;
  const bp = document.getElementById("vitalBP").value;
  const hr = document.getElementById("vitalHR").value;
  const sugar = document.getElementById("vitalSugar").value;
  const temp = document.getElementById("vitalTemp").value;
  const notes = document.getElementById("uploadNotes").value;

  try {
    if (bp || hr || sugar) {
      await fetch(`${API_URL}/vitals/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ patient_id: parseInt(patientId), nurse_id: currentUser.id, blood_pressure: bp, heart_rate: hr ? parseInt(hr) : null, sugar_level: sugar ? parseInt(sugar) : null, temperature: temp }),
      });
    }
    const res = await fetch(`${API_URL}/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ status: "COMPLETED", notes }),
    });
    if (res.ok) { closeModal("uploadModal"); fetchAppointments(); }
  } catch (e) { console.error(e); }
}
