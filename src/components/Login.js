import React, { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import ReportIncident from "./ReportIncident";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isAuthorityLogin, setIsAuthorityLogin] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  // 🚨 Emergency Alert Function
  const handleEmergencyAlert = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          alert(`🚨 Emergency Alert Sent!\nLocation: ${latitude}, ${longitude}`);

          try {
            // ✅ Store Emergency Alert in Firestore (`mails` Collection) - Triggers Email Automatically
            await addDoc(collection(db, "mails"), {
              to: ["akshithapuligilla@gmail.com"], // Authority email (must be an array)
              subject: "🚨 Emergency Alert!",
              message: {
                text: "An emergency has been triggered!",
                location: `📍 Latitude: ${latitude}, Longitude: ${longitude}`,
                time: `⏰ Time: ${new Date().toISOString()}`
              },
              alertTitle: "Emergency!!",
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              timestamp: new Date(), // Firestore Timestamp
            });

            console.log("Emergency alert saved in 'mails' collection! Email should be sent automatically.");
          } catch (error) {
            console.error("Error saving emergency alert:", error);
          }
        },
        (error) => {
          alert("⚠️ Location access denied. Please enable GPS.");
        }
      );
    } else {
      alert("❌ Geolocation is not supported by this browser.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Google Sign-In failed. Try again.");
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      setError("Anonymous Sign-In failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Registration successful! You can now log in.");
        setError("");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        if (isAuthorityLogin) {
          const authorityEmails = ["akshithapuligilla@gmail.com"];
          if (authorityEmails.includes(userCredential.user.email)) {
            const querySnapshot = await getDocs(collection(db, "incidents"));
            const reports = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const counts = {};
            reports.forEach((incident) => {
              const place = incident.incidentPlace || incident.location || "Unknown";
              counts[place] = (counts[place] || 0) + 1;
            });

            const highRiskAreas = Object.entries(counts)
              .filter(([place, count]) => count > 3)
              .map(([place, count]) => ({ place, count }));

            navigate("/dashboard", { state: { highRiskAreas } });
          } else {
            setError("Unauthorized access. Only authorities can log in.");
          }
        } else {
          navigate("/report");
        }
      }
    } catch (err) {
      setError("Error: " + err.message);
      setSuccessMessage("");
    }
  };

  if (user && !isAuthorityLogin) {
    return <ReportIncident />;
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-left">
          <h1 className="app-title">ABHAYA</h1>
          <h2>{isAuthorityLogin ? "Authority Login" : isRegister ? "Sign Up" : "Login"}</h2>
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
          <form onSubmit={handleSubmit} className="form">
            <input type="email" name="email" placeholder="Email" required className="input-field" />
            <input type="password" name="password" placeholder="Password" required className="input-field" />
            <button type="submit" className="login-button">
              {isRegister ? "Register" : "Login"}
            </button>
          </form>
          <p className="toggle-text" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already have an account? Login here" : "Don't have an account? Register"}
          </p>
          <button onClick={handleGoogleSignIn} className="google-sign-in">Sign in with Google</button>
          <button onClick={handleAnonymousSignIn} className="guest-sign-in">Continue as Guest</button>
          <p className="toggle-text" onClick={() => setIsAuthorityLogin(!isAuthorityLogin)}>
            {isAuthorityLogin ? "Back to User Login" : "Login as Authority"}
          </p>
          <button onClick={handleEmergencyAlert} className="emergency-button">🚨 Emergency Alert</button>
        </div>
        <div className="login-right">
          <img src="/images/womenSafety.png" alt="Women Safety" className="login-image" />
        </div>
      </div>
    </div>
  );
}

export default Login;
