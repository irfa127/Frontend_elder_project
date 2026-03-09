const API_URL = "http://127.0.0.1:8000";
let isFetching = false;
let lastAppointmentsData = "";

initPage();

async function initPage() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        const user = JSON.parse(userStr);
        fetchMyAppointments(user.id);
        setInterval(() => fetchMyAppointments(user.id), 5000);
    } else {
        window.location.href = "login.html";
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true });
    }

    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    };
}

async function fetchMyAppointments(patientId) {
    if (isFetching) return;
    isFetching = true;
    const container = document.getElementById("myAppointmentsContainer");
    if (!container) return;

    try {
        const response = await fetch(
            `${API_URL}/appointments/patient/${patientId}?t=${new Date().getTime()}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const appointments = await response.json();

        const currentDataStr = JSON.stringify(appointments);
        if (currentDataStr === lastAppointmentsData) {
            isFetching = false;
            return;
        }
        lastAppointmentsData = currentDataStr;
        container.innerHTML = "";

        if (appointments.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 40px; background: white; border-radius: 20px;"><i class="fas fa-calendar-times" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"></i><h3>No appointments yet</h3></div>`;
            isFetching = false;
            return;
        }

        appointments.forEach((apt) => {
            const dateStr = new Date(apt.appointment_date).toLocaleDateString(undefined, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            });

            const status = (apt.status || "").trim().toUpperCase();
            let statusBadge = "";
            if (status === "PENDING") statusBadge = '<span class="badge badge-warning">Pending</span>';
            else if (status === "ACCEPTED") statusBadge = '<span class="badge badge-primary">Accepted</span>';
            else if (status === "COMPLETED") statusBadge = '<span class="badge badge-success">Completed</span>';
            else if (status === "ON_THE_WAY") statusBadge = '<span class="badge badge-info" style="background: #8b5cf6">On Way</span>';
            else if (status === "ARRIVED") statusBadge = '<span class="badge badge-info" style="background: #14b8a6">Arrived</span>';
            else if (status === "REJECTED" || status === "CANCELLED") statusBadge = '<span class="badge badge-danger">Rejected</span>';

            const card = document.createElement("div");
            card.className = "apt-card-attractive";
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <div style="display: flex; gap: 20px; align-items: center">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(apt.nurse_name || "N")}&background=eff6ff&color=3b82f6" style="width: 60px; height: 60px; border-radius: 15px;"/>
                        <div><h2 style="font-size: 1.1rem; font-weight: 800;">${apt.nurse_name || "Nurse"}</h2><p style="color: var(--text-muted);">${apt.service_type || "General Care"}</p></div>
                    </div>
                    ${statusBadge}
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 15px;">
                    <span><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                    <span><i class="far fa-clock"></i> ${apt.appointment_time}</span>
                </div>
                ${!apt.has_review ? `<button class="btn btn-primary" style="width: 100%; border-radius: 12px; font-weight: 700;" onclick="openReviewModal(${apt.id}, '${(apt.nurse_name || "Nurse").replace(/'/g, "\\'")}')"><i class="fas fa-star"></i> Write Review</button>` : `<div style="text-align: center; background: #f0fdf4; padding: 12px; border-radius: 12px; color: #10b981; font-weight: 700;">Service Reviewed</div>`}
                ${(status === "REJECTED" || status === "CANCELLED") ? `<div style="margin-top: 10px; padding: 10px; background: #fff1f2; color: #e11d48; border-radius: 10px;">Rejected by Nurse</div>` : ""}
                ${apt.notes ? `<div style="margin-top: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 10px;"><p style="font-weight: 700;">Notes:</p><p>${apt.notes}</p></div>` : ""}`;
            container.appendChild(card);
        });
    } catch (e) { console.error(e); } finally { isFetching = false; }
}

async function fetchNurses() {
    const container = document.querySelector(".nurse-list-container");
    if (!container) return;
    try {
        const response = await fetch(`${API_URL}/users/nurses`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        const nurses = await response.json();
        container.innerHTML = "";
        nurses.forEach((nurse) => {
            const card = document.createElement("div");
            card.className = "nurse-card";
            card.style.cssText = "display: flex; gap: 20px; align-items: center; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 15px;";

            card.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(nurse.full_name)}&background=eff6ff&color=3b82f6" 
                     style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
                <div style="flex: 1">
                    <h4 style="font-weight: 800">${nurse.full_name}</h4>
                    <p style="font-size: 0.85rem; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <span>Registered Nurse</span>
                        <span style="color: #f59e0b"><i class="fas fa-star"></i> ${nurse.rating || "NEW"}</span>
                    </p>
                    <p style="font-size: 0.8rem; color: #64748b;">${nurse.address || "Location N/A"}</p>
                </div>
                <button class="btn btn-primary" onclick="selectNurse('${nurse.full_name.replace(/'/g, "\\'")}', ${nurse.id})">
                    Book Now
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) { container.innerHTML = "Error loading nurses."; }
}

let selectedNurseId = null;
function selectNurse(name, id) {
    document.getElementById("selectedNurseName").innerText = name;
    selectedNurseId = id;
    document.getElementById("stepNurseSelection").style.display = "none";
    document.getElementById("stepScheduling").style.display = "block";
}

async function finalizeBooking() {
    const user = JSON.parse(localStorage.getItem("user"));
    const date = document.getElementById("bookingDate").value;
    const time = document.querySelector('input[type="time"]').value;
    if (!date || !time) { showToast("Please select date and time", "error"); return; }

    const selectedDateTime = new Date(date + "T" + time);
    if (selectedDateTime < new Date()) { showToast("You cannot book an appointment in the past.", "error"); return; }
    if (!selectedNurseId) { showToast("Please select a nurse", "error"); return; }

    const appointmentData = { patient_id: user.id, nurse_id: selectedNurseId, appointment_date: selectedDateTime.toISOString(), appointment_time: time, service_type: "General Care", notes: "Request" };

    try {
        const response = await fetch(`${API_URL}/appointments/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: JSON.stringify(appointmentData),
        });

        if (response.ok) {
            showToast("Appointment requested successfully!");
            closeModal("bookingModal");
            fetchMyAppointments(user.id);
        } else {
            const data = await response.json();
            const msg = typeof getErrorMessage !== "undefined" ? getErrorMessage(data.detail) : (data.detail || "Failed to book");
            showToast(msg, "error");
        }
    } catch (error) {
        console.error(error);
        showToast("Connection error", "error");
    }
}

