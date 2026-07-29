import React, { useState } from "react";
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

        localStorage.removeItem("interviewStatus");
        localStorage.removeItem("interviewResult");
        localStorage.removeItem("recommendation");
        localStorage.removeItem("score");
        localStorage.setItem("resumeUploaded", "true");
        localStorage.setItem(
          "resumeData",
          JSON.stringify(data.data)
        );

        localStorage.setItem(
          "candidateEmail",
          data.data.email
        );

        navigate("/dashboard");
      } else {
        alert(data.message || "Resume upload failed");
      }

    } catch (error) {
      console.error("Upload Error:", error);
      alert("Backend connection failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">

        <h1 className="text-3xl font-bold text-blue-600 text-center">
          Upload Resume
        </h1>

        <p className="text-gray-500 text-center mt-2">
          Upload your resume to analyze your skills and create your candidate profile
        </p>


        <div className="mt-8 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center">

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="resumeUpload"
          />

          <label
            htmlFor="resumeUpload"
            className="cursor-pointer text-blue-600 font-medium"
          >
            {file ? file.name : "Click to select resume"}
          </label>

          <p className="text-sm text-gray-400 mt-2">
            Supported formats: PDF, DOC, DOCX
          </p>

        </div>


        <button
          onClick={handleUpload}
          disabled={loading}
          className={`w-full mt-6 py-3 rounded-xl text-white font-semibold transition
          ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Uploading..." : "Upload Resume"}
        </button>


        {resumeData && (
          <div className="mt-6 bg-green-50 p-4 rounded-xl">

            <h2 className="font-semibold text-green-700">
              Resume Uploaded Successfully
            </h2>

            <p className="text-sm text-gray-600 mt-2">
              Name: {resumeData.name}
            </p>

            <p className="text-sm text-gray-600">
              Email: {resumeData.email}
            </p>

          </div>
        )}

      </div>

    </div>
  );
}

export default Upload;