import { Bot } from "lucide-react";

function AIAvatar() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
      <div className="w-28 h-28 rounded-full bg-blue-100 mx-auto flex items-center justify-center">
        <Bot className="text-blue-600 w-14 h-14" />
      </div>

      <h2 className="text-2xl font-bold mt-6">
        SmartHire AI
      </h2>

      <p className="text-gray-500 mt-2">
        AI Interviewer
      </p>
    </div>
  );
}

export default AIAvatar;