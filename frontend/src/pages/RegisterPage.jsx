import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthForm, Field } from '../components/AuthForm';
import { useAuthStore } from '../store/useAuthStore';

const RegisterPage = () => {
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthForm
      title="Crear cuenta"
      submitLabel="Registrarse"
      onSubmit={handleSubmit}
      busy={busy}
      error={error}
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400"
          >
            Entra
          </Link>
        </>
      }
    >
      <Field
        label="Usuario"
        value={form.username}
        onChange={(value) => setForm((prev) => ({ ...prev, username: value }))}
      />
      <Field
        label="Email"
        type="email"
        value={form.email}
        onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
      />
      <Field
        label="Contraseña (mín. 8 caracteres)"
        type="password"
        value={form.password}
        onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
      />
    </AuthForm>
  );
};

export default RegisterPage;
