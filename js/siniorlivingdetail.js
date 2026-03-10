const API_URL = "https://elder-backend-a7db.vercel.app";

initPage();

async function initPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const container = document.getElementById("detailsContainer");

    if (!id) {
        container.innerHTML = "<p>Community not specified.</p>";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/communities/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) throw new Error("Failed to fetch details");
        const comm = await response.json();

        container.innerHTML = `
          <div class="glass-card" style="margin-bottom: 24px;">
             <img src="${comm.image_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800'}" 
                  style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;" />
             <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 10px;">${comm.name}</h2>
             <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 20px;">
                <i class="fas fa-map-marker-alt"></i> ${comm.location}
             </p>
             <p style="line-height: 1.6; margin-bottom: 20px;">
                ${comm.description}
             </p>

             <div style="display: flex; gap: 20px; padding: 20px; background: rgba(59, 130, 246, 0.05); border-radius: 12px; margin-bottom: 30px;">
                <div>
                   <span style="display: block; font-size: 0.85rem; color: var(--text-muted);">Pricing</span>
                   <strong style="font-size: 1.2rem; color: var(--primary);">${comm.pricing || comm.price_range || comm.price || "Contact for pricing"}</strong>
                </div>
                <div>
                   <span style="display: block; font-size: 0.85rem; color: var(--text-muted);">Contact</span>
                   <strong style="font-size: 1.2rem; color: var(--text-main);">${(comm.phone && comm.phone.trim() !== "") ? comm.phone : "Contact Admin"}</strong>
                </div>
             </div>

             <button class="btn btn-primary" onclick="openInquiryModal(${comm.id})">
                <i class="fas fa-paper-plane"></i> Send Inquiry
             </button>
          </div>
        `;


        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);

        }

    } catch (e) {
        container.innerHTML = "<p style='color: red;'>Error loading details.</p>";
    }

    // Inquiry Form Handler
    const inquiryForm = document.getElementById("inquiryForm");
    if (inquiryForm) {
        inquiryForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const userStr = localStorage.getItem("user");
            if (!userStr) { alert("Please login first"); return; }
            const user = JSON.parse(userStr);

            const communityId = document.getElementById("communityId").value;
            const data = {
                community_id: communityId,
                patient_id: user.id,
                applicant_name: user.full_name,
                applicant_email: user.email,
                applicant_phone: user.phone_number || "N/A",
                resident_name: document.getElementById("residentName").value,
                resident_age: document.getElementById("residentAge").value,
                relation: document.getElementById("relation").value,
                medical_needs: document.getElementById("medicalNeeds").value,
                status: "pending"
            };

            try {
                const res = await fetch(`${API_URL}/inquiries/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    alert("Inquiry Sent Successfully! The manager will contact you.");
                    closeModal("inquiryModal");
                } else {
                    const err = await res.json();
                    const msg = typeof getErrorMessage !== "undefined"
                        ? getErrorMessage(err.detail)
                        : (typeof err.detail === "object" ? JSON.stringify(err.detail) : err.detail);
                    alert("Failed: " + (msg || "Server Error"));
                }
            } catch (ex) {
                console.error(ex);
                alert("Connection Error");
            }
        });
    }
}

function openInquiryModal(id) {
    document.getElementById("communityId").value = id;
    openModal("inquiryModal");
}
