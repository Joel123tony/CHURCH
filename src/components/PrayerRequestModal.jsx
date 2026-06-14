import { useState } from "react";
import axios from "axios";

export default function PrayerRequestModal({
  isOpen,
  onClose,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [request, setRequest] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "https://church-rp0n.onrender.com/api/prayer-requests",
        {
          name,
          phone,
          request,
        }
      );

      const message = `
🇬🇧 ENGLISH

Methodist Tamil Church Members

Prayer Request

Name: ${name}

Request:
${request}

Please uphold this request in your prayers.

────────────────────

🇮🇳 தமிழ்

மெதடிஸ்ட் தமிழ் திருச்சபை உறுப்பினர்கள்

ஜெபக் கோரிக்கை

பெயர்: ${name}

கோரிக்கை:
${request}

இந்த ஜெபக் கோரிக்கைக்காக ஜெபிக்குமாறு அன்புடன் கேட்டுக்கொள்கிறோம்.
`;

      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      alert("Prayer Request Submitted");

      setName("");
      setPhone("");
      setRequest("");

      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to submit request");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg">

        <h2 className="text-2xl font-bold text-primary mb-6">
          Prayer Request
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Name"
            required
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="text"
            placeholder="Phone Number (Optional)"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <textarea
            rows="5"
            placeholder="Prayer Request"
            required
            value={request}
            onChange={(e) =>
              setRequest(e.target.value)
            }
            className="w-full border rounded-xl p-3"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-3 rounded-xl"
            >
              Submit Request
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 border rounded-xl"
            >
              Close
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}