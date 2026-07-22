import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button/Button.jsx';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  return (
    <section className="home">
      <div className="home__content">
        <p className="page-kicker">AI-Powered Candidate Practice</p>
        <h1>AI-Powered Mock Interview and Candidate Assessment Platform</h1>
        <p className="home__description">
          Practice interviews with resume-aware prompts, structured feedback, and voice-ready
          workflows built for focused preparation.
        </p>
        <Button onClick={() => navigate('/resume-upload')}>Start Interview</Button>
      </div>
    </section>
  );
}

export default Home;
