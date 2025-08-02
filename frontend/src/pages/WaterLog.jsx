import React, { useEffect, useState, useMemo } from "react";
import {
  addWaterLog,
  getDailyWaterLog,
  getWeeklyWaterLog,
  getMonthlyWaterLog,
  getProfile,
  fetchHealthInfo,
} from "../api/index";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const DrinkWaterLog = () => {
  const [logs, setLogs] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [amount, setAmount] = useState("");
  const [user, setUser] = useState({ age: null, gender: "" });
  const [isPregnant, setIsPregnant] = useState(false);
  const [isLactating, setIsLactating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar"); // Toggle between bar and line charts
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfileAndHealth = async () => {
      setLoading(true);
      try {
        const res = await getProfile();
        setUser(res.user);
        toast.success("Profile loaded");

        try {
          const healthRes = await fetchHealthInfo();
          if (healthRes.success && healthRes.healthInfo) {
            setUser((prev) => ({
              ...prev,
              age: healthRes.healthInfo.age || null,
              gender: healthRes.healthInfo.gender || "",
            }));
          } else {
            setUser((prev) => ({ ...prev, age: null, gender: "" }));
          }
        } catch (err) {
          console.log(err);
          setUser((prev) => ({ ...prev, age: null, gender: "" }));
        }
      } catch (error) {
        toast.error("Failed to load profile");
        console.log(error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    loadProfileAndHealth();
  }, [navigate]);

  const fetchLogsAndTotals = async () => {
    try {
      setLoading(true);
      const dailyData = await getDailyWaterLog();
      if (Array.isArray(dailyData)) {
        setLogs(dailyData);
        setDailyTotal(dailyData.reduce((acc, log) => acc + log.amount, 0));
      } else if (Array.isArray(dailyData?.logs)) {
        setLogs(dailyData.logs);
        setDailyTotal(dailyData.total || 0);
      } else {
        setLogs([]);
        setDailyTotal(0);
      }

      const weeklyData = await getWeeklyWaterLog();
      setWeeklyLogs(weeklyData.logs || []);
      setWeeklyTotal(weeklyData.total || 0);

      const monthlyData = await getMonthlyWaterLog();
      setMonthlyTotal(monthlyData.total || 0);
    } catch (error) {
      console.error("Failed to fetch logs or totals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }
    try {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      await addWaterLog({ amount: parseInt(amount), time: currentTime });
      setAmount("");
      fetchLogsAndTotals();
      toast.success("Water log added");
    } catch (error) {
      console.error("Failed to add water log:", error);
      toast.error("Failed to add water log");
    }
  };

  const handleUserInfoSubmit = (e) => {
    e.preventDefault();
    fetchLogsAndTotals();
  };

  const getRecommendedIntake = () => {
    const ageNum = parseInt(user.age);
    if (!ageNum || !user.gender) return null;

    let recommended = 0;
    if (ageNum >= 0 && ageNum <= 5) {
      if (ageNum <= 1) recommended = 750;
      else if (ageNum <= 3) recommended = 1300;
      else recommended = 1700;
    } else if (ageNum >= 6 && ageNum <= 12) {
      recommended = 1900;
    } else if (ageNum >= 13 && ageNum <= 19) {
      recommended = user.gender === "male" ? 2600 : 2300;
    } else if (ageNum >= 20 && ageNum <= 45) {
      if (user.gender === "male") {
        recommended = 3700;
      } else if (user.gender === "female") {
        if (isLactating) recommended = 3800;
        else if (isPregnant) recommended = 3000;
        else recommended = 2700;
      }
    } else if (ageNum >= 46 && ageNum <= 60) {
      recommended = user.gender === "male" ? 3700 : 2700;
    } else if (ageNum > 60) {
      recommended = user.gender === "male" ? 3000 : 2200;
    }

    return recommended;
  };

  const getIntakeAnalysis = () => {
    if (user.age === null || !user.gender) {
      return {
        text: "Please ensure your profile includes age and gender for analysis.",
        color: "text-gray-600",
      };
    }
    if (parseInt(user.age) <= 1) {
      return {
        text: "Infants (0-1 years) should primarily get hydration from milk/formula. Consult a pediatrician for water intake.",
        color: "text-yellow-600",
      };
    }

    const recommended = getRecommendedIntake();
    const difference = dailyTotal - recommended;
    const percentage = ((dailyTotal / recommended) * 100).toFixed(0);

    if (difference > 0) {
      return {
        text: `You're exceeding the recommended intake of ${(
          recommended / 1000
        ).toFixed(1)} liters by ${(difference / 1000).toFixed(
          2
        )} liters (${percentage}% of recommended). Great job staying hydrated!`,
        color: "text-green-600",
      };
    } else if (difference < 0) {
      return {
        text: `You're ${(Math.abs(difference) / 1000).toFixed(
          2
        )} liters below the recommended intake of ${(
          recommended / 1000
        ).toFixed(
          1
        )} liters (${percentage}% of recommended). Try drinking a bit more!`,
        color: "text-red-600",
      };
    } else {
      return {
        text: `You're meeting the recommended intake of ${(
          recommended / 1000
        ).toFixed(1)} liters exactly (${percentage}% of recommended). Perfect!`,
        color: "text-blue-600",
      };
    }
  };

  const weeklyChartData = useMemo(() => {
    const labels = [];
    const data = [];
    const recommended = getRecommendedIntake() || 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(
        date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    }

    const dailyTotals = {};
    weeklyLogs.forEach((log) => {
      const date = new Date(log.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      dailyTotals[date] = (dailyTotals[date] || 0) + log.amount;
    });

    labels.forEach((label) => {
      data.push(dailyTotals[label] || 0);
    });

    return {
      labels,
      datasets: [
        {
          label: "Daily Intake (ml)",
          data,
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Recommended (ml)",
          data: Array(labels.length).fill(recommended),
          borderColor: "rgba(34, 197, 94, 1)",
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          borderDash: [5, 5],
          fill: false,
        },
      ],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    weeklyLogs,
    user.age,
    user.gender,
    isPregnant,
    isLactating,
    getRecommendedIntake,
  ]);

  const dailyChartData = {
    labels: ["Daily Intake", "Recommended"],
    datasets: [
      {
        label: "Water Intake (ml)",
        data: [dailyTotal, getRecommendedIntake() || 0],
        backgroundColor: ["rgba(59, 130, 246, 0.6)", "rgba(34, 197, 94, 0.6)"],
        borderColor: ["rgba(59, 130, 246, 1)", "rgba(34, 197, 94, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text:
          chartType === "bar"
            ? "Daily Water Intake vs Recommended (ml)"
            : "Weekly Water Intake Trend (ml)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Milliliters (ml)" },
      },
      x: {
        title: {
          display: true,
          text: chartType === "bar" ? "Category" : "Date",
        },
      },
    },
  };

  useEffect(() => {
    fetchLogsAndTotals();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 p-4">
      {loading ? (
        <p className="text-gray-600 text-lg animate-pulse">Loading...</p>
      ) : (
        <motion.div
          className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg transform transition-all duration-300 hover:scale-[1.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
            Water Intake Log
          </h2>

          {user.gender === "female" && (
            <motion.form
              onSubmit={handleUserInfoSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="mr-2"
                  />
                  Pregnant
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isLactating}
                    onChange={(e) => setIsLactating(e.target.checked)}
                    className="mr-2"
                  />
                  Lactating
                </label>
              </div>
              <motion.button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Update Pregnancy/Lactation Info
              </motion.button>
            </motion.form>
          )}

          <motion.form
            onSubmit={handleSubmit}
            className="flex space-x-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <input
              type="number"
              placeholder="Amount (ml)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <motion.button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add
            </motion.button>
          </motion.form>

          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex justify-center space-x-4 mb-4">
              <motion.button
                className={`px-4 py-2 rounded ${
                  chartType === "bar"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setChartType("bar")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Daily Chart
              </motion.button>
              <motion.button
                className={`px-4 py-2 rounded ${
                  chartType === "line"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setChartType("line")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Weekly Trend
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {chartType === "bar" ? (
                <Bar data={dailyChartData} options={chartOptions} />
              ) : (
                <Line data={weeklyChartData} options={chartOptions} />
              )}
            </motion.div>

            <motion.p
              className={`font-medium mb-4 ${getIntakeAnalysis().color}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
            >
              {getIntakeAnalysis().text}
            </motion.p>

            <div className="relative pt-1 mb-4">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Progress:{" "}
                  {((dailyTotal / (getRecommendedIntake() || 1)) * 100).toFixed(
                    0
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      (dailyTotal / (getRecommendedIntake() || 1)) * 100,
                      100
                    )}%`,
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      (dailyTotal / (getRecommendedIntake() || 1)) * 100,
                      100
                    )}%`,
                  }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 80 }}
                />
              </div>
            </div>

            <p className="text-gray-700 mt-4">
              Total Today: {(dailyTotal / 1000).toFixed(2)} liters
            </p>
            <p className="text-gray-700">
              Total This Week: {(weeklyTotal / 1000).toFixed(2)} liters
            </p>
            <p className="text-gray-700">
              Total This Month: {(monthlyTotal / 1000).toFixed(2)} liters
            </p>
            <ul className="space-y-2 mt-4">
              {logs.length === 0 ? (
                <li className="text-gray-500">No entries yet</li>
              ) : (
                logs.map((log, index) => (
                  <motion.li
                    key={log._id}
                    className="flex justify-between border-b py-2 text-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    <span>{log.amount} ml</span>
                    <span>
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DrinkWaterLog;
