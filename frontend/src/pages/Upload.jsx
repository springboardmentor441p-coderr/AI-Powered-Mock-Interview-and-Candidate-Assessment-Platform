import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Upload() {
  const [file, setFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a resume");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);

      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResumeData(data.data);

        localStorage.setItem("resumeUploaded", "true");
        localStorage.setItem("resumeData", JSON.stringify(data.data));
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      console.log(error);
      alert("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-600">
          Resume Analyzer
        </h1>

        <p className="text-center text-gray-600 mt-3">
          Upload your resume and let SmartHire AI analyze your profile.
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-8 mt-10">
          <div className="border-2 border-dashed border-blue-400 rounded-xl p-10 text-center">
            <div className="text-5xl">📄</div>

            <h2 className="text-xl font-semibold mt-4">
              Upload Resume PDF
            </h2>

            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="mt-5"
            />

            {file && (
              <p className="mt-4 text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            className="w-full mt-8 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
          >
            {loading ? "Uploading Resume..." : "Upload Resume"}
          </button>
        </div>

        {resumeData && (
  <div className="bg-white rounded-2xl shadow-lg p-8 mt-8 text-center">

    <div className="text-6xl mb-4">
      ✅
    </div>

    <h2 className="text-3xl font-bold text-green-600">
      Resume Uploaded Successfully
    </h2>

    <p className="text-gray-600 mt-3">
      Your resume has been uploaded and extracted successfully.    </p>

    <button
      onClick={() => navigate("/dashboard")}
      className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700"
    >
      Continue to Dashboard →
    </button>

  </div>
)}
      </div>
    </div>
  );
}

export default Upload;