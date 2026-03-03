const API_URL = "https://elder-backend-a7db.vercel.app";
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

  // Auto refresh every 1 minute
  setInterval(() => {
    fetchAppointments();
  }, 60000);
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

    if (appointments.length === 0) {
      container.innerHTML =
        "<p style='text-align:center; padding: 20px;'>No pending appointments found.</p>";
      return;
    }

    appointments.forEach((apt) => {
      const date = new Date(apt.appointment_date).toLocaleDateString();
      const time = apt.appointment_time;
      const statusClass = apt.status === "COMPLETED" ? "success" : "info";
      const displayStatus = apt.status.replace(/-/g, " ").toUpperCase();

      // Strict Step-by-Step Logic & Time Validation
      const apptDatePart = apt.appointment_date.split('T')[0];
      const [h, m] = apt.appointment_time.split(':');
      const apptDateTime = new Date(`${apptDatePart}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`);
      const now = new Date();
      const isTimeReached = now >= apptDateTime;

      const isPending = apt.status === "PENDING";
      const isOnWay = apt.status === "ON_THE_WAY";
      const isArrived = apt.status === "ARRIVED";
      const isCompleted = apt.status === "COMPLETED";

      let statusButtons = `
        <div class="status-timeline" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
      `;

      // 1. On Way Button Logic
      if (isPending || isOnWay || isArrived || isCompleted) {
        statusButtons += `
          <button class="btn-step ${isOnWay || isArrived || isCompleted ? "completed" : ""}" 
                  ${!isPending ? "disabled" : ""} 
                  onclick="updateStatus(${apt.id}, 'ON_THE_WAY')">
            <i class="fas fa-car-side"></i> On Way
          </button>
        `;
      }

      // 2. Arrived Button Logic
      if (isOnWay || isArrived || isCompleted) {
        statusButtons += `
          <button class="btn-step ${isArrived || isCompleted ? "completed" : ""}" 
                  ${!isOnWay ? "disabled" : ""} 
                  onclick="updateStatus(${apt.id}, 'ARRIVED')">
            <i class="fas fa-map-pin"></i> Arrived
          </button>
        `;
      }

      // 3. Complete Button Logic
      if (isCompleted || (isArrived && isTimeReached)) {
        statusButtons += `
          <button class="btn-step ${isCompleted ? "completed" : ""}" 
                  ${isCompleted ? "disabled" : ""} 
                  onclick="openUploadModal('${apt.id}', 'Patient #${apt.patient_id}')">
            <i class="fas fa-check-circle"></i> Complete
          </button>
        `;
      } else if (isArrived && !isTimeReached) {
        statusButtons += `
          <div style="font-size: 0.8rem; color: #f59e0b; padding: 10px; border: 1px dashed #f59e0b; border-radius: 8px; display: flex; align-items: center; gap: 5px;">
            <i class="fas fa-clock"></i> Completion available at ${apt.appointment_time}
          </div>
        `;
      }

      statusButtons += `</div>`;

      const patientImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient_name)}&background=random`;

      const card = document.createElement("div");
      card.className = "apt-info-card animate-fade";
      card.setAttribute("data-aos", "fade-up");
      card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div style="display: flex; gap: 15px; align-items: center;">
                  <img src="${patientImg}" 
                       onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient_name)}&background=random'"
                       style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover;">
                  <div>
                    <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 5px; color: white;">
                      ${apt.patient_name}
                    </h2>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                      <span class="apt-tag">ID: #${apt.id}</span>
                      <span class="apt-tag"><i class="fas fa-stethoscope"></i> ${apt.service_type || "General Care"}</span>
                    </div>
                  </div>
                </div>
                <span class="badge badge-${statusClass}">${displayStatus}</span>
              </div>

              <div style="display: flex; gap: 30px; margin-bottom: 30px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px">
                  <div style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.1); color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="far fa-calendar-alt"></i>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.7; color: var(--text-muted);">DATE</div>
                    <div style="font-weight: 700; color: #334155;">${date}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px">
                  <div style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.1); color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <i class="far fa-clock"></i>
                  </div>
                  <div>
                    <div style="font-size: 0.75rem; opacity: 0.7; color: var(--text-muted);">TIME</div>
                    <div style="font-weight: 700; color: #334155;">${time}</div>
                  </div>
                </div>
              </div>

              <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 15px; color: #334155;">Update Status</h3>
              ${statusButtons}
            `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "Error loading appointments.";
  }
}

async function updateStatus(id, newStatus) {
  try {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) {
      showToast(`Status updated to ${newStatus}`);
      fetchAppointments();
    } else {
      const err = await response.json();
      showToast(err.detail || "Update failed", "error");
    }
  } catch (e) {
    showToast("Connection error");
  }
}

function openUploadModal(id, name) {
  document.getElementById("targetPatientName").innerText = name;
  document.getElementById("targetAppointmentId").value = id;

  const pid = name.split("#")[1] || "";
  document.getElementById("targetPatientId").value = pid;
  openModal("uploadModal");
}

async function finalizeUpload() {
  const id = document.getElementById("targetAppointmentId").value;
  const patientId = document.getElementById("targetPatientId").value;
  const notes = document.getElementById("uploadNotes").value;

  const bp = document.getElementById("vitalBP").value;
  const hr = document.getElementById("vitalHR").value;
  const sugar = document.getElementById("vitalSugar").value;
  const temp = document.getElementById("vitalTemp").value;

  try {
    if (bp || hr || sugar) {
      const vitalPayload = {
        patient_id: parseInt(patientId),
        nurse_id: currentUser.id,
        blood_pressure: bp,
        heart_rate: hr ? parseInt(hr) : null,
        sugar_level: sugar ? parseInt(sugar) : null,
        temperature: temp,
      };

      const vitalRes = await fetch(`${API_URL}/vitals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(vitalPayload),
      });

      if (!vitalRes.ok) {
        console.error("Vitals Error", await vitalRes.text());
        showToast("Warning: Vitals not saved", "warning");
      }
    }

    let reportNote = notes;

    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        status: "COMPLETED",
        notes: reportNote,
      }),
    });

    if (response.ok) {
      showToast("Health data uploaded & Visit Complete!");
      closeModal("uploadModal");
      fetchAppointments();
    } else {
      showToast("Failed to complete appointment");
    }
  } catch (e) {
    console.error(e);
    showToast("Error processing upload", "error");
  }
}
