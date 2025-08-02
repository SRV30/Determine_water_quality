import OCRProcessor from "./components/OCRProcessor";
// import Home from "./pages/Home";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import WaterPrediction from "./pages/WaterPrediction";
import HealthInfoForm from "./pages/HealthInfoForm";
import WaterLog from "./pages/WaterLog";
import WaterQualityAnalyzer from "./pages/WaterQualityAnalyzer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ocr" element={<OCRProcessor />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />{" "}
        <Route path="/water-log" element={<WaterLog />} />
        <Route path="/water-quality" element={<WaterQualityAnalyzer />} />
        <Route path="/health" element={<HealthInfoForm />} />
        <Route path="/water" element={<WaterPrediction />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
