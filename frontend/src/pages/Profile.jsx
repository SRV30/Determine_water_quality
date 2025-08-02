import { useEffect, useState } from "react";
import { getProfile, fetchHealthInfo } from "../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileAndHealth = async () => {
      try {
        const res = await getProfile();
        setUser(res.user);
        toast.success("Profile loaded");

        try {
          const healthRes = await fetchHealthInfo();
          if (healthRes.success && healthRes.healthInfo) {
            setHealthInfo(healthRes.healthInfo);
          } else {
            setHealthInfo(null);
          }
        } catch (err) {
          console.log(err);

          setHealthInfo(null);
        }
      } catch (error) {
        toast.error("Failed to load profile");
        console.log(error);
        navigate("/");
      }
    };
    loadProfileAndHealth();
  }, [navigate]);

  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/;";
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleHealth = () => {
    navigate("/health");
  };

  const handleOCR = () => {
    navigate("/ocr");
  };
  const handleLog = () => {
    navigate("/water-log");
  };
const handleQuality = () => {
    navigate("/water-quality");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 p-4">
      {user ? (
        <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg transform transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
            👋 Welcome, {user.name}
          </h2>

          <div className="space-y-3 text-gray-700 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold">📧 Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">🆔 User ID:</span>
              <span className="text-xs text-gray-500">{user._id}</span>
            </div>
            {healthInfo && (
              <div className="mt-4 p-4 border rounded bg-gray-50 text-gray-700">
                <h3 className="font-semibold mb-2">🩺 Health Information</h3>
                <p>Gender: {healthInfo.gender}</p>
                <p>Age: {healthInfo.age}</p>
                <p>Height: {healthInfo.height} cm</p>
                <p>Weight: {healthInfo.weight} kg</p>
                <p>Phone: {healthInfo.phone}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition mb-4"
          >
            🔒 Logout
          </button>

          <button
            onClick={handleHealth}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            Health Info
          </button>

          <button
            onClick={handleOCR}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            OCR
          </button>
          <button
            onClick={handleLog}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            Water Log
          </button>
          <button
            onClick={handleQuality}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            Determine Water Quality
          </button>
        </div>
      ) : (
        <p className="text-gray-600 text-lg animate-pulse">
          Loading profile...
        </p>
      )}
    </div>
  );
};

export default Profile;
