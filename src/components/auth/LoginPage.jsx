import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { Wallet, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { loginWithCredential, isLoggingIn } = useAuth();
  const [error, setError] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    setError(null);
    const res = await loginWithCredential(credentialResponse.credential);
    if (!res.success) {
      setError(res.error || 'Login failed. Please try again.');
    }
  };

  const handleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-panel max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Wallet className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Welcome to FinFlow
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Sign in to access your personal dashboard.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm font-medium">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Show spinner while verifying with backend — Google button stays mounted */}
        {isLoggingIn ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Signing you in…</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="filled_blue"
              size="large"
              shape="pill"
            />
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          Secure authentication provided by Google.
        </div>
      </div>
    </div>
  );
}
