import React, { useState, useRef, useEffect, useCallback } from "react";
import { performOCR, cleanText, extractMinerals } from "../utils/ocrUtils";
import {
  WHO_STANDARDS,
  FSSAI_STANDARDS,
  OVERALL_WATER_QUALITY_GUIDE,
} from "../utils/waterStandards";
import Webcam from "react-webcam";

const VALID_WATER_BRANDS = [
  { en: "Bisleri", hi: "बिसलेरी" },
  { en: "Kinley", hi: "किंले" },
  { en: "Aquafina", hi: "एक्वाफ़िना" },
  { en: "Bailley", hi: "बेली" },
  { en: "Himalayan", hi: "हिमालयन" },
  { en: "Rail Neer", hi: "रेल नीर" },
  { en: "Oxyrich", hi: "ऑक्सीरीच" },
  { en: "Vedica", hi: "वेदिका" },
  { en: "Bailey", hi: "बेली" },
  { en: "Qua", hi: "क्वा" },
];

function extractBrandName(text) {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let brand of VALID_WATER_BRANDS) {
    for (let line of lines) {
      if (
        line.toLowerCase().includes(brand.en.toLowerCase()) ||
        line.includes(brand.hi)
      ) {
        return brand;
      }
    }
  }
  return null;
}

const OCRProcessor = () => {
  const [minerals, setMinerals] = useState({});
  const [error, setError] = useState(null);
  const [manualValues, setManualValues] = useState({
    brand: "",
    calcium: "",
    magnesium: "",
    potassium: "",
    sodium: "",
    bicarbonate: "",
    chloride: "",
    sulphate: "",
    nitrate: "",
    fluoride: "",
    tds: "",
    ph: "",
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [overallQuality, setOverallQuality] = useState(null);
  const [manualInputMode, setManualInputMode] = useState("ocr");
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedStandard, setSelectedStandard] = useState("FSSAI");
  const [brandStatus, setBrandStatus] = useState(null);
  const webcamRef = useRef(null);

  const analyzeWaterQuality = useCallback((data, standardType) => {
    const currentStandards =
      standardType === "FSSAI" ? FSSAI_STANDARDS : WHO_STANDARDS;
    const results = {};
    let issuesFound = false;
    let warningFound = false;
    Object.entries(data).forEach(([mineralName, value]) => {
      if (mineralName === "brand") return;
      const standard = currentStandards[mineralName];
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
            if (
              status === "Acidic" ||
              status === "Alkaline" ||
              status === "Unsuitable" ||
              status === "Poor"
            ) {
              issuesFound = true;
            } else if (status === "Fair") {
              warningFound = true;
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
        results[mineralName] = {
          value,
          unit: standard.unit,
          status,
          message,
          impact: standard.impact,
          colorClass,
          standardNote: standard.note,
          whoStandard: WHO_STANDARDS[mineralName]
            ? `${WHO_STANDARDS[mineralName].min}-${WHO_STANDARDS[mineralName].max} ${WHO_STANDARDS[mineralName].unit}`
            : "N/A",
          fssaiStandard: FSSAI_STANDARDS[mineralName]
            ? `${FSSAI_STANDARDS[mineralName].min}-${FSSAI_STANDARDS[mineralName].max} ${FSSAI_STANDARDS[mineralName].unit}`
            : "N/A",
        };
      }
    });
    setAnalysisResults(results);
    if (issuesFound) {
      setOverallQuality(OVERALL_WATER_QUALITY_GUIDE.unsuitable);
    } else if (warningFound) {
      setOverallQuality(OVERALL_WATER_QUALITY_GUIDE.needs_attention);
    } else if (Object.keys(data).length > 0) {
      setOverallQuality(OVERALL_WATER_QUALITY_GUIDE.optimal);
    } else {
      setOverallQuality(null);
    }
  }, []);

  const analyzeBrand = useCallback((text) => {
    const origBrand = extractBrandName(text);
    if (origBrand) {
      setBrandStatus({
        status: "original",
        brand: origBrand,
        message: `${origBrand.en} (${origBrand.hi}) is an officially recognized bottled water brand.`,
      });
    } else {
      let detectedLine = null;
      const lines = text
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (let line of lines) {
        if (
          line.length > 2 &&
          !VALID_WATER_BRANDS.some(
            (b) =>
              line.toLowerCase().includes(b.en.toLowerCase()) ||
              line.includes(b.hi)
          )
        ) {
          detectedLine = line;
          break;
        }
      }
      setBrandStatus({
        status: "fake",
        brand: detectedLine,
        message: detectedLine
          ? `⚠️ The detected brand "${detectedLine}" is not officially recognized and may be fake or mislabelled.`
          : "No official brand name recognized. If you see an odd/suspicious name, please verify the packaging.",
      });
    }
  }, []);

  const extractTextFromImage = async (imgUrl) => {
    setLoading(true);
    setError(null);
    setMinerals({});
    setOcrText("");
    setConfidence(null);
    setAnalysisResults(null);
    setOverallQuality(null);
    setBrandStatus(null);
    try {
      const { text: rawText, confidence: ocrConfidence } = await performOCR(
        imgUrl
      );
      const cleaned = cleanText(rawText);
      const data = extractMinerals(cleaned);
      setOcrText(rawText);
      setMinerals(data);
      setConfidence(ocrConfidence);
      analyzeBrand(rawText);
      if (Object.keys(data).length === 0) {
        setError(
          "⚠️ No mineral values detected from the image. Try a clearer image or use manual entry."
        );
      } else {
        analyzeWaterQuality(data, selectedStandard);
      }
    } catch {
      setError(
        "❌ OCR processing failed. Please try again or use manual entry."
      );
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      setImage(imgUrl);
      extractTextFromImage(imgUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      setUseCamera(false);
      await extractTextFromImage(imageSrc);
    }
  };

  const handleManualTextAnalysis = () => {
    if (!ocrText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    setError(null);
    const cleaned = cleanText(ocrText);
    const data = extractMinerals(cleaned);
    setMinerals(data);
    analyzeBrand(ocrText);
    if (Object.keys(data).length === 0) {
      setError("⚠️ No mineral values found in your input text.");
    } else {
      analyzeWaterQuality(data, selectedStandard);
    }
  };

  const handleManualIndividualValues = () => {
    setError(null);
    const filteredData = {};
    let hasValues = false;
    let brandState = manualValues.brand
      ? VALID_WATER_BRANDS.find(
          (b) =>
            manualValues.brand === b.en ||
            manualValues.brand === b.hi
        )
      : null;
    Object.entries(manualValues).forEach(([key, value]) => {
      if (key === "brand") return;
      if (value && value.trim() !== "") {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
          filteredData[key] = numValue;
          hasValues = true;
        }
      }
    });
    if (!manualValues.brand) {
      setBrandStatus(null);
    } else if (brandState) {
      setBrandStatus({
        status: "original",
        brand: brandState,
        message: `${brandState.en} (${brandState.hi}) is an officially recognized bottled water brand.`,
      });
    } else {
      setBrandStatus({
        status: "fake",
        brand: manualValues.brand,
        message: `⚠️ The detected brand "${manualValues.brand}" is not officially recognized and may be fake or mislabelled.`,
      });
    }
    if (!hasValues) {
      setError("Please enter at least one mineral value.");
      setMinerals({});
      setAnalysisResults(null);
      setOverallQuality(null);
      return;
    }
    setMinerals(filteredData);
    analyzeWaterQuality(filteredData, selectedStandard);
  };

  const clearAll = () => {
    setImage(null);
    setOcrText("");
    setMinerals({});
    setError(null);
    setConfidence(null);
    setUseCamera(false);
    setManualInputMode("ocr");
    setAnalysisResults(null);
    setOverallQuality(null);
    setBrandStatus(null);
    setManualValues({
      brand: "",
      calcium: "",
      magnesium: "",
      potassium: "",
      sodium: "",
      bicarbonate: "",
      chloride: "",
      sulphate: "",
      nitrate: "",
      fluoride: "",
      tds: "",
      ph: "",
    });
  };

  useEffect(() => {
    if (Object.keys(minerals).length > 0) {
      analyzeWaterQuality(minerals, selectedStandard);
    }
  }, [selectedStandard, analyzeWaterQuality, minerals]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">
          💧 Smart Water Label Analyzer
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Extract mineral content from water bottle labels using OCR or manual
          entry, and get detailed analysis.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
            📁 Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </label>
          <button
            onClick={() => setUseCamera(!useCamera)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            disabled={loading}
          >
            📷 {useCamera ? "Hide" : "Use"} Camera
          </button>
          <button
            onClick={clearAll}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            disabled={loading}
          >
            🗑️ Clear All
          </button>
        </div>
        {useCamera && (
          <div className="bg-gray-100 rounded-xl p-6 mb-6 text-center flex flex-col items-center">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full max-w-sm rounded shadow mb-3"
            />
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={capture}
              disabled={loading}
            >
              📸 Capture Photo
            </button>
          </div>
        )}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setManualInputMode("ocr")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                manualInputMode === "ocr"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📄 OCR / Text Input
            </button>
            <button
              onClick={() => setManualInputMode("individual")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                manualInputMode === "individual"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              🔢 Manual Individual Values
            </button>
          </div>
          {manualInputMode === "ocr" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raw Extracted Text / Paste Text Here
              </label>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Paste or type the text from your water label here, or upload an image above to extract text automatically..."
                rows={8}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleManualTextAnalysis}
                className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                disabled={loading}
              >
                🧠 Analyze Text
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Enter Brand and Mineral Values (mg/L or ppm)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div key="brand" className="space-y-1 col-span-2">
                  <label className="block text-xs font-medium text-gray-600">
                    Bottle Brand Name (English/Hindi)
                  </label>
                  <select
                    value={manualValues.brand}
                    onChange={(e) =>
                      setManualValues((prev) => ({
                        ...prev,
                        brand: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Brand (or manually type below)</option>
                    {VALID_WATER_BRANDS.map((b) => (
                      <option key={b.en} value={b.en}>
                        {b.en} / {b.hi}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type brand name..."
                    value={manualValues.brand}
                    onChange={(e) =>
                      setManualValues((prev) => ({
                        ...prev,
                        brand: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                {Object.entries(manualValues)
                  .filter(([mineral]) => mineral !== "brand")
                  .map(([mineral, value]) => (
                    <div key={mineral} className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600 capitalize">
                        {mineral === "tds"
                          ? "TDS"
                          : mineral === "ph"
                          ? "pH"
                          : mineral}
                        {mineral === "ph" ? "" : " (mg/L)"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={value}
                        onChange={(e) =>
                          setManualValues((prev) => ({
                            ...prev,
                            [mineral]: e.target.value,
                          }))
                        }
                        placeholder="0.0"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleManualIndividualValues}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  ✅ Set Values & Analyze
                </button>
                <button
                  onClick={clearAll}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  🗑️ Clear Values
                </button>
              </div>
            </div>
          )}
        </div>
        {brandStatus && (
          <div
            className={`mb-6 p-4 rounded-lg shadow-md ${
              brandStatus.status === "original"
                ? "bg-green-50 border-green-200"
                : brandStatus.status === "fake"
                ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <h3 className="text-lg font-bold mb-2">
              {brandStatus.status === "original" && "✅ Authentic Brand"}
              {brandStatus.status === "fake" && "⚠️ Fake/Suspicious Brand"}
              {brandStatus.status === "unknown" && "ℹ️ Brand Not Recognized"}
            </h3>
            <p className="text-base">{brandStatus.message}</p>
            {brandStatus.brand && (
              <p className="font-mono text-xl mt-1">
                {typeof brandStatus.brand === "object"
                  ? `${brandStatus.brand.en} / ${brandStatus.brand.hi}`
                  : brandStatus.brand}
              </p>
            )}
          </div>
        )}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-blue-600 font-semibold">
              🔍 Processing image... This might take a moment.
            </p>
          </div>
        )}
        {image && (
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold mb-3">Image Preview</h3>
            <div className="inline-block border rounded-lg overflow-hidden shadow-lg">
              <img
                src={image}
                alt="Uploaded water label"
                className="max-w-sm max-h-64 object-contain"
              />
            </div>
          </div>
        )}
        {confidence !== null && manualInputMode === "ocr" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                OCR Confidence
              </span>
              <span className="text-sm text-gray-600">
                {confidence !== null ? confidence.toFixed(0) : "-"}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  confidence >= 70
                    ? "bg-green-500"
                    : confidence >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
            {confidence < 70 && (
              <p className="text-sm text-orange-600 mt-2">
                Low OCR confidence. Please verify the extracted text or use
                manual entry for accuracy.
              </p>
            )}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
        {overallQuality && (
          <div
            className={`mb-6 p-4 rounded-lg shadow-md ${overallQuality.color
              .replace("text-", "bg-")
              .replace("-700", "-50")} border ${overallQuality.color
              .replace("text-", "border-")
              .replace("-700", "-200")}`}
          >
            <h3
              className={`text-xl font-bold ${overallQuality.color} flex items-center mb-2`}
            >
              <span className="mr-2 text-2xl">{overallQuality.icon}</span>{" "}
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
          </div>
        )}
        {Object.keys(minerals).length > 0 && analysisResults && (
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
              📊 Detailed Mineral Analysis ({selectedStandard} Standards)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysisResults).map(([key, result]) => (
                <div
                  key={key}
                  className={`border-2 ${result.colorClass.replace(
                    "text-",
                    "border-"
                  )} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <p
                    className={`text-gray-700 font-semibold capitalize text-lg ${result.colorClass}`}
                  >
                    {key.replace(/([A-Z])/g, " $1").trim()}:{" "}
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
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    <p className="font-semibold">Reference Values:</p>
                    <p>
                      WHO:{" "}
                      {WHO_STANDARDS[key]
                        ? `${WHO_STANDARDS[key].min}-${WHO_STANDARDS[key].max} ${WHO_STANDARDS[key].unit}`
                        : "N/A"}
                    </p>
                    <p>
                      FSSAI:{" "}
                      {FSSAI_STANDARDS[key]
                        ? `${FSSAI_STANDARDS[key].min}-${FSSAI_STANDARDS[key].max} ${FSSAI_STANDARDS[key].unit}`
                        : "N/A"}
                    </p>
                    {result.standardNote && (
                      <p className="mt-1 italic">{result.standardNote}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">
            💡 How to use & Important Notes
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • Upload Image/Use Camera: Click to upload an image of your water
              bottle's mineral label or capture it directly using your camera.
              The app will automatically try to extract the mineral values.
            </li>
            <li>
              • Text Input: The extracted text will appear in the text area. You
              can edit it manually or paste text directly from a water report.
              Click "Analyze Text" to process it.
            </li>
            <li>
              • Manual Individual Values: Enter the brand and each mineral value.
            </li>
            <li>
              • Analyze with WHO/FSSAI: Choose between WHO Guidelines or FSSAI
              Standards for the analysis.
            </li>
            <li>
              • Values are typically in mg/L (milligrams per liter) or ppm
              (parts per million); pH is unitless.
            </li>
            <li>
              • Disclaimer: This tool provides a general analysis based on the
              selected standards. For definitive water quality assessment and
              health advice, always consult with certified water testing
              laboratories and healthcare professionals.
            </li>
            <li>
              • Standard References:
              <ul>
                <li>
                  WHO Guidelines: Based on "Guidelines for Drinking-water
                  Quality" by the World Health Organization.
                </li>
                <li>
                  FSSAI Standards: Based on "Food Safety and Standards
                  (Packaging and Labelling) Regulations" and Indian Standards
                  (like IS 10500:2012).
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OCRProcessor;
