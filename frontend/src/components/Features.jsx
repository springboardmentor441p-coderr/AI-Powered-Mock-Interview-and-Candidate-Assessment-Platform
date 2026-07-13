function Features() {
  return (
    <section className="py-16">

      <h2 className="text-3xl font-bold text-center">
        Features
      </h2>

      <div className="flex justify-center gap-8 mt-10">

        <div className="border rounded-lg p-6 w-64">
          <h3 className="font-bold">📄 Resume Analysis</h3>
          <p>Extract candidate details automatically.</p>
        </div>

        <div className="border rounded-lg p-6 w-64">
          <h3 className="font-bold">🎤 AI Interview</h3>
          <p>Practice interviews with AI.</p>
        </div>

        <div className="border rounded-lg p-6 w-64">
          <h3 className="font-bold">📊 Feedback</h3>
          <p>Receive performance analysis.</p>
        </div>

      </div>

    </section>
  );
}

export default Features;