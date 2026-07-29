import { CheckCircle } from "lucide-react";

function InterviewTips() {
  const tips = [
    "Speak clearly",
    "Answer confidently",
    "Give practical examples",
    "Maintain a professional tone",
  ];

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-5">
        Interview Tips
      </h2>

      <div className="space-y-4">
        {tips.map((tip) => (
          <div key={tip} className="flex gap-3 items-center">
            <CheckCircle className="text-green-600 w-5 h-5" />
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InterviewTips;