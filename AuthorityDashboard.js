import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

function AuthorityDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [highRiskAreas, setHighRiskAreas] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const incidentSnapshot = await getDocs(collection(db, "incidents"));
        const reports = incidentSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((report) => !report.resolved);
        setIncidents(reports);
        identifyHighRiskZones(reports);

        const alertSnapshot = await getDocs(collection(db, "emergency_alerts"));
        const alerts = alertSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((alert) => !alert.resolved);
        setEmergencyAlerts(alerts);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const identifyHighRiskZones = (reports) => {
    let clusters = [];

    reports.forEach((incident) => {
      if (!incident.latitude || !incident.longitude) return;
      let foundCluster = false;

      for (let cluster of clusters) {
        const distance = getDistance(cluster.lat, cluster.lng, incident.latitude, incident.longitude);
        if (distance < 500) {
          cluster.count++;
          foundCluster = true;
          break;
        }
      }
      if (!foundCluster) {
        clusters.push({ lat: incident.latitude, lng: incident.longitude, count: 1 });
      }
    });

    setHighRiskAreas(clusters);
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const markResolved = async (id, type) => {
    try {
      await updateDoc(doc(db, type, id), { resolved: true });
      if (type === "incidents") {
        setIncidents(incidents.filter((incident) => incident.id !== id));
      } else if (type === "emergency_alerts") {
        setEmergencyAlerts(emergencyAlerts.filter((alert) => alert.id !== id));
      }
    } catch (error) {
      console.error("Error marking as resolved:", error);
    }
  };

  const emergencyIcon = new L.DivIcon({
    className: "custom-emergency-marker",
    html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%;"></div>'
  });

  return (
    <div>
      <center>
        <h1>Authority Dashboard</h1>
        <p>View reported incidents, emergency alerts, and high-risk areas.</p>
      </center>

      <MapContainer center={[17.3616, 78.4746]} zoom={12} style={{ height: "600px", width: "1200px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {incidents.map((incident) =>
          incident.latitude && incident.longitude ? (
            <Marker key={incident.id} position={[incident.latitude, incident.longitude]}>
              <Popup>
  <b>Type:</b> {incident.incidentType} <br />
  <b>Description:</b> {incident.additionalDetails} <br />
  <b>Location:</b> {incident.incidentPlace} <br />
  <b>Coordinates:</b> {incident.latitude}, {incident.longitude} <br />
  <b>Time:</b> 
  {incident.incidentTime
    ? new Date(incident.incidentTime).toLocaleString()
    : incident.timestamp?.seconds
    ? new Date(incident.timestamp.seconds * 1000).toLocaleString()
    : "Time Not Available"}
  <br />
  {incident.imageUrl && (
    <img
      src={incident.imageUrl}
      alt="Incident"
      style={{ width: "200px", height: "auto", marginTop: "10px" }}
    />
  )}
  <br />
  <button onClick={() => markResolved(incident.id, "incidents")}>
    Mark as Resolved
  </button>
</Popup>

            </Marker>
          ) : null
        )}

        {highRiskAreas.map((area, index) => (
          <Circle
            key={index}
            center={[area.lat, area.lng]}
            radius={500}
            pathOptions={{
              color: area.count >= 5 ? "red" : area.count >= 3 ? "orange" : "yellow",
              fillColor: area.count >= 5 ? "red" : area.count >= 3 ? "orange" : "yellow",
              fillOpacity: 0.4,
            }}
          />
        ))}

        {emergencyAlerts.map((alert) =>
          alert.latitude && alert.longitude ? (
            <Marker key={alert.id} position={[alert.latitude, alert.longitude]} icon={emergencyIcon}>
              <Popup>
  <b>🚨 Emergency Alert</b> <br />
  <b>User:</b> {alert.userId} <br />
  <b>Location:</b> {alert.latitude}, {alert.longitude} <br />
  <b>Time:</b> 
  {alert.incidentTime
    ? new Date(alert.incidentTime).toLocaleString()
    : alert.timestamp?.seconds
    ? new Date(alert.timestamp.seconds * 1000).toLocaleString()
    : "Time Not Available"}
  <br />
  <button onClick={() => markResolved(alert.id, "emergency_alerts")}>
    Mark as Resolved
  </button>
</Popup>

            </Marker>
          ) : null
        )}
      </MapContainer>

      <center>
        <h2>🚨 Emergency Alerts</h2>
        <table border="1">
          <thead>
            <tr>
              <th>User</th>
              <th>Time</th>
              <th>Location</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {emergencyAlerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.userId}</td>
                <td>
                  {alert.incidentTime
                    ? new Date(alert.incidentTime).toLocaleString()
                    : alert.timestamp?.seconds
                    ? new Date(alert.timestamp.seconds * 1000).toLocaleString()
                    : "N/A"}
                </td>
                <td>{alert.latitude}, {alert.longitude}</td>
                <td><button onClick={() => markResolved(alert.id, "emergency_alerts")}>Resolve</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </center>
    </div>
  );
}

export default AuthorityDashboard;
