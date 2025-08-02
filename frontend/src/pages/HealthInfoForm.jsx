import { useState, useEffect, useMemo } from "react";
import { addHealthInfo, updateHealthInfo, fetchHealthInfo } from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

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
      } finally {
        setLoadingData(false);
      }
    };
    loadHealthInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.gender ||
      !form.age ||
      !form.height ||
      !form.weight ||
      !form.phone
    ) {
      toast.error("Please fill all fields");
      return;
    }
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

  const handleBack = () => {
    navigate("/profile");
  };

  const bmi = useMemo(() => {
    const height = parseFloat(form.height) / 100; // Convert cm to m
    const weight = parseFloat(form.weight);
    if (height > 0 && weight > 0) {
      return (weight / (height * height)).toFixed(2);
    }
    return null;
  }, [form.height, form.weight]);

  const getBMICategory = () => {
    if (!bmi) return { text: "", color: "" };
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { text: "Underweight", color: "text-blue-600" };
    if (bmiValue < 25) return { text: "Normal", color: "text-green-600" };
    if (bmiValue < 30) return { text: "Overweight", color: "text-yellow-600" };
    return { text: "Obese", color: "text-red-600" };
  };

  const formCompletion = useMemo(() => {
    const fields = [
      form.gender,
      form.age,
      form.height,
      form.weight,
      form.phone,
    ];
    const filled = fields.filter((field) => field !== "").length;
    return (filled / fields.length) * 100;
  }, [form]);

  const bmiChartData = useMemo(() => {
    const bmiValue = parseFloat(bmi) || 0;
    return {
      labels: ["Underweight", "Normal", "Overweight", "Obese", "Your BMI"],
      datasets: [
        {
          data: [18.5, 6.4, 5, 10, bmiValue > 0 ? 0.5 : 0], // Small value for BMI needle
          backgroundColor: [
            "rgba(59, 130, 246, 0.6)", // Underweight
            "rgba(34, 197, 94, 0.6)", // Normal
            "rgba(234, 179, 8, 0.6)", // Overweight
            "rgba(239, 68, 68, 0.6)", // Obese
            "rgba(255, 255, 255, 0.9)", // Your BMI (white for visibility)
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(234, 179, 8, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(0, 0, 0, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [bmi]);

  const bmiChartOptions = {
    responsive: true,
    cutout: "70%", // Make it a gauge
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "BMI Gauge" },
      tooltip: {
        filter: (tooltipItem) => tooltipItem.dataIndex !== 4, // Hide tooltip for "Your BMI"
      },
    },
    rotation: -90,
    circumference: 180,
  };

  if (loadingData) {
    return (
      <motion.div
        className="text-center mt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-gray-600 text-lg mt-2">Loading health info...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md transform transition-all duration-300 hover:scale-[1.02]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          🩺 Health Information
        </h2>

        <div className="relative pt-1 mb-4">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Form Completion: {formCompletion.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${formCompletion}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${formCompletion}%` }}
              transition={{ duration: 0.5, type: "spring", stiffness: 80 }}
            />
          </div>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[
            {
              name: "gender",
              type: "select",
              placeholder: "Select Gender",
              options: ["", "male", "female", "other"],
              labels: ["Select Gender", "Male", "Female", "Other"],
            },
            { name: "age", type: "number", placeholder: "Age", min: 0 },
            {
              name: "height",
              type: "number",
              placeholder: "Height (cm)",
              min: 0,
            },
            {
              name: "weight",
              type: "number",
              placeholder: "Weight (kg)",
              min: 0,
            },
            { name: "phone", type: "tel", placeholder: "Phone Number" },
          ].map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index + 0.3 }}
            >
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  required
                >
                  {field.options.map((option, i) => (
                    <option key={option} value={option}>
                      {field.labels[i]}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                  required
                  min={field.min}
                />
              )}
            </motion.div>
          ))}

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
          >
            <input
              type="text"
              value={
                bmi
                  ? `${bmi} (${getBMICategory().text})`
                  : "Enter height and weight to calculate BMI"
              }
              className={`w-full border px-4 py-2 rounded bg-gray-100 ${
                getBMICategory().color
              } cursor-not-allowed shadow-sm`}
              readOnly
            />
            {bmi && (
              <div className="text-sm text-gray-500 mt-1">
                BMI Ranges: Underweight (&lt;18.5), Normal (18.5–24.9),
                Overweight (25–29.9), Obese (≥30)
              </div>
            )}
          </motion.div>

          {bmi && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Doughnut data={bmiChartData} options={bmiChartOptions} />
            </motion.div>
          )}

          <div className="flex space-x-4">
            <motion.button
              type="button"
              onClick={handleBack}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded font-semibold transition shadow-sm"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back
            </motion.button>
            <motion.button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold transition shadow-sm"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              💾 {isUpdate ? "Update Info" : "Save Info"}
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default HealthInfoForm;
