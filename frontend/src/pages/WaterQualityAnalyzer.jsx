import { useState, useMemo } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const WATER_QUALITY_STANDARDS = {
  WHO: {
    ph: {
      quality_mapping: [
        { range: [0, 6.5], status: "Acidic", color: "text-red-600" },
        { range: [6.5, 8.5], status: "Optimal", color: "text-green-600" },
        { range: [8.5, 14], status: "Alkaline", color: "text-red-600" },
      ],
      unit: "",
      impact: "Affects taste and corrosivity",
    },
    hardness: {
      min: 60,
      max: 500,
      unit: "mg/L",
      impact: "Affects taste and scaling",
    },
    solids: { min: 50, max: 1000, unit: "mg/L", impact: "Taste and health" },
    chloramines: {
      min: 0,
      max: 4,
      unit: "mg/L",
      impact: "Disinfectant safety",
    },
    sulfate: {
      min: 0,
      max: 250,
      unit: "mg/L",
      impact: "Laxative effect at high levels",
    },
    conductivity: {
      min: 100,
      max: 2000,
      unit: "µS/cm",
      impact: "Indicates dissolved ions",
    },
    organic_carbon: {
      min: 0,
      max: 10,
      unit: "mg/L",
      impact: "Organic contamination",
    },
    trihalomethanes: {
      min: 0,
      max: 0.1,
      unit: "mg/L",
      impact: "Potential carcinogen",
    },
    turbidity: {
      min: 0,
      max: 5,
      unit: "NTU",
      impact: "Affects clarity and safety",
    },
  },
  FSSAI: {
    ph: {
      quality_mapping: [
        { range: [0, 6.5], status: "Acidic", color: "text-red-600" },
        { range: [6.5, 8.5], status: "Optimal", color: "text-green-600" },
        { range: [8.5, 14], status: "Alkaline", color: "text-red-600" },
      ],
      unit: "",
      impact: "Affects taste and corrosivity",
    },
    hardness: {
      min: 30,
      max: 200,
      unit: "mg/L",
      impact: "Affects taste and scaling",
    },
    solids: { min: 30, max: 500, unit: "mg/L", impact: "Taste and health" },
    chloramines: {
      min: 0,
      max: 4,
      unit: "mg/L",
      impact: "Disinfectant safety",
    },
    sulfate: {
      min: 0,
      max: 200,
      unit: "mg/L",
      impact: "Laxative effect at high levels",
    },
    conductivity: {
      min: 50,
      max: 1000,
      unit: "µS/cm",
      impact: "Indicates dissolved ions",
    },
    organic_carbon: {
      min: 0,
      max: 10,
      unit: "mg/L",
      impact: "Organic contamination",
    },
    trihalomethanes: {
      min: 0,
      max: 0.1,
      unit: "mg/L",
      impact: "Potential carcinogen",
    },
    turbidity: {
      min: 0,
      max: 1,
      unit: "NTU",
      impact: "Affects clarity and safety",
    },
  },
};

const OVERALL_WATER_QUALITY_GUIDE = {
  optimal: {
    icon: "✅",
    message: "Water is safe for drinking based on provided parameters.",
    color: "text-green-700",
  },
  needs_attention: {
    icon: "⚠️",
    message:
      "Some parameters are outside optimal ranges. Proceed with caution.",
    color: "text-yellow-700",
  },
  unsuitable: {
    icon: "❌",
    message:
      "Water is not safe for drinking due to critical parameter violations.",
    color: "text-red-700",
  },
};

const PARAMETER_GUIDANCE = [
  {
    name: "ph",
    guide:
      "Use pH test strips (₹100–₹500) or a pH meter (₹500–₹2000). Dip strip in water and compare color to chart, or use meter for precise reading.",
  },
  {
    name: "hardness",
    guide:
      "Use a hardness test kit (₹200–₹1000). Add drops to water sample until color changes; count drops to calculate (mg/L CaCO₃).",
  },
  {
    name: "solids",
    guide:
      "Use a TDS meter (₹300–₹1500). Dip meter in water to measure dissolved solids (mg/L). Check bottled water labels for TDS.",
  },
  {
    name: "chloramines",
    guide:
      "Use a chlorine/chloramine test kit (₹500–₹2000). Dip strip or add reagents, compare color. May need to order online.",
  },
  {
    name: "sulfate",
    guide:
      "Requires a sulfate test kit (₹1000–₹3000) or lab testing. Check bottled water labels or municipal reports.",
  },
  {
    name: "conductivity",
    guide:
      "Use a conductivity meter (₹500–₹2000, often with TDS meter). Dip in water to measure (µS/cm).",
  },
  {
    name: "organic_carbon",
    guide:
      "Requires lab testing (₹5000+) or specialized TOC kits. Check municipal or bottled water reports.",
  },
  {
    name: "trihalomethanes",
    guide:
      "Requires lab testing (₹5000+). Not feasible at home; use municipal water reports.",
  },
  {
    name: "turbidity",
    guide:
      "Check visually (cloudy = high turbidity) or use a turbidity meter (₹2000+). Clear water suggests low turbidity (NTU).",
  },
];

