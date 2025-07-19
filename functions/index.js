const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const gmailEmail = functions.config().email.user;
const gmailPassword = functions.config().email.pass;

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});


// Fix: Use `functions.https.onRequest` (Cloud Functions handles the port automatically)
exports.sendEmergencyEmail = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { latitude, longitude } = req.body;
  const authorityEmail = "akshithapuligilla@gmail.com"; // Replace with actual authority email

  const mailOptions = {
    from: `"Emergency Alert" <${gmailEmail}>`,
    to: authorityEmail,
    subject: "🚨 Emergency Alert Triggered",
    text: `An emergency alert has been activated.\n\n🚨 **Location Details:**\n- Latitude: ${latitude}\n- Longitude: ${longitude}\n\nPlease take immediate action.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Emergency email sent successfully.");
    res.status(200).send("Email sent");
  } catch (error) {
    console.error("Error sending emergency email:", error);
    res.status(500).send("Failed to send email");
  }
});
