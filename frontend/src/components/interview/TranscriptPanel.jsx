function TranscriptPanel({ transcript }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 h-[350px] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">
        Live Transcript
      </h2>

      <pre className="whitespace-pre-wrap text-gray-700 leading-7">
        {transcript || "Transcript will appear here..."}
      </pre>
    </div>
  );
}

export default TranscriptPanel;