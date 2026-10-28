import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, MailWarning, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_PROJECT_ID } from '../firebase';
import { BOUNDS } from '../validation';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register' | 'account';
  onClose: () => void;
  onOpenOrders: () => void;
  onNotify: (message: string) => void;
}

export function AuthModal({
  isOpen,
  initialMode,
  onClose,
  onOpenOrders,
  onNotify,
}: AuthModalProps) {
  const {
    user,
    displayName,
    savedShipping,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resendVerification,
    refreshVerificationStatus,
    updateDisplayName,
    signOutUser,
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(
    initialMode === 'register' ? 'register' : 'login'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editedProfileName, setEditedProfileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [providerConsoleUrl, setProviderConsoleUrl] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode === 'register') setTab('register');
    else if (initialMode === 'login') setTab('login');
    setErrorMsg(null);
    setProviderConsoleUrl(null);
    setInfoMsg(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    setEditedProfileName(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatFirebaseAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.includes('auth/operation-not-allowed')) {
      setProviderConsoleUrl(
        `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`
      );
      return 'Email/Password sign-in is not yet enabled in your Firebase project console. Use "Continue with Google" below for instant verified access, or enable Email/Password in Firebase Console.';
    }
    if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password') || raw.includes('auth/user-not-found')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (raw.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Switch to the Sign In tab.';
    }
    if (raw.includes('auth/weak-password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (raw.includes('auth/popup-closed-by-user')) {
      return 'Sign-in window was closed before completing authentication.';
    }
    return raw;
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setProviderConsoleUrl(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      onNotify('Signed in to Helios Solar.');
      onClose();
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setProviderConsoleUrl(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      onNotify('Signed in successfully.');
      onClose();
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setProviderConsoleUrl(null);

    if (name.trim().length < BOUNDS.CUSTOMER_NAME_MIN) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerWithEmail(name, email, password);
      if (result.needsVerification) {
        setInfoMsg(
          'Account created! Check your inbox for the verification link before placing orders.'
        );
      } else {
        onNotify('Customer account created.');
        onClose();
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await updateDisplayName(editedProfileName);
      onNotify('Account profile updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerified = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const verified = await refreshVerificationStatus();
      if (verified) {
        onNotify('Email verified! Your account is ready for checkout.');
        setInfoMsg(null);
      } else {
        setErrorMsg('Email not verified yet. Click the link in your verification email first.');
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account modal"
          className="absolute top-5 right-5 w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {user ? (
          <div>
            <h2 id="auth-modal-heading" className="text-xl font-bold text-slate-900 mb-1">
              Customer Account
            </h2>
            <p className="text-xs text-slate-500 mb-6">{user.email}</p>

            {!user.emailVerified ? (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MailWarning className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900">
                      Email Verification Required for Orders
                    </p>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Verify <span className="font-medium">{user.email}</span> to enable cloud cart
                      sync and order dispatch.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleCheckVerified()}
                        className="px-3 py-1.5 bg-amber-900 text-white text-xs font-semibold rounded-md hover:bg-amber-950 cursor-pointer"
                      >
                        I&apos;ve Verified — Refresh
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={async () => {
                          await resendVerification();
                          setInfoMsg('Verification email resent.');
                        }}
                        className="px-3 py-1.5 border border-amber-300 bg-white text-amber-900 text-xs font-semibold rounded-md hover:bg-amber-100 cursor-pointer"
                      >
                        Resend Email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-800 mb-6">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Verified Customer Identity · Cloud Cart Active</span>
              </div>
            )}

            {infoMsg && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                {infoMsg}
              </p>
            )}
            {errorMsg && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                {errorMsg}
              </p>
            )}

            {user.emailVerified && (
              <form onSubmit={(e) => void handleSaveProfileName(e)} className="space-y-4 mb-6">
                <div>
                  <label
                    htmlFor="profileDisplayName"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="profileDisplayName"
                      type="text"
                      maxLength={BOUNDS.DISPLAY_NAME_MAX}
                      value={editedProfileName}
                      onChange={(e) => setEditedProfileName(e.target.value)}
                      className="flex-1 min-h-[40px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 min-h-[40px] bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            )}

            {savedShipping && (
              <div className="border-t border-slate-200 pt-4 mb-6 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900">Saved Freight Address</p>
                <p>{savedShipping.shippingAddress}</p>
                <p>
                  {savedShipping.shippingCity} · {savedShipping.postalCode}
                </p>
                <p className="font-mono tabular-nums">{savedShipping.phone}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders();
                }}
                className="px-4 py-2.5 min-h-[40px] bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                View Order History
              </button>

              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  onNotify('Signed out.');
                  onClose();
                }}
                className="px-4 py-2.5 min-h-[40px] border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 id="auth-modal-heading" className="text-xl font-bold text-slate-900 mb-1">
              {tab === 'login' ? 'Sign In to Helios Solar' : 'Create Customer Account'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Save solar system configurations, sync your cart, and track equipment deliveries.
            </p>

            {/* Segmented Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg(null);
                  setProviderConsoleUrl(null);
                }}
                className={`py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg(null);
                  setProviderConsoleUrl(null);
                }}
                className={`py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Instant Verified Google OAuth Button */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleGoogleAuth()}
              className="w-full min-h-[44px] px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.54-5.17 3.54-8.97z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96h-4.01v3.14C3.505 21.3 7.615 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.535 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62h-4.01C.705 8.24.255 10.06.255 12s.45 3.76 1.27 5.38l4.01-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.615 0 3.505 2.7 1.525 6.62l4.01 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>
                {tab === 'login' ? 'Sign In with Google' : 'Create Account with Google'}
              </span>
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">or use email &amp; password</span>
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 space-y-2">
                <p>{errorMsg}</p>
                {providerConsoleUrl && (
                  <a
                    href={providerConsoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-red-900 underline"
                  >
                    <span>Open Firebase Auth Providers</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={(e) => void handleLoginSubmit(e)} className="space-y-4">
                <div>
                  <label
                    htmlFor="loginEmail"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="loginEmail"
                    type="email"
                    required
                    maxLength={BOUNDS.EMAIL_MAX}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@domain.com"
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="loginPassword"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="loginPassword"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleRegisterSubmit(e)} className="space-y-4">
                <div>
                  <label
                    htmlFor="regName"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="regName"
                    type="text"
                    required
                    maxLength={BOUNDS.CUSTOMER_NAME_MAX}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adaobi Okafor"
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="regEmail"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="regEmail"
                    type="email"
                    required
                    maxLength={BOUNDS.EMAIL_MAX}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@domain.com"
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="regPassword"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Password
                    </label>
                    <input
                      id="regPassword"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="regConfirm"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="regConfirm"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
