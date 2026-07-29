function ProgressBar() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <div className="flex justify-between mb-3">
        <h2 className="font-semibold">Interview Progress</h2>
        <span>In Progress</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-blue-600 h-3 rounded-full w-2/5"></div>
      </div>
    </div>
  );
}

export default ProgressBar;