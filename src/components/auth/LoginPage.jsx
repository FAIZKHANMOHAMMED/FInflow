import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  const { loginWithCredential } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    const res = await loginWithCredential(credentialResponse.credential);
    if (!res.success) {
      alert(res.error || 'Login failed');
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
    alert('Google Login Failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Welcome to FinFlow
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Sign in to access your personal dashboard.
          </p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_blue"
            size="large"
            shape="pill"
          />
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          Secure authentication provided by Google.
        </div>
      </div>
    </div>
  );
}