// Reviewing
let currentReviewAppointmentId = null;
let currentRating = 5;
function openReviewModal(appointmentId, nurseName = "the nurse") {
    currentReviewAppointmentId = appointmentId;
    document.getElementById("nurseNameRating").innerText = `How was your visit with ${nurseName}?`;
    currentRating = 5; updateStars(5);
    document.getElementById("reviewText").value = "";
    openModal("reviewModal");
}
function updateStars(value) {
    document.querySelectorAll("#starContainer i").forEach((star) => {
        const starVal = parseInt(star.getAttribute("data-value"));
        star.style.color = (starVal <= value) ? "#ffd700" : "#e2e8f0";
        star.className = (starVal <= value) ? "fas fa-star" : "far fa-star";
    });
}
async function submitReview() {
    try {
        const response = await fetch(`${API_URL}/reviews/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: JSON.stringify({ appointment_id: currentReviewAppointmentId, rating: currentRating, comment: document.getElementById("reviewText").value }),
        });
        if (response.ok) { showToast("Thank you for feedback!"); closeModal("reviewModal"); fetchMyAppointments(JSON.parse(localStorage.getItem("user")).id); }
    } catch (e) { showToast("Error submitting review", "error"); }
}

function backToNurses() { document.getElementById("stepNurseSelection").style.display = "block"; document.getElementById("stepScheduling").style.display = "none"; }
async function openBooking() { openModal("bookingModal"); backToNurses(); await fetchNurses(); }
