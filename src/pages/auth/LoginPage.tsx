import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Brand / Logo */}
      <div className="hidden w-1/2 bg-gradient-to-br from-primary via-primary-dark to-[#004F73] lg:flex lg:flex-col lg:items-center lg:justify-center relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/4 right-10 h-20 w-20 rounded-full bg-secondary/10" />

        <div className="relative z-10 text-center text-white px-8">
          <img
            src="/logo.jpeg"
            alt="Logo Bhayu Manunggal"
            className="mx-auto mb-8 h-40 w-40 rounded-full border-4 border-white/30 shadow-2xl object-cover"
          />
          <h1 className="mb-3 text-4xl font-black tracking-wide">SIPBM</h1>
          <div className="mx-auto mb-4 h-1 w-24 rounded bg-secondary" />
          <p className="text-xl font-semibold opacity-95">Sistem Informasi Pencak Silat</p>
          <p className="mt-2 text-lg opacity-70">POPSI Bhayu Manunggal</p>
          <p className="mt-6 text-sm opacity-50 max-w-xs mx-auto">
            Kelola data anggota, pelatih, jadwal latihan, dan presensi dalam satu platform terintegrasi
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <img
              src="/logo.jpeg"
              alt="Logo Bhayu Manunggal"
              className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-primary/30 shadow-lg object-cover"
            />
            <h1 className="text-3xl font-black text-primary">SIPBM</h1>
            <p className="text-sm text-gray-500">POPSI Bhayu Manunggal</p>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-900">Masuk ke Akun</h2>
          <p className="mb-8 text-gray-500">Silakan masuk untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="contoh@bmayu.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Masukkan password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm text-gray-600">Ingat saya</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                Lupa password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-dark py-3.5 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            © 2026 SIPBM — POPSI Bhayu Manunggal. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
