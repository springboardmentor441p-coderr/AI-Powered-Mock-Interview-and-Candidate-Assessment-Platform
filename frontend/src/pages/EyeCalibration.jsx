import { useState, useEffect, useRef } from 'react';

// Calibration points the dot will visit, in order (percentage-based positions)
const CALIBRATION_POINTS = [
  { x: 50, y: 50 },   // center
  { x: 10, y: 10 },   // top-left
  { x: 90, y: 10 },   // top-right
  { x: 90, y: 90 },   // bottom-right
  { x: 10, y: 90 },   // bottom-left
  { x: 50, y: 50 },   // back to center
];

const TIME_PER_POINT = 1500; // milliseconds the dot stays at each point

function EyeCalibration({ onComplete }) {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentPointIndex >= CALIBRATION_POINTS.length) {
      setIsComplete(true);
      // Give a short pause before moving to the interview
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCurrentPointIndex((prev) => prev + 1);
    }, TIME_PER_POINT);

    return () => clearTimeout(timer);
  }, [currentPointIndex]);

  const currentPoint = CALIBRATION_POINTS[currentPointIndex] || CALIBRATION_POINTS[CALIBRATION_POINTS.length - 1];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      {!isComplete ? (
        <>
          <p style={{ color: 'white', fontSize: '20px', marginBottom: '40px' }}>
            Follow the dot with your eyes only. Keep your head still.
          </p>
          <div style={{ position: 'relative', width: '80%', height: '60%', border: '1px solid #333' }}>
            <div
              style={{
                position: 'absolute',
                left: `${currentPoint.x}%`,
                top: `${currentPoint.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                transition: `left ${TIME_PER_POINT}ms ease-in-out, top ${TIME_PER_POINT}ms ease-in-out`,
                boxShadow: '0 0 20px #4CAF50',
              }}
            />
          </div>
        </>
      ) : (
        <p style={{ color: 'white', fontSize: '24px' }}>Calibration complete.</p>
      )}
    </div>
  );
}

export default EyeCalibration;