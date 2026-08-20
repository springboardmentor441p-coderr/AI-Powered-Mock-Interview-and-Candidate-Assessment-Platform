import {useState} from 'react';
import {api} from '../api/client';
import {useAuth} from '../context/AuthContext';

export default function Register({goLogin}) {
  const {setAuth} = useAuth();
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try { setAuth(await api('/auth/register', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(form))})); }
    catch (err) { setError(err.message); }
  }
  return <form onSubmit={submit}><h1>Create account</h1><input name="full_name" placeholder="Full name" required/><input name="email" type="email" placeholder="Email" required/><input name="password" type="password" minLength="8" placeholder="Password (8+ characters)" required/><label className="role-select">Demo account type<select name="role" defaultValue="candidate"><option value="candidate">Candidate</option><option value="recruiter">Recruiter</option></select></label><p className="form-note">For this academic demo, choose Recruiter to test the protected recruiter dashboard.</p><button>Register</button><p className="error-message">{error}</p><a onClick={goLogin}>Back to sign in</a></form>;
}
