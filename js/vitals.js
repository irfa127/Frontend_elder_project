initPage();

async function initPage() {
  const grid = document.getElementById("vitalsGrid");
  const historyBody = document.getElementById("vitalsHistoryBody");

  const userStr = localStorage.getItem("user");
  console.log("User from localStorage:", userStr);

  if (!userStr) {
    console.error("No user found in localStorage");
    if (grid) grid.innerHTML = "<p>Please log in first.</p>";
    return;
  }
  const user = JSON.parse(userStr);
  console.log("Parsed user:", user);

  try {
    const response = await fetch(`https://elder-backend-a7db.vercel.app/vitals/patient/${user.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    console.log("Response status:", response.status);
    const vitals = await response.json();
    console.log("Vitals data:", vitals);

    if (grid) grid.innerHTML = "";
    if (historyBody) historyBody.innerHTML = "";

    if (vitals.length === 0) {
      if (grid) grid.innerHTML = "<p>No vitals recorded yet.</p>";
      const analysisText = document.getElementById("aiAnalysisText");
      if (analysisText) analysisText.innerText = "No data available for analysis.";
      return;
    }

    const analysisText = document.getElementById("aiAnalysisText");
    if (analysisText) analysisText.innerText = "Based on your recent uploads, monitoring continues correctly.";


    vitals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));


    const measurements = [];
    vitals.forEach(record => {
      const date = record.created_at;
      if (record.blood_pressure) {
        measurements.push({ vital_type: "Blood Pressure", value: record.blood_pressure, unit: "mmHg", date: date, color: "#3b82f6", icon: "fa-heartbeat", bg: "#eff6ff" });
      }
      if (record.heart_rate) {
        measurements.push({ vital_type: "Heart Rate", value: record.heart_rate, unit: "BPM", date: date, color: "#ef4444", icon: "fa-running", bg: "#fef2f2" });
      }
      if (record.sugar_level) {
        measurements.push({ vital_type: "Blood Sugar", value: record.sugar_level, unit: "mg/dL", date: date, color: "#10b981", icon: "fa-tint", bg: "#f0fdf4" });
      }
      if (record.temperature) {
        measurements.push({ vital_type: "Temperature", value: record.temperature, unit: "°F", date: date, color: "#f97316", icon: "fa-thermometer-half", bg: "#fff7ed" });
      }
    });


    const latestByType = {};
    measurements.forEach(m => {
      if (!latestByType[m.vital_type]) {
        latestByType[m.vital_type] = m;
      }
    });


    for (let type in latestByType) {
      const v = latestByType[type];
      const card = `
              <div class="vital-card">
                <div class="vital-header">
                  <div class="vital-icon" style="background: ${v.bg}; color: ${v.color}">
                    <i class="fas ${v.icon}"></i>
                  </div>
                  <span class="trend-badge" style="background: #f8fafc; color: #64748b">Latest</span>
                </div>
                <div class="vital-value">${v.value} <small class="vital-unit">${v.unit}</small></div>
                <div style="margin-top: 5px; color: var(--text-muted); font-size: 0.9rem; font-weight: 600;">
                  ${v.vital_type}
                </div>
                 <div style="margin-top: 5px; text-align: right; color: ${v.color}; font-size: 0.75rem; font-weight: 700;">
                  ${new Date(v.date).toLocaleDateString()}
                </div>
              </div>
            `;
      if (grid) grid.insertAdjacentHTML('beforeend', card);
    }


    measurements.slice(0, 15).forEach(m => {
      const dateObj = new Date(m.date);
      const row = `
                <tr style="border-bottom: 1px solid #f1f5f9">
                    <td style="padding: 20px 15px; font-weight: 600">${dateObj.toLocaleDateString()}</td>
                    <td style="padding: 20px 15px; color: #64748b">${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style="padding: 20px 15px">${m.vital_type}</td>
                    <td style="padding: 20px 15px; font-weight: 700">${m.value}</td>
                    <td style="padding: 20px 15px">${m.unit}</td>
                </tr>
            `;
      if (historyBody) historyBody.insertAdjacentHTML('beforeend', row);
    });

  } catch (e) {
    console.error("Error fetching vitals:", e);
    if (grid) grid.innerHTML = "<p>Error loading vitals: " + e.message + "</p>";
  }
}
