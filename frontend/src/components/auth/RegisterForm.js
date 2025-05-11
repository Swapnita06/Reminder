import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';


const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  phone: yup.string().matches(/^[0-9]+$/, 'Phone must contain only numbers').optional()
});

export default function RegisterForm({ onSubmit }) {
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
        <label>Username</label>
        <input
          {...register('username')}
          className={`form-input ${errors.username ? 'error' : ''}`}
          placeholder="Enter your username"
        />
        {errors.username && <span className="error-message">{errors.username.message}</span>}
      </div>
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
      <div className="form-group">
        <label>Phone (Optional)</label>
        <input
          {...register('phone')}
          className={`form-input ${errors.phone ? 'error' : ''}`}
          placeholder="Enter your phone number"
        />
        {errors.phone && <span className="error-message">{errors.phone.message}</span>}
      </div>
      <button type="submit" className="auth-button" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}