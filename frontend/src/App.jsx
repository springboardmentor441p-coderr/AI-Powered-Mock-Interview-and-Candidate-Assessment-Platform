import Navbar from './components/Navbar/Navbar.jsx';
import { InterviewProvider } from './context/InterviewContext.jsx';
import AppRoutes from './routes.jsx';

function App() {
  return (
    <InterviewProvider>
      <div className="app-container">
        <Navbar />
        <main>
          <AppRoutes />
        </main>
      </div>
    </InterviewProvider>
  );
}

export default App;
