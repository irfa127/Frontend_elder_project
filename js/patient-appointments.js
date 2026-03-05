const API_URL = "https://elder-backend-a7db.vercel.app";
let isFetching = false;
let lastAppointmentsData = "";

initPage();

async function initPage() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        const user = JSON.parse(userStr);
        fetchMyAppointments(user.id);
        // Refresh every 5 seconds
        setInterval(() => fetchMyAppointments(user.id), 5000);
    } else {
        window.location.href = "login.html";
    }

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true
        });
    }

    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    };

    // Star rating initialization
    document.addEventListener("click", (e) => {
        if (e.target.parentElement && e.target.parentElement.id === "starContainer" && e.target.tagName === "I") {
            const value = parseInt(e.target.getAttribute("data-value"));
            currentRating = value;
            updateStars(value);
        }
    });
}

async function fetchMyAppointments(patientId) {
    if (isFetching) return;
    isFetching = true;

    const container = document.getElementById("myAppointmentsContainer");
    if (!container) return;

    try {
        const response = await fetch(
            `${API_URL}/appointments/patient/${patientId}?t=${new Date().getTime()}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
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
            container.innerHTML = `
                <div style="text-align:center; padding: 40px; background: white; border-radius: 20px;">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"></i>
                    <h3>No appointments yet</h3>
                    <p style="color: var(--text-muted)">Book your first appointment to get started!</p>
                </div>`;
            isFetching = false;
            return;
        }

        appointments.forEach((apt) => {
            const dateStr = new Date(apt.appointment_date).toLocaleDateString(undefined, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            });

            let statusBadge = "";
            const status = (apt.status || "").trim().toUpperCase();
            let statusStyle = "";

            if (status === "PENDING")
                statusBadge = '<span class="badge badge-warning">Pending</span>';
            else if (status === "ACCEPTED")
                statusBadge = '<span class="badge badge-primary">Accepted</span>';
            else if (status === "COMPLETED")
                statusBadge = '<span class="badge badge-success">Completed</span>';
            else if (status === "ON_THE_WAY")
                statusBadge = '<span class="badge badge-info" style="background: #8b5cf6"><i class="fas fa-car-side"></i> On Way</span>';
            else if (status === "ARRIVED")
                statusBadge = '<span class="badge badge-info" style="background: #14b8a6"><i class="fas fa-map-pin"></i> Arrived</span>';
            else if (status === "REJECTED" || status === "CANCELLED")
                statusBadge = '<span class="badge badge-danger">Rejected</span>';
            else
                statusBadge = `<span class="badge badge-info">${status.replace(/_/g, " ")}</span>`;

            // Task Extension: Patient Notification for Rejection
            let rejectionMessage = "";
            if (status === "REJECTED" || status === "CANCELLED") {
                rejectionMessage = `
                    <div style="margin-top: 10px; padding: 10px; background: #fff1f2; border: 1px solid #fecaca; border-radius: 10px; color: #e11d48; font-size: 0.9rem; font-weight: 600;">
                        <i class="fas fa-info-circle"></i> Your appointment was rejected by the nurse.
                    </div>
                `;
            }

            const card = document.createElement("div");
            card.className = "apt-card-attractive";

            const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.nurse_name || "N")}&background=eff6ff&color=3b82f6`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <div style="display: flex; gap: 20px; align-items: center">
                        <img src="${imageUrl}" 
                             style="width: 60px; height: 60px; border-radius: 15px; object-fit: cover; border: 2px solid #f1f5f9;"/>
                        <div>
                            <h2 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 4px;">${apt.nurse_name || "Nurse"}</h2>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">${apt.service_type || "General Care"}</p>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                
                <div style="display: flex; gap: 20px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 15px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px">
                        <i class="far fa-calendar-alt" style="color: #64748b"></i>
                        <span style="font-weight: 600; color: #334155">${dateStr}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px">
                        <i class="far fa-clock" style="color: #64748b"></i>
                        <span style="font-weight: 600; color: #334155">${apt.appointment_time}</span>
                    </div>
                </div>
                
                ${!apt.has_review ? `
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" style="width: 100%; border-radius: 12px; font-weight: 700;" onclick="openReviewModal(${apt.id}, '${(apt.nurse_name || "Nurse").replace(/'/g, "\\'")}')">
                            <i class="fas fa-star"></i> Write Review
                        </button>
                    </div>
                ` : `
                    <div style="margin-bottom: 20px; text-align: center; background: #f0fdf4; padding: 12px; border-radius: 12px; border: 1px solid #dcfce7;">
                        <span style="color: #10b981; font-weight: 700; font-size: 0.9rem;"><i class="fas fa-check-circle"></i> Service Reviewed</span>
                    </div>
                `}
                
                ${rejectionMessage}
                
                ${apt.notes ? `
                    <div style="margin-top: 15px; padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px; font-weight: 700;">Doctor/Nurse Notes:</p>
                        <p style="font-size: 0.95rem; color: #334155; white-space: pre-wrap;">${apt.notes.replace(
                /\[View Medical Report\]\((.*?)\)/g,
                (match, url) => {
                    return `<a href="#" onclick="handleViewReport('${url}', ${apt.id}, ${apt.has_review || false}); return false;" class="btn-link" style="color: var(--primary); font-weight: 700; text-decoration: underline;">View Medical Report <i class="fas fa-external-link-alt"></i></a>`;
                }
            )}</p>
                    </div>
                ` : ""}
            `;
            container.appendChild(card);
        });


    } catch (e) {
        console.error("Fetch Appointments Error:", e);
    } finally {
        isFetching = false;
    }
}

// Booking Logic
let selectedNurseId = null;

async function openBooking() {
    openModal("bookingModal");
    backToNurses();
    await fetchNurses();
}

async function fetchNurses() {
    const container = document.querySelector(".nurse-list-container");
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; padding: 20px;">Loading nurses...</p>';

    try {
        const response = await fetch(`${API_URL}/users/nurses`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) throw new Error("Failed to fetch nurses");

        const nurses = await response.json();
        container.innerHTML = "";

        if (nurses.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 20px;">No nurses available at the moment.</p>';
            return;
        }

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
    } catch (error) {
        console.error("Error fetching nurses:", error);
        container.innerHTML = '<p style="text-align:center; color: red; padding: 20px;">Error loading nurses. Please try again later.</p>';
    }
}

function selectNurse(name, id) {
    document.getElementById("selectedNurseName").innerText = name;
    selectedNurseId = id;
    document.getElementById("stepNurseSelection").style.display = "none";
    document.getElementById("stepScheduling").style.display = "block";
}

function backToNurses() {
    document.getElementById("stepNurseSelection").style.display = "block";
    document.getElementById("stepScheduling").style.display = "none";
}

async function finalizeBooking() {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
        if (typeof showToast !== 'undefined') showToast("Please login first!", "error");
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userStr);
    const date = document.getElementById("bookingDate").value;
    const time = document.querySelector('input[type="time"]').value;

    if (!date || !time) {
        if (typeof showToast !== 'undefined') showToast("Please select date and time", "error");
        return;
    }

    // Task Extension: Prevent Past Date and Time Booking
    const now = new Date();
    const selectedDateTime = new Date(date + "T" + time);

    if (selectedDateTime < now) {
        if (typeof showToast !== 'undefined') showToast("You cannot book an appointment in the past.", "error");
        return;
    }

    if (!selectedNurseId) {
        if (typeof showToast !== 'undefined') showToast("Please select a nurse", "error");
        return;
    }

    const appointmentData = {
        patient_id: user.id,
        nurse_id: selectedNurseId,
        appointment_date: selectedDateTime.toISOString(),
        appointment_time: time,
        service_type: "General Care",
        notes: "New appointment request",
    };

    try {
        const response = await fetch(`${API_URL}/appointments/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(appointmentData),
        });

        if (response.ok) {
            if (typeof showToast !== 'undefined') showToast("Appointment requested successfully!");
            closeModal("bookingModal");
            await fetchMyAppointments(user.id);
            if (typeof refreshUserData !== 'undefined') await refreshUserData(user.id);
        } else {
            const data = await response.json();
            const msg = typeof getErrorMessage !== "undefined" ? getErrorMessage(data.detail) : (data.detail || "Failed to book appointment");
            if (typeof showToast !== 'undefined') showToast(msg, "error");
        }
    } catch (error) {
        console.error("Error booking appointment:", error);
        if (typeof showToast !== 'undefined') showToast("Connection error", "error");
    }
}

