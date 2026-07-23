import { useState, useRef } from "react";
import axios from "../api/axios";
import { useAlert } from "../context/ConfirmContext";

export default function VoicePrayerInput() {
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [listening, setListening] = useState(false);
  const alert = useAlert();

  const recognitionRef = useRef(null);

  // 🎤 START VOICE
  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert({
        title: "❌ Not Supported",
        message: "Voice input is not supported in this browser.",
        buttonText: "OK"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // you can change to "ta-IN"
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    // 🧠 RESULT HANDLING
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      // SIMPLE INTELLIGENT PARSING
      if (text.toLowerCase().includes("name")) {
        const parts = text.split("request");

        setName(parts[0].replace("name", "").trim());
        setRequest(parts[1] ? parts[1].trim() : "");
      } else {
        setRequest(text);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // 🛑 STOP VOICE
  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  // 📤 SUBMIT PRAYER
  const submitPrayer = async () => {
    const payload = {
      requests: [
        {
          name,
          request
        }
      ]
    };

    const res = await axios.post("/prayer/format", payload);

    alert({
      title: "✅ Success",
      message: "Prayer submitted successfully!",
      buttonText: "OK"
    });
    console.log(res.data);
  };

  return (
    <div className="p-[20px]">
      <h2>🙏 Prayer Voice Input</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Prayer Request"
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        rows={5}
        cols={40}
      />

      <br /><br />

      {/* 🎤 VOICE BUTTON */}
      <button onClick={listening ? stopVoice : startVoice}>
        {listening ? "🛑 Stop Listening" : "🎤 Speak Prayer"}
      </button>

      <br /><br />

      {/* 📤 SUBMIT */}
      <button onClick={submitPrayer}>
        Submit Prayer Request
      </button>
    </div>
  );
}
