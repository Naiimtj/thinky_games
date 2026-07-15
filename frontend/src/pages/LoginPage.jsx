import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthForm, Field } from '../components/AuthForm';
import { useAuthStore } from '../store/useAuthStore';

const LoginPage = () => {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthForm
      title={t('auth.login.title')}
      submitLabel={t('auth.login.submitLabel')}
      onSubmit={handleSubmit}
      busy={busy}
      error={error}
      footer={
        <>
          {t('auth.login.footer')}{' '}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 dark:text-indigo-400"
          >
            {t('auth.login.footerLink')}
          </Link>
        </>
      }
    >
      <Field
        label={t('auth.login.username')}
        value={form.username}
        onChange={(value) => setForm((prev) => ({ ...prev, username: value }))}
      />
      <Field
        label={t('auth.login.password')}
        type="password"
        value={form.password}
        onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
      />
    </AuthForm>
  );
};

export default LoginPage;
