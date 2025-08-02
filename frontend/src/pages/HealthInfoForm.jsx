import { useState, useEffect } from "react";
import { addHealthInfo, updateHealthInfo, fetchHealthInfo } from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const HealthInfoForm = () => {
  const [form, setForm] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    phone: "",
  });

  const [loadingData, setLoadingData] = useState(true);
  const [isUpdate, setIsUpdate] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadHealthInfo = async () => {
      setLoadingData(true);
      try {
        const res = await fetchHealthInfo();
        if (res.success && res.healthInfo) {
          setForm({
            gender: res.healthInfo.gender || "",
            age: res.healthInfo.age || "",
            height: res.healthInfo.height || "",
            weight: res.healthInfo.weight || "",
            phone: res.healthInfo.phone || "",
          });
          setIsUpdate(true);
        }
      } catch (error) {
        console.log(error);

        setIsUpdate(false);
      }
      setLoadingData(false);
    };

    loadHealthInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isUpdate) {
        await updateHealthInfo(form);
        toast.success("Health info updated!");
      } else {
        await addHealthInfo(form);
        toast.success("Health info saved!");
      }
      navigate("/profile");
      console.log(isUpdate ? "Updating form:" : "Adding form:", form);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  if (loadingData) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-600">Loading health info...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-gradient-to-tr from-white to-gray-50 shadow-xl rounded-lg border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        🩺 Health Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <input
          name="age"
          type="number"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          min={0}
        />

        <input
          name="height"
          type="number"
          placeholder="Height (cm)"
          value={form.height}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          min={0}
        />

        <input
          name="weight"
          type="number"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          min={0}
        />

        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition cursor-pointer"
        >
          💾 {isUpdate ? "Update Info" : "Save Info"}
        </button>
      </form>
    </div>
  );
};

export default HealthInfoForm;
