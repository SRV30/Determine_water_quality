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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 p-4">
      {user ? (
        <div className="bg-white bg-opacity-95 shadow-lg rounded-2xl p-6 sm:p-8 w-full max-w-md sm:max-w-lg border border-blue-100 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-indigo-600 mb-6">
            Welcome, {user.name}
          </h2>

          <div className="space-y-4 text-gray-700 mb-8">
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition duration-200">
              <span className="font-semibold text-sm sm:text-base">Email:</span>
              <span className="text-sm sm:text-base truncate">
                {user.email}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition duration-200">
              <span className="font-semibold text-sm sm:text-base">
                User ID:
              </span>
              <span className="text-xs text-gray-500 truncate">{user._id}</span>
            </div>
            {healthInfo && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100">
                <h3 className="font-semibold text-base sm:text-lg text-indigo-600 mb-3">
                  Health Information
                </h3>
                <div className="space-y-2 text-sm sm:text-base">
                  <p>Gender: {healthInfo.gender}</p>
                  <p>Age: {healthInfo.age}</p>
                  <p>Height: {healthInfo.height} cm</p>
                  <p>Weight: {healthInfo.weight} kg</p>
                  <p>Phone: {healthInfo.phone}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleHealth}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-lg hover:from-blue-600 hover:to-indigo-600 transition duration-200"
            >
              Health Info
            </button>
            <button
              onClick={handleLog}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-lg hover:from-blue-600 hover:to-indigo-600 transition duration-200"
            >
              Water Log
            </button>
            <button
              onClick={handleOCR}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-lg hover:from-blue-600 hover:to-indigo-600 transition duration-200"
            >
              Drinking Bottle Quality Check
            </button>
            <button
              onClick={handleQuality}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-lg hover:from-blue-600 hover:to-indigo-600 transition duration-200"
            >
              Determine Water Quality
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-sm sm:text-base rounded-lg hover:from-red-600 hover:to-red-700 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-lg font-semibold animate-pulse">
          Loading profile...
        </p>
      )}
    </div>
  );
};

export default Profile;
