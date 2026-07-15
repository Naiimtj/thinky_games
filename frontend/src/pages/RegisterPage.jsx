import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { AuthForm, Field } from '../components/AuthForm';
import { useAuthStore } from '../store/useAuthStore';

const RegisterPage = () => {
  const { t } = useTranslation();
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
      title={t('auth.register.title')}
      submitLabel={t('auth.register.submitLabel')}
      onSubmit={handleSubmit}
      busy={busy}
      error={error}
      footer={
        <>
          {t('auth.register.footer')}{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400"
          >
            {t('auth.register.footerLink')}
          </Link>
        </>
      }
    >
      <Field
        label={t('auth.register.username')}
        value={form.username}
        onChange={(value) => setForm((prev) => ({ ...prev, username: value }))}
      />
      <Field
        label={t('auth.register.email')}
        type="email"
        value={form.email}
        onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
      />
      <Field
        label={t('auth.register.passwordHint')}
        type="password"
        value={form.password}
        onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
      />
    </AuthForm>
  );
};

export default RegisterPage;
