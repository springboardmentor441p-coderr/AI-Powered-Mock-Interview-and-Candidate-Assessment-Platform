function TimerCard({ time }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
      <p className="text-gray-500">Interview Time</p>

      <h2 className="text-5xl font-bold text-red-500 mt-3">
        {time}
      </h2>
    </div>
  );
}

export default TimerCard;