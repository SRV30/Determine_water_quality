import React, { useEffect, useState, useMemo } from "react";
import {
  addWaterLog,
  getDailyWaterLog,
  getWeeklyWaterLog,
  getLastWeekWaterLog,
  getMonthlyWaterLog,
  getLastMonthWaterLog,
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
  const [lastWeekTotal, setLastWeekTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [lastMonthTotal, setLastMonthTotal] = useState(0);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [amount, setAmount] = useState("");
  const [user, setUser] = useState({ age: null, gender: "" });
  const [isPregnant, setIsPregnant] = useState(false);
  const [isLactating, setIsLactating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
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
      let dailyLogs = [];
      let dailySum = 0;
      if (Array.isArray(dailyData)) {
        dailyLogs = dailyData;
        dailySum = dailyData.reduce((acc, log) => acc + log.amount, 0);
      } else if (Array.isArray(dailyData?.logs)) {
        dailyLogs = dailyData.logs;
        dailySum =
          dailyData.total ||
          dailyData.logs.reduce((acc, log) => acc + log.amount, 0);
      }
      setLogs(dailyLogs);
      setDailyTotal(dailySum);

      const weeklyData = await getWeeklyWaterLog();
      const weeklyLogsData = weeklyData.logs || [];
      const weeklySum =
        weeklyData.total ||
        weeklyLogsData.reduce((acc, log) => acc + log.amount, 0);
      setWeeklyLogs(weeklyLogsData);
      setWeeklyTotal(weeklySum);

      const lastWeekData = await getLastWeekWaterLog();
      const lastWeekSum =
        lastWeekData.total ||
        (lastWeekData.logs || []).reduce((acc, log) => acc + log.amount, 0);
      setLastWeekTotal(lastWeekSum);

      const monthlyData = await getMonthlyWaterLog();
      const monthlySum =
        monthlyData.total ||
        (monthlyData.logs || []).reduce((acc, log) => acc + log.amount, 0);
      setMonthlyTotal(monthlySum);

      const lastMonthData = await getLastMonthWaterLog();
      const lastMonthSum =
        lastMonthData.total ||
        (lastMonthData.logs || []).reduce((acc, log) => acc + log.amount, 0);
      setLastMonthTotal(lastMonthSum);
    } catch (error) {
      console.error("Failed to fetch logs or totals:", error);
      toast.error("Failed to fetch water intake data");
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

  const getMLHydrationAnalysis = () => {
    if (user.age === null || !user.gender) {
      return {
        score: 0,
        text: "Please provide age and gender for AI-powered hydration analysis.",
        color: "text-gray-600",
        recommendation:
          "Complete your profile to unlock personalized insights.",
      };
    }
    if (parseInt(user.age) <= 1) {
      return {
        score: 0,
        text: "Infants rely on milk/formula. AI analysis not applicable.",
        color: "text-yellow-600",
        recommendation: "Consult a pediatrician for hydration needs.",
      };
    }

    const recommendedDaily = getRecommendedIntake();
    const weeklyRecommended = recommendedDaily * 7;
    const monthlyRecommended = recommendedDaily * 30;

    const dailyScore = (dailyTotal / recommendedDaily) * 100;
    const weeklyScore = (weeklyTotal / weeklyRecommended) * 100;
    const monthlyScore = (monthlyTotal / monthlyRecommended) * 100;
    const lastMonthScore = (lastMonthTotal / monthlyRecommended) * 100;

    const trendFactor =
      weeklyScore > lastWeekTotal / weeklyRecommended ? 1.1 : 0.9;
    const consistencyFactor =
      Math.abs(weeklyScore - monthlyScore) < 10 ? 1.2 : 0.8;
    const healthFactor = isPregnant || isLactating ? 0.9 : 1;

    const hydrationScore = Math.min(
      100,
      Math.round(
        (dailyScore * 0.4 +
          weeklyScore * 0.3 +
          monthlyScore * 0.2 +
          lastMonthScore * 0.1) *
          trendFactor *
          consistencyFactor *
          healthFactor
      )
    );

    let text, color, recommendation;
    if (hydrationScore < 70) {
      text = `AI-predicted hydration score: ${hydrationScore}/100. Low hydration detected based on your intake patterns.`;
      color = "text-red-600";
      recommendation = `Increase daily intake by ${
        (recommendedDaily - dailyTotal) / 1000
      } liters. Aim for consistent hydration to avoid risks like fatigue, headaches, or kidney issues.`;
    } else if (hydrationScore < 90) {
      text = `AI-predicted hydration score: ${hydrationScore}/100. Moderate hydration level detected.`;
      color = "text-yellow-600";
      recommendation = `Boost intake by ${
        (recommendedDaily * 0.9 - dailyTotal) / 1000
      } liters daily to optimize hydration and prevent mild symptoms like dry mouth.`;
    } else {
      text = `AI-predicted hydration score: ${hydrationScore}/100. Optimal hydration level detected.`;
      color = "text-green-600";
      recommendation =
        "Maintain your current intake for sustained health benefits.";
    }

    return { score: hydrationScore, text, color, recommendation };
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
  }, [weeklyLogs, user.age, user.gender, isPregnant, isLactating]);

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

  const hydrationScoreChartData = {
    labels: ["Hydration Score"],
    datasets: [
      {
        label: "AI-Predicted Hydration Score",
        data: [getMLHydrationAnalysis().score],
        backgroundColor: ["rgba(236, 72, 153, 0.6)"],
        borderColor: ["rgba(236, 72, 153, 1)"],
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

  const scoreChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "AI-Predicted Hydration Score (0-100)" },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "Score" },
      },
      x: { title: { display: true, text: "Metric" } },
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
              <motion.button
                className={`px-4 py-2 rounded ${
                  chartType === "score"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setChartType("score")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                AI Score
              </motion.button>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {chartType === "bar" ? (
                <Bar data={dailyChartData} options={chartOptions} />
              ) : chartType === "line" ? (
                <Line data={weeklyChartData} options={chartOptions} />
              ) : (
                <Bar
                  data={hydrationScoreChartData}
                  options={scoreChartOptions}
                />
              )}
            </motion.div>
            <motion.p
              className={`font-medium mb-4 ${getMLHydrationAnalysis().color}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
            >
              {getMLHydrationAnalysis().text}
            </motion.p>
            <motion.p
              className="font-medium mb-4 text-gray-700"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
            >
              AI Recommendation: {getMLHydrationAnalysis().recommendation}
            </motion.p>
            <div className="relative pt-1 mb-4">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Hydration Progress:{" "}
                  {Math.min(
                    (dailyTotal / (getRecommendedIntake() || 1)) * 100,
                    100
                  ).toFixed(0)}
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
              Total Last Week: {(lastWeekTotal / 1000).toFixed(2)} liters
            </p>
            <p className="text-gray-700">
              Total This Month: {(monthlyTotal / 1000).toFixed(2)} liters
            </p>
            <p className="text-gray-700">
              Total Last Month: {(lastMonthTotal / 1000).toFixed(2)} liters
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
