import React from "react";
import { Link } from "react-router-dom";

const candidateEmail = localStorage.getItem("candidateEmail");
console.log("Navbar candidateEmail:", candidateEmail);
function Navbar() {

  return (
    <nav className="bg-blue-600 text-white px-8 py-4 shadow">

      <div className="max-w-6xl mx-auto flex justify-between items-center">


        <h1 className="text-2xl font-bold">
          SmartHire AI
        </h1>


        <div className="flex gap-6">

          <Link to="/">
            Upload
          </Link>


          <Link to="/dashboard">
            Candidate
          </Link>


          <Link to="/recruiter">
            Recruiter
          </Link>


          <Link to="/interview">
            Interview
          </Link>

<Link to="/results">
    Results
</Link>


        </div>


      </div>

    </nav>
  );
}

export default Navbar;