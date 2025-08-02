import React, { useEffect, useState } from "react";
import {
  addWaterLog,
  getDailyWaterLog,
  getWeeklyWaterLog,
  getMonthlyWaterLog,
} from "../api/index";

const DrinkWaterLog = () => {
  const [logs, setLogs] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [amount, setAmount] = useState("");

  const fetchLogsAndTotals = async () => {
    try {
      // Fetch daily logs and total
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

      // Fetch weekly total
      const weeklyData = await getWeeklyWaterLog();
      setWeeklyTotal(weeklyData.total || 0);

      // Fetch monthly total
      const monthlyData = await getMonthlyWaterLog();
      setMonthlyTotal(monthlyData.total || 0);
    } catch (error) {
      console.error("Failed to fetch logs or totals:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    try {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      await addWaterLog({ amount: parseInt(amount), time: currentTime });
      setAmount("");
      fetchLogsAndTotals();
    } catch (error) {
      console.error("Failed to add water log:", error);
    }
  };

  useEffect(() => {
    fetchLogsAndTotals();
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md p-6 space-y-6">
      <h2 className="text-xl font-semibold text-center">Water Intake Log</h2>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="number"
          placeholder="Amount (ml)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </form>

      <div>
        <h3 className="font-medium mb-2">Today's Log</h3>
        <p className="text-gray-700">
          Total Today: {(dailyTotal / 1000).toFixed(2)} liters
        </p>
        <p className="text-gray-700">
          Total This Week: {(weeklyTotal / 1000).toFixed(2)} liters
        </p>
        <p className="text-gray-700">
          Total This Month: {(monthlyTotal / 1000).toFixed(2)} liters
        </p>
        <ul className="space-y-1 mt-4">
          {logs.length === 0 ? (
            <li className="text-gray-500">No entries yet</li>
          ) : (
            logs.map((log) => (
              <li key={log._id} className="flex justify-between border-b py-1">
                <span>{log.amount} ml</span>
                <span>
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default DrinkWaterLog;
