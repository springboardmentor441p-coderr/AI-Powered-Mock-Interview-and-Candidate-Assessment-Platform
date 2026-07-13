import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="text-center py-20 bg-gray-100">

      <h1 className="text-5xl font-bold text-blue-600">
        Welcome to SmartHire AI
      </h1>

      <p className="mt-6 text-lg text-gray-600">
        Upload your resume, practice AI interviews,
        and improve your confidence.
      </p>

      <button
        onClick={() => navigate("/upload")}
        className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Get Started
      </button>

    </section>
  );
}

export default Hero;