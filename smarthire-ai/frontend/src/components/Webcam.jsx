import { forwardRef, useEffect } from 'react';

const Webcam = forwardRef(({ stream }, ref) => {
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream, ref]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-slate-700/50 bg-slate-900 group">
      <video
        ref={ref}
        autoPlay
        muted
        playsInline
        className="w-full aspect-video object-cover transform -scale-x-100 transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
});

Webcam.displayName = 'Webcam';
export default Webcam;
