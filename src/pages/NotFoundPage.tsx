import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-white px-4">
      <div className="text-center">
        <img
          src="/logo.jpeg"
          alt="Logo BM"
          className="mx-auto mb-6 h-20 w-20 rounded-full border-4 border-primary/20 shadow-lg object-cover opacity-60"
        />
        <div className="mb-6 text-8xl font-black text-primary/20">404</div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Halaman Tidak Ditemukan</h1>
        <p className="mb-8 text-gray-500">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          to="/dashboard"
          className="inline-block rounded-lg bg-gradient-to-r from-primary to-primary-dark px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