// Review Logic
let currentReviewAppointmentId = null;
let currentRating = 5;

function handleViewReport(url, appointmentId, hasReview) {
    window.open(url, "_blank");
    if (!hasReview) {
        openReviewModal(appointmentId);
    }
}

function openReviewModal(appointmentId, nurseName = "the nurse") {
    currentReviewAppointmentId = appointmentId;
    const nameSpan = document.getElementById("nurseNameRating");
    if (nameSpan) nameSpan.innerText = `How was your visit with ${nurseName}?`;

    // Reset stars
    currentRating = 5;
    updateStars(5);

    document.getElementById("reviewText").value = "";
    openModal("reviewModal");
}

function updateStars(value) {
    const starContainer = document.getElementById("starContainer");
    if (!starContainer) return;

    starContainer.querySelectorAll("i").forEach((star) => {
        const starVal = parseInt(star.getAttribute("data-value"));
        if (starVal <= value) {
            star.style.color = "#ffd700";
            star.className = "fas fa-star";
        } else {
            star.style.color = "#e2e8f0";
            star.className = "far fa-star";
        }
    });
}

async function submitReview() {
    if (!currentReviewAppointmentId) return;

    const reviewText = document.getElementById("reviewText").value;

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
                comment: reviewText,
            }),
        });

        if (response.ok) {
            if (typeof showToast !== 'undefined') showToast("Thank you for your feedback!");
            closeModal("reviewModal");
            const user = JSON.parse(localStorage.getItem("user"));
            await fetchMyAppointments(user.id);
        } else {
            const err = await response.json();
            const msg = typeof getErrorMessage !== "undefined" ? getErrorMessage(err.detail) : (err.detail || "Failed to submit review");
            if (typeof showToast !== 'undefined') showToast(msg, "error");
        }
    } catch (e) {
        console.error(e);
        if (typeof showToast !== 'undefined') showToast("Error submitting review", "error");
    }
}


