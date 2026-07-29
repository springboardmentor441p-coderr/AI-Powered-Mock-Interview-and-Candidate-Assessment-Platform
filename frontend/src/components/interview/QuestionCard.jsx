function QuestionCard({ question }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">
        Current Question
      </h2>

      <p className="text-lg text-gray-700 leading-8">
        {question || "Waiting for AI to ask the first question..."}
      </p>
    </div>
  );
}

export default QuestionCard;