import Navbar from './components/Navbar/Navbar.jsx';
import AppRoutes from './routes.jsx';

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
