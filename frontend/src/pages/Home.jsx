import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  Mic,
  BarChart3,
  ArrowRight,
  Menu,
} from "lucide-react";

function Home() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ===================== NAVBAR ===================== */}

      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-8">

          <div className="flex justify-between items-center h-20">

            <div className="flex items-center gap-3">

              <div className="bg-blue-600 p-3 rounded-xl">

                <Brain className="text-white w-7 h-7" />

              </div>

              <div>

                <h1 className="text-2xl font-bold text-gray-900">
                  SmartHire AI
                </h1>

                <p className="text-sm text-gray-500">
                  AI Recruitment Platform
                </p>

              </div>

            </div>

            <div className="hidden md:flex items-center gap-10">

              <a
                href="#features"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Features
              </a>

              <a
                href="#workflow"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Workflow
              </a>

              <a
                href="#about"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                About
              </a>

            </div>

            <Link
              to="/upload"
              className="hidden md:flex bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
            >
              Upload Resume
            </Link>

            <button className="md:hidden">

              <Menu />

            </button>

          </div>

        </div>

      </nav>

      {/* ===================== HERO ===================== */}

      <section className="max-w-7xl mx-auto px-8 py-20">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT */}

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >

            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-5 py-2 rounded-full font-medium mb-8">

              🚀 AI Powered Recruitment Platform

            </div>

            <h1 className="text-6xl font-extrabold leading-tight text-gray-900">

              Transform Hiring with

              <span className="text-blue-600">
                {" "}SmartHire AI
              </span>

            </h1>

            <p className="mt-8 text-xl text-gray-600 leading-9">

              Experience the future of recruitment with AI-powered resume
              analysis, intelligent voice interviews, automated candidate
              evaluation, and recruiter analytics — all in one platform.

            </p>

            <div className="flex flex-wrap gap-5 mt-10">

              <Link
                to="/upload"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition"
              >

                Upload Resume

                <ArrowRight size={20} />

              </Link>

              <Link
                to="/interview"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold transition"
              >
                Start Interview
              </Link>

            </div>

            {/* Small Statistics */}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-16">

              <div className="bg-white rounded-2xl shadow-lg p-5 text-center">

                <h2 className="text-3xl font-bold text-blue-600">
                  500+
                </h2>

                <p className="text-gray-500 mt-2">
                  Interviews
                </p>

              </div>

              <div className="bg-white rounded-2xl shadow-lg p-5 text-center">

                <h2 className="text-3xl font-bold text-green-600">
                  95%
                </h2>

                <p className="text-gray-500 mt-2">
                  Accuracy
                </p>

              </div>

              <div className="bg-white rounded-2xl shadow-lg p-5 text-center">

                <h2 className="text-3xl font-bold text-purple-600">
                  AI
                </h2>

                <p className="text-gray-500 mt-2">
                  Powered
                </p>

              </div>

              <div className="bg-white rounded-2xl shadow-lg p-5 text-center">

                <h2 className="text-3xl font-bold text-orange-500">
                  24/7
                </h2>

                <p className="text-gray-500 mt-2">
                  Available
                </p>

              </div>

            </div>

          </motion.div>

          {/* RIGHT */}

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >

            <div className="bg-white rounded-3xl shadow-2xl p-10">

              <h2 className="text-3xl font-bold mb-8">

                Smart Recruitment Process

              </h2>

              <div className="space-y-6">

                <div className="flex items-center gap-5 bg-blue-50 rounded-2xl p-5">

                  <div className="bg-blue-600 p-4 rounded-xl">

                    <FileText className="text-white" />

                  </div>

                  <div>

                    <h3 className="font-bold text-lg">
                      Resume Upload
                    </h3>

                    <p className="text-gray-600">
                      Upload your resume for AI analysis.
                    </p>

                  </div>

                </div>

                <div className="flex justify-center text-3xl text-blue-500">
                  ↓
                </div>

                <div className="flex items-center gap-5 bg-green-50 rounded-2xl p-5">

                  <div className="bg-green-600 p-4 rounded-xl">

                    <Brain className="text-white" />

                  </div>

                  <div>

                    <h3 className="font-bold text-lg">
                      Resume Analysis
                    </h3>

                    <p className="text-gray-600">
                      AI extracts skills and experience.
                    </p>

                  </div>

                </div>
                                <div className="flex justify-center text-3xl text-blue-500">
                  ↓
                </div>

                <div className="flex items-center gap-5 bg-purple-50 rounded-2xl p-5">

                  <div className="bg-purple-600 p-4 rounded-xl">
                    <Mic className="text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">
                      AI Voice Interview
                    </h3>

                    <p className="text-gray-600">
                      Conduct intelligent AI-powered mock interviews.
                    </p>
                  </div>

                </div>

                <div className="flex justify-center text-3xl text-blue-500">
                  ↓
                </div>

                <div className="flex items-center gap-5 bg-orange-50 rounded-2xl p-5">

                  <div className="bg-orange-500 p-4 rounded-xl">
                    <BarChart3 className="text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">
                      AI Performance Report
                    </h3>

                    <p className="text-gray-600">
                      Receive detailed scores and personalized feedback.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}

      <section
        id="workflow"
        className="bg-white py-24"
      >

        <div className="max-w-7xl mx-auto px-8">

          <motion.div

            initial={{ opacity: 0, y: 30 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            transition={{ duration: 0.6 }}

          >

            <h2 className="text-5xl font-bold text-center text-gray-900">

              How SmartHire AI Works

            </h2>

            <p className="text-center text-gray-500 mt-5 text-lg">

              A simple AI-powered hiring workflow designed for candidates and recruiters.

            </p>

          </motion.div>

          <div className="grid md:grid-cols-4 gap-8 mt-20">

            <div className="bg-slate-50 rounded-3xl p-8 text-center shadow hover:shadow-xl transition">

              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">

                <FileText className="text-white w-8 h-8" />

              </div>

              <h3 className="text-xl font-bold mt-6">

                Upload Resume

              </h3>

              <p className="text-gray-600 mt-3">

                Upload your resume securely for AI processing.

              </p>

            </div>

            <div className="bg-slate-50 rounded-3xl p-8 text-center shadow hover:shadow-xl transition">

              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">

                <Brain className="text-white w-8 h-8" />

              </div>

              <h3 className="text-xl font-bold mt-6">

                AI Analysis

              </h3>

              <p className="text-gray-600 mt-3">

                AI identifies skills, education, projects and experience.

              </p>

            </div>

            <div className="bg-slate-50 rounded-3xl p-8 text-center shadow hover:shadow-xl transition">

              <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">

                <Mic className="text-white w-8 h-8" />

              </div>

              <h3 className="text-xl font-bold mt-6">

                Voice Interview

              </h3>

              <p className="text-gray-600 mt-3">

                Participate in an intelligent AI mock interview.

              </p>

            </div>

            <div className="bg-slate-50 rounded-3xl p-8 text-center shadow hover:shadow-xl transition">

              <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto">

                <BarChart3 className="text-white w-8 h-8" />

              </div>

              <h3 className="text-xl font-bold mt-6">

                Performance Report

              </h3>

              <p className="text-gray-600 mt-3">

                Get instant scores, strengths, weaknesses and recommendations.

              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================= FEATURES ================= */}

        <section id="features"
          className="py-24 bg-slate-50"
      >

        <div className="max-w-7xl mx-auto px-8">

          <h2 className="text-5xl font-bold text-center">

            Powerful Features

          </h2>

          <p className="text-center text-gray-500 mt-5 text-lg">

            Everything you need for an intelligent hiring experience.

          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"> </div> 
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">

  <FeatureCard
    icon={<FileText size={32} />}
    title="Resume Intelligence"
    text="Extracts skills, education, projects and experience from resumes."
  />

  <FeatureCard
    icon={<Mic size={32} />}
    title="AI Mock Interview"
    text="Conducts realistic voice interviews using AI."
  />

  <FeatureCard
    icon={<Brain size={32} />}
    title="Question Generation"
    text="Generates interview questions based on candidate profiles."
  />

  <FeatureCard
    icon={<BarChart3 size={32} />}
    title="Performance Report"
    text="Provides scores, strengths and improvement suggestions."
  />

</div>

</div>

</section>

</div>

);
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
      <div className="text-blue-600 mb-5">
        {icon}
      </div>

      <h3 className="text-2xl font-bold mb-4">
        {title}
      </h3>

      <p className="text-gray-600 leading-7">
        {text}
      </p>
    </div>
  );
}

export default Home;