const WaterQualityAnalyzer = () => {
  const [form, setForm] = useState({
    ph: "",
    hardness: "",
    solids: "",
    chloramines: "",
    sulfate: "",
    conductivity: "",
    organic_carbon: "",
    trihalomethanes: "",
    turbidity: "",
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [overallQuality, setOverallQuality] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState("FSSAI");
  const [loading, setLoading] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Validate pH to be within 0–14
    if (name === "ph" && value !== "") {
      const numValue = parseFloat(value);
      if (numValue < 0 || numValue > 14) {
        toast.error("pH value must be between 0 and 14.");
        return;
      }
    }
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const analyzeWaterQuality = () => {
    setLoading(true);
    setAnalysisResults(null);
    setOverallQuality(null);

    const filteredData = {};
    let hasValues = false;
    Object.entries(form).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        const numValue = parseFloat(value);
        // Additional pH validation
        if (key === "ph" && (numValue < 0 || numValue > 14)) {
          toast.error(
            "Invalid pH value. Please enter a value between 0 and 14."
          );
          setLoading(false);
          return;
        }
        if (!isNaN(numValue) && numValue >= 0) {
          filteredData[key] = numValue;
          hasValues = true;
        }
      }
    });

    if (!hasValues) {
      toast.error("Please enter at least one water quality parameter.");
      setLoading(false);
      return;
    }

    const currentStandards = WATER_QUALITY_STANDARDS[selectedStandard];
    const results = {};
    let issuesFound = false;
    let warningFound = false;

    Object.entries(filteredData).forEach(([key, value]) => {
      const standard = currentStandards[key];
      if (standard) {
        let status = "Optimal";
        let message = "Within recommended range.";
        let colorClass = "text-green-600";
        if (standard.quality_mapping) {
          const mapped = standard.quality_mapping.find(
            (map) => value >= map.range[0] && value <= map.range[1]
          );
          if (mapped) {
            status = mapped.status;
            colorClass = mapped.color;
            if (status === "Acidic" || status === "Alkaline") {
              issuesFound = true;
            }
          } else {
            status = "Unknown";
            colorClass = "text-gray-600";
          }
        } else if (value < standard.min) {
          status = "Low";
          message = `Below recommended minimum (${standard.min} ${standard.unit}).`;
          colorClass = "text-orange-600";
          warningFound = true;
        } else if (value > standard.max) {
          status = "High";
          message = `Exceeds recommended maximum (${standard.max} ${standard.unit}).`;
          colorClass = "text-red-600";
          issuesFound = true;
        }
        results[key] = {
          value,
          unit: standard.unit,
          status,
          message,
          impact: standard.impact,
          colorClass,
          standardRange: standard.quality_mapping
            ? standard.quality_mapping
                .map((m) => `${m.range[0]}-${m.range[1]}: ${m.status}`)
                .join(", ")
            : `${standard.min}-${standard.max} ${standard.unit}`,
        };
      }
    });

    results.safety = {
      value: null,
      unit: "",
      status: issuesFound ? "Unsafe" : warningFound ? "Uncertain" : "Safe",
      message: issuesFound
        ? "Water is likely unsafe due to parameter violations."
        : warningFound
        ? "Water safety uncertain due to some parameters being outside optimal ranges."
        : "Water is likely safe based on provided parameters.",
      colorClass: issuesFound
        ? "text-red-600"
        : warningFound
        ? "text-yellow-600"
        : "text-green-600",
      impact: "Indicates overall drinkability",
      standardRange: "Based on parameter compliance",
    };

    setAnalysisResults(results);
    if (issuesFound) {
      setOverallQuality(OVERALL_WATER_QUALITY_GUIDE.unsuitable);
    } else if (warningFound) {
      setOverallQuality(OVERALL_WATER_QUALITY_GUIDE.needs_attention);
    } else {
      setOverallQuality(OVERALL_WATER_QUALITY_GUIDE.optimal);
    }
    setLoading(false);
  };

  const clearForm = () => {
    setForm({
      ph: "",
      hardness: "",
      solids: "",
      chloramines: "",
      sulfate: "",
      conductivity: "",
      organic_carbon: "",
      trihalomethanes: "",
      turbidity: "",
    });
    setAnalysisResults(null);
    setOverallQuality(null);
  };

  // New printResults function
  const printResults = () => {
    if (!analysisResults) {
      toast.error("No analysis results to print.");
      return;
    }
    const printContent = `
      <h2>Water Quality Analysis Report (${selectedStandard} Standards)</h2>
      <h3>Overall Quality: ${overallQuality.message}</h3>
      <ul>
        ${Object.entries(analysisResults)
          .map(
            ([key, result]) => `
              <li>
                <strong>${
                  key === "ph"
                    ? "pH"
                    : key
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")
                }:</strong> ${result.value || "N/A"} ${result.unit} (${
              result.status
            })<br/>
                Message: ${result.message}<br/>
                Impact: ${result.impact}<br/>
                Standard Range: ${result.standardRange}
              </li>
            `
          )
          .join("")}
      </ul>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    `;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Water Quality Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #2b6cb0; }
            h3 { color: ${
              overallQuality.color.includes("green")
                ? "#2f855a"
                : overallQuality.color.includes("yellow")
                ? "#b7791f"
                : "#c53030"
            }; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 10px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const chartData = useMemo(() => {
    if (!analysisResults) return null;
    const labels = Object.keys(analysisResults).map((key) =>
      key === "ph"
        ? "pH"
        : key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
    );
    const values = Object.values(analysisResults).map(
      (result) => result.value || 0
    );
    const colors = Object.values(analysisResults).map((result) =>
      result.colorClass.includes("green")
        ? "rgba(34, 197, 94, 0.6)"
        : result.colorClass.includes("red")
        ? "rgba(239, 68, 68, 0.6)"
        : "rgba(234, 179, 8, 0.6)"
    );
    const borderColors = Object.values(analysisResults).map((result) =>
      result.colorClass.includes("green")
        ? "rgba(34, 197, 94, 1)"
        : result.colorClass.includes("red")
        ? "rgba(239, 68, 68, 1)"
        : "rgba(234, 179, 8, 1)"
    );
    return {
      labels,
      datasets: [
        {
          label: `Water Quality Parameters (${selectedStandard} Standards)`,
          data: values,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };
  }, [analysisResults, selectedStandard]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Water Quality Analysis (${selectedStandard} Standards)`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const key = Object.keys(analysisResults)[context.dataIndex];
            const result = analysisResults[key];
            return `${
              key === "ph"
                ? "pH"
                : key
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
            }: ${result.value} ${result.unit} (${result.status})`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Value (mg/L, µS/cm, NTU, or unitless)" },
      },
      x: { title: { display: true, text: "Parameters" } },
    },
  };

  const formCompletion = useMemo(() => {
    const fields = Object.values(form);
    const filled = fields.filter((field) => field !== "").length;
    return (filled / fields.length) * 100;
  }, [form]);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-700 mb-6">
          💧 Water Quality Analyzer
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
          Enter water quality parameters to analyze safety based on WHO or FSSAI
          standards.
        </p>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => setShowGuidance(!showGuidance)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base mb-4"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {showGuidance
              ? "Hide Guidance"
              : "Show Guidance on Measuring Parameters"}
          </motion.button>
          {showGuidance && (
            <motion.div
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="font-semibold text-blue-800 mb-2">
                How to Measure Parameters
              </h4>
              <ul className="text-sm text-blue-700 space-y-2">
                {PARAMETER_GUIDANCE.map((item) => (
                  <li key={item.name}>
                    <strong>
                      {item.name === "ph"
                        ? "pH"
                        : item.name
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                      :
                    </strong>{" "}
                    {item.guide}
                  </li>
                ))}
                <li>
                  <strong>Where to Buy:</strong> Check Amazon, Flipkart, or
                  local pharmacies for pH strips, TDS meters, and hardness kits.
                  For lab testing, contact certified water testing labs.
                </li>
              </ul>
            </motion.div>
          )}
        </motion.div>

        <div className="relative pt-1 mb-6">
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

        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex gap-4 mb-4 justify-center">
            <motion.select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
            >
              <option value="FSSAI">FSSAI Standards</option>
              <option value="WHO">WHO Standards</option>
            </motion.select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                name: "ph",
                label: "pH",
                unit: "",
                placeholder: "6.5–8.5",
                step: "0.1",
              },
              {
                name: "hardness",
                label: "Hardness",
                unit: "mg/L",
                placeholder: "30–200",
              },
              {
                name: "solids",
                label: "Solids (TDS)",
                unit: "mg/L",
                placeholder: "30–500",
              },
              {
                name: "chloramines",
                label: "Chloramines",
                unit: "mg/L",
                placeholder: "0–4",
                step: "0.1",
              },
              {
                name: "sulfate",
                label: "Sulfate",
                unit: "mg/L",
                placeholder: "0–200 (Lab)",
              },
              {
                name: "conductivity",
                label: "Conductivity",
                unit: "µS/cm",
                placeholder: "50–1000",
              },
              {
                name: "organic_carbon",
                label: "Organic Carbon",
                unit: "mg/L",
                placeholder: "0–10 (Lab)",
                step: "0.1",
              },
              {
                name: "trihalomethanes",
                label: "Trihalomethanes",
                unit: "mg/L",
                placeholder: "0–0.1 (Lab)",
                step: "0.01",
              },
              {
                name: "turbidity",
                label: "Turbidity",
                unit: "NTU",
                placeholder: "0–1",
                step: "0.1",
              },
            ].map((field, index) => (
              <motion.div
                key={field.name}
                className="space-y-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.3 }}
              >
                <label className="block text-xs font-medium text-gray-600">
                  {field.label} {field.unit && `(${field.unit})`}{" "}
                  {field.name === "organic_carbon" ||
                  field.name === "trihalomethanes"
                    ? "(Lab)"
                    : ""}
                </label>
                <input
                  type="number"
                  name={field.name}
                  step={field.step || "1"}
                  min="0"
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                  aria-label={field.label}
                />
              </motion.div>
            ))}
          </div>
          <div className="flex gap-3 mt-4 justify-center">
            <motion.button
              onClick={analyzeWaterQuality}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              disabled={loading}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              🧠 Analyze Water Quality
            </motion.button>
            <motion.button
              onClick={printResults} // Changed to printResults
              className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              disabled={loading || !analysisResults}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              🖨️ Print Results
            </motion.button>
            <motion.button
              onClick={clearForm}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              disabled={loading}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              🗑️ Clear Form
            </motion.button>
          </div>
        </motion.div>

        {loading && (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="mt-2 text-blue-600 font-semibold text-sm sm:text-base">
              🔍 Analyzing water quality...
            </p>
          </motion.div>
        )}

        {overallQuality && (
          <motion.div
            className={`mb-6 p-4 rounded-lg shadow-md ${overallQuality.color
              .replace("text-", "bg-")
              .replace("-700", "-50")} border ${overallQuality.color
              .replace("text-", "border-")
              .replace("-700", "-200")}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3
              className={`text-xl font-bold ${overallQuality.color} flex items-center mb-2 sticky top-0 bg-inherit z-10`}
            >
              <span className="mr-2 text-2xl">{overallQuality.icon}</span>
              Overall Water Quality ({selectedStandard} Standards)
            </h3>
            <p
              className={`text-base ${overallQuality.color.replace(
                "-700",
                "-800"
              )}`}
            >
              {overallQuality.message}
            </p>
          </motion.div>
        )}

        {chartData && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center sticky top-0 bg-white z-10">
              📊 Water Quality Chart
            </h3>
            <Bar data={chartData} options={chartOptions} />
          </motion.div>
        )}

        {analysisResults && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center sticky top-0 bg-white z-10">
              📊 Detailed Water Quality Analysis ({selectedStandard} Standards)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analysisResults).map(([key, result], index) => (
                <motion.div
                  key={key}
                  className={`border-2 ${result.colorClass.replace(
                    "text-",
                    "border-"
                  )} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index + 0.3 }}
                >
                  <p
                    className={`text-gray-700 font-semibold capitalize text-lg ${result.colorClass}`}
                  >
                    {key === "ph"
                      ? "pH"
                      : key
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                    :{" "}
                    <span className="font-bold">
                      {result.value} {result.unit}
                    </span>
                  </p>
                  <p className={`text-sm mt-1 ${result.colorClass}`}>
                    Status: <span className="font-medium">{result.status}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{result.message}</p>
                  {result.impact && (
                    <p className="text-xs text-gray-600 italic mt-2">
                      Impact: {result.impact}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Standard Range: {result.standardRange}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-semibold text-blue-800 mb-2">
            💡 How to Use & Important Notes
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • Enter values from water test kits, bottled water labels, or
              municipal reports.
            </li>
            <li>
              • Use pH strips, TDS/conductivity meters, or hardness kits for
              home testing. Complex parameters (e.g., Organic Carbon,
              Trihalomethanes) may require lab testing.
            </li>
            <li>
              • Select WHO or FSSAI standards for analysis. Water safety is
              estimated based on parameter compliance.
            </li>
            <li>
              • Units: pH (unitless, 0–14), Hardness, Solids, Chloramines,
              Sulfate, Organic Carbon, Trihalomethanes (mg/L), Conductivity
              (µS/cm), Turbidity (NTU).
            </li>
            <li>
              • Print results to generate a report of your water quality
              analysis.
            </li>
            <li>
              • Disclaimer: This tool provides a general analysis. Consult
              certified labs for definitive results.
            </li>
            <li>
              • References:
              <ul>
                <li>WHO: Guidelines for Drinking-water Quality.</li>
                <li>FSSAI: IS 10500:2012 Drinking Water Standards.</li>
              </ul>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WaterQualityAnalyzer;
