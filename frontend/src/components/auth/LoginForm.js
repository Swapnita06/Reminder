import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';


const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

export default function LoginForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          {...register('email')}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="Enter your email"
        />
        {errors.email && <span className="error-message">{errors.email.message}</span>}
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          {...register('password')}
          className={`form-input ${errors.password ? 'error' : ''}`}
          placeholder="Enter your password"
        />
        {errors.password && <span className="error-message">{errors.password.message}</span>}
      </div>
      <button type="submit" className="auth-button" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}