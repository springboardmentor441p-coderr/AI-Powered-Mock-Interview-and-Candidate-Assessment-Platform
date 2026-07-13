import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">

        <div className="grid lg:grid-cols-2 gap-12 items-center">


          {/* Left Content */}
          <div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Hire Smarter with
              <span className="text-blue-600">
                {" "}SmartHire AI
              </span>
            </h1>


            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              An AI-powered recruitment platform that analyzes resumes,
              conducts smart interviews, and helps candidates improve their
              hiring journey.
            </p>


            <div className="mt-8 flex flex-col sm:flex-row gap-4">

              <Link
                to="/upload"
                className="bg-blue-600 text-white px-8 py-3 rounded-xl text-center font-semibold hover:bg-blue-700 transition"
              >
                Upload Resume
              </Link>


              
            </div>


            {/* Stats */}

            <div className="grid grid-cols-3 gap-4 mt-12">


              <div>
                <h3 className="text-2xl font-bold text-blue-600">
                  AI
                </h3>
                <p className="text-sm text-gray-600">
                  Powered
                </p>
              </div>


              <div>
                <h3 className="text-2xl font-bold text-green-600">
                  24/7
                </h3>
                <p className="text-sm text-gray-600">
                  Interview
                </p>
              </div>


              <div>
                <h3 className="text-2xl font-bold text-purple-600">
                  Smart
                </h3>
                <p className="text-sm text-gray-600">
                  Evaluation
                </p>
              </div>


            </div>


          </div>



          {/* Right Visual */}

          <div className="bg-white shadow-xl rounded-3xl p-8">

            <div className="bg-blue-50 rounded-2xl p-8">


              <h2 className="text-2xl font-bold text-gray-800">
                Smart Recruitment Flow
              </h2>


              <div className="mt-6 space-y-5">


                <div className="bg-white rounded-xl p-4 shadow">
                  📄 Upload Resume
                </div>


                <div className="bg-white rounded-xl p-4 shadow">
                  🤖 AI Resume Analysis
                </div>


                <div className="bg-white rounded-xl p-4 shadow">
                  🎤 AI Interview
                </div>


                <div className="bg-white rounded-xl p-4 shadow">
                  📊 Performance Report
                </div>


              </div>


            </div>

          </div>


        </div>

      </section>



      {/* Features Section */}

      <section className="max-w-7xl mx-auto px-6 pb-20">

        <h2 className="text-3xl font-bold text-center">
          Powerful Features
        </h2>


        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">


          <FeatureCard
            title="Resume Intelligence"
            text="Extract skills, education, experience, and projects automatically."
            icon="📄"
          />


          <FeatureCard
            title="AI Interviews"
            text="Generate personalized interview questions based on candidate profiles."
            icon="🎤"
          />


          <FeatureCard
            title="Smart Evaluation"
            text="Analyze answers and provide improvement feedback."
            icon="📊"
          />


        </div>

      </section>


    </div>
  );
}


function FeatureCard({ title, text, icon }) {

  return (
    <div className="bg-white rounded-2xl shadow p-6 hover:shadow-xl transition">

      <div className="text-4xl">
        {icon}
      </div>

      <h3 className="text-xl font-bold mt-4">
        {title}
      </h3>

      <p className="text-gray-600 mt-3">
        {text}
      </p>

    </div>
  );
}


export default Home;