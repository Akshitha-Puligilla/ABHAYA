import React, { useState } from "react";
import { db, storage, auth } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "./ReportIncident.css";

// Component for location search using Nominatim API
function LocationSearch({ setLatitude, setLongitude, setMapCenter }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setLatitude(parseFloat(lat));
        setLongitude(parseFloat(lon));
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setError(null);
      } else {
        setError("Location not found");
      }
    } catch (err) {
      setError("Error searching location");
    }
  };

  return (
    <div className="location-search">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setError(null);
        }}
        placeholder="Search for a location"
      />
      <button onClick={handleSearch}>Search</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

// Updates map center
function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// Allows user to select a location on the map
function LocationSelector({ setLatitude, setLongitude, markerPosition }) {
  useMapEvents({
    click(e) {
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    },
  });
  return markerPosition ? <Marker position={markerPosition} /> : null;
}

function ReportIncident() {
  const [incidentType, setIncidentType] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [incidentPlace, setIncidentPlace] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [user] = useAuthState(auth);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to report an incident");
      return;
    }

    if (!incidentType || !incidentTime || !incidentPlace || !latitude || !longitude) {
      setError("Please fill all required fields and select a location.");
      return;
    }

    try {
      let uploadedImageUrl = "";
      if (image) {
        const imageRef = ref(storage, `incident_images/${user.uid}_${Date.now()}`);
        await uploadBytes(imageRef, image);
        uploadedImageUrl = await getDownloadURL(imageRef);
        setImageUrl(uploadedImageUrl);
      }

      await addDoc(collection(db, "incidents"), {
        userId: user.uid,
        incidentType,
        incidentTime,
        incidentPlace,
        additionalDetails,
        latitude,
        longitude,
        imageUrl: uploadedImageUrl,
        timestamp: new Date(),
      });

      setSuccessMessage("Incident reported successfully!");
      setIncidentType("");
      setIncidentTime("");
      setIncidentPlace("");
      setAdditionalDetails("");
      setLatitude(null);
      setLongitude(null);
      setImage(null);
    } catch (err) {
      setError("Failed to report incident. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSuccessMessage("Successfully logged out.");
    } catch (err) {
      setError("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="report-incident-container">
      <div className="report-incident-box">
        <header className="report-incident-header"><center>ABHAYA</center></header>
        <div className="report-incident-form-container">
          <h2 className="form-title"><center>Report an Incident</center></h2>
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Type of Incident:</label>
              <input type="text" value={incidentType} onChange={(e) => setIncidentType(e.target.value)} required className="input-field" />
            </div>
            <div className="form-group">
              <label>Time of Incident:</label>
              <input type="datetime-local" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} required className="input-field" />
            </div>
            <div className="form-group">
              <label>Place of Incident:</label>
              <input type="text" value={incidentPlace} onChange={(e) => setIncidentPlace(e.target.value)} required className="input-field" />
            </div>
            <div className="form-group">
              <label>Additional Details:</label>
              <textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} className="input-field" />
            </div>
            <div className="form-group">
              <label>Upload Image:</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="input-field" />
            </div>
            <div className="location-group">
              <h3>Select Incident Location</h3>
              <LocationSearch setLatitude={setLatitude} setLongitude={setLongitude} setMapCenter={setMapCenter} />
              <MapContainer center={mapCenter} zoom={12} style={{ height: "300px", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeMapView center={mapCenter} />
                <LocationSelector setLatitude={setLatitude} setLongitude={setLongitude} markerPosition={latitude && longitude ? [latitude, longitude] : null} />
              </MapContainer>
              {latitude && longitude && <p>Selected Location: {latitude}, {longitude}</p>}
            </div>
            <button type="submit" className="submit-button">Submit Incident Report</button>
          </form>
          <div className="logout-container">
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIncident;
