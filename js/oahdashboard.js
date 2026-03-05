const API_URL = "https://elder-backend-a7db.vercel.app";

initPage();

async function initPage() {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    window.location.href = "login.html";
    return;
  }
  const user = JSON.parse(userStr);
  if (user.role !== "oah_manager") {
    alert("Access Denied");
    window.location.href = "./main1.html";
    return;
  }

  const headerTitle = document.querySelector("header h1");
  if (headerTitle) headerTitle.innerText = `Welcome, ${user.full_name}`;
  // Manager oda Home fetch
  try {
    const commResponse = await fetch(
      `${API_URL}/communities/manager/${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    if (!commResponse.ok) {
      throw new Error(
        `Failed to fetch community: ${commResponse.status} ${commResponse.statusText}`,
      );
    }
    const communities = await commResponse.json();

    if (!communities || communities.length === 0) {
      document.getElementById("recentInquiriesContainer").innerHTML =
        `<p style="text-align:center;">You haven't set up a community yet. Go to <a href="oah-portal.html">Manage Home</a>.</p>`;
      return;
    }

    const community = communities[0];
    if (headerTitle) headerTitle.innerText = `${community.name} Dashboard`;

    const priceStr = community.pricing || "0";
    const price = parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;


    // Inquiries fetch pannrom

    const inqResponse = await fetch(
      `${API_URL}/inquiries/community/${community.id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    if (inqResponse.status !== 200) {
      throw new Error(`Failed to fetch inquiries: ${inqResponse.status}`);
    }
    const inquiries = await inqResponse.json();

    const pendingCount = inquiries.filter((i) => i.status === "pending").length;
    const acceptedCount = inquiries.filter(
      (i) => i.status === "accepted",
    ).length;

    // for(let i =0;i<inqResponse.length;i++){
    //   if(inqResponse[i].status === "pending"){
    //     let PendingCount=inqResponse[i].length
    //   }
    //   else if(inqResponse[i].status === "accepted"){
    //     let AcceptCount=inqResponse[i].length
    //   }
    // }

    document.getElementById("statResidents").innerText = acceptedCount;
    document.getElementById("statPending").innerText = pendingCount;

    const totalRevenue = acceptedCount * price;
    const revenueEl = document.getElementById("statRevenue");

    if (totalRevenue >= 100000) {
      revenueEl.innerText = `₹${(totalRevenue / 100000).toFixed(2)}L`;
    } else {
      revenueEl.innerText = `₹${totalRevenue.toLocaleString("en-IN")}`;
    }

    const container = document.getElementById("recentInquiriesContainer");
    container.innerHTML = "";

    if (inquiries.length === 0) {
      container.innerHTML = `<p style="text-align: center;">No inquiries found.</p>`;
    } else {
      const recentInqs = inquiries.reverse().slice(0, 5);

      for (const inq of recentInqs) {
        const card = document.createElement("div");
        card.className = "inquiry-card";
        const applicant = inq.applicant || {};
        card.innerHTML = `
              <div class="resident-info">
                <h4>${inq.resident_name || applicant.name} <span style="font-size:0.8em; font-weight:normal; color:#666;">(Age: ${inq.resident_age || "N/A"})</span></h4>
                <p>
                  <i class="fas fa-user-tag"></i> Status: <strong style="color: ${inq.status === "pending" ? "var(--warning)" : "#10b981"}">${inq.status.toUpperCase()}</strong>
                  • <i class="fas fa-calendar-alt"></i> Move-in: ${inq.move_in_date || "TBD"}
                </p>
                <div style="margin-top: 8px; font-size: 0.8rem; color: #64748b">
                   <i class="fas fa-notes-medical"></i> Needs: ${inq.medical_needs || "None listed"}
                </div>
              </div>
              <div class="inquiry-actions">
                <button class="btn btn-outline btn-small" onclick="viewInquiryDetails(${inq.booking_id})">
                  View Details
                </button>
                ${inq.status === "pending"
            ? `<button class="btn btn-primary btn-small" style="background: #059669" onclick="updateInquiryStatus(${inq.booking_id}, 'accepted')">
                    Accept
                   </button>`
            : `<button class="btn btn-outline btn-small" disabled>Accepted</button>`
          }
              </div>
            `;
        container.appendChild(card);
      }
    }

    window.currentInquiries = inquiries;
    
  } catch (e) {
    console.error("Dashboard error:", e);
    const errorMsg = e.message || "Unknown error";
    document.getElementById("recentInquiriesContainer").innerHTML = `
      <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; color: #991b1b; text-align: center;">
        <p style="font-weight: 700; margin-bottom: 10px;"><i class="fas fa-exclamation-triangle"></i> Error Loading Dashboard</p>
        <p style="font-size: 0.9rem; margin-bottom: 10px;">${errorMsg}</p>
        <p style="font-size: 0.85rem; color: #7f1d1d; margin-bottom: 15px;">Please ensure the backend server is running at ${API_URL}</p>
        <button onclick="location.reload()" style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
          Retry
        </button>
      </div>
    `;
  }
}

async function updateInquiryStatus(id, newStatus) {
  if (!confirm(`Mark this inquiry as ${newStatus}?`)) return;
  try {
    const response = await fetch(`${API_URL}/inquiries/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      showToast(`Inquiry marked as ${newStatus}`, "success");
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast("Failed to update status", "error");
    }
  } catch (e) {
    console.error(e);
    showToast("Error updating status: " + e.message, "error");
  }
}

function viewInquiryDetails(id) {
  const inq = window.currentInquiries.find((i) => i.booking_id === id);
  if (!inq) return;
  const applicant = inq.applicant || {};

  alert(`
         Inquiry Details:
         Resident: ${inq.resident_name}
         Age: ${inq.resident_age}
         Applicant: ${applicant.name} (${inq.relation})
         Contact: ${applicant.phone} | ${applicant.email}
         Needs: ${inq.medical_needs}
         Requests: ${inq.special_requests}
       `);
}
