import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function InterviewHistory() {
  const { email } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/interview-history/${email}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [email]);

  const updateStatus = async (status) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          status,
        }),
      });

      const data = await response.json();

      alert(data.message);

      navigate("/recruiter");
    } catch (error) {
      console.log(error);
      alert("Unable to update status.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-600">
              Interview History
            </h1>

            <p className="text-gray-600 mt-2">
              Candidate: <b>{email}</b>
            </p>
          </div>

          <button
            onClick={() => navigate("/recruiter")}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Back
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            Loading...
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            No interview history available.
          </div>
        ) : (
          <>
            {history.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg p-8 mb-8"
              >
                {/* Attempt Header */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-blue-600">
                    Interview Attempt {history.length - index}
                  </h2>

                  <span className="text-gray-500">
                    {item.created_at}
                  </span>
                </div>

                {/* Scores */}
                <div className="grid md:grid-cols-3 gap-5 mt-6">

                  <div className="bg-blue-50 rounded-xl p-5 text-center">
                    <p className="text-gray-500">Overall Score</p>
                    <h2 className="text-3xl font-bold text-blue-600">
                      {item.score}/100
                    </h2>
                  </div>

                  <div className="bg-green-50 rounded-xl p-5 text-center">
                    <p className="text-gray-500">Technical Score</p>
                    <h2 className="text-3xl font-bold text-green-600">
                      {item.technical_score}
                    </h2>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-5 text-center">
                    <p className="text-gray-500">Communication Score</p>
                    <h2 className="text-3xl font-bold text-purple-600">
                      {item.communication_score}
                    </h2>
                  </div>

                </div>

                {/* Feedback */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-3">
                    AI Feedback
                  </h3>

                  <div className="bg-gray-100 rounded-xl p-5">
                    {item.feedback || "No feedback available."}
                  </div>
                </div>

                {/* Transcript */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-3">
                    Interview Transcript
                  </h3>

                  <div className="bg-gray-100 rounded-xl p-5 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {item.answers || "No transcript available"}
                    </pre>
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-10 mb-10">
              <button
                onClick={() => updateStatus("Shortlisted")}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg"
              >
                Shortlist Candidate
              </button>

              <button
                onClick={() => updateStatus("Rejected")}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg"
              >
                Reject Candidate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default InterviewHistory;