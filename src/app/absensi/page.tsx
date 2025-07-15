'use client';

import React, { useRef, useState, useEffect } from 'react';
import SignaturePadWrapper from '../../components/SignaturePadWrapper';
import { useRouter } from 'next/navigation';
import './absensi-print.css';

interface AbsensiRow {
  id: number;
  tanggal: string;
  hari: string;
  checkIn: string;
  checkOut: string;
  paraf: string; // base64 image
  keterangan: string;
}

function getToday() {
  const now = new Date();
  const hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const tanggal = now.toLocaleDateString('id-ID');
  return { hari, tanggal };
}

export default function AbsensiPage() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [rows, setRows] = useState<AbsensiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isFormAnimating, setIsFormAnimating] = useState(false);
  const sigPadRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        router.replace("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName");
      if (storedName) setUserName(storedName);
    }
  }, []);

  const handleToggleForm = () => {
    if (showForm) {
      // Closing form
      setIsFormAnimating(true);
      setTimeout(() => {
        setShowForm(false);
        setIsFormAnimating(false);
      }, 400);
    } else {
      // Opening form
      setShowForm(true);
      setIsFormAnimating(true);
      setTimeout(() => {
        setIsFormAnimating(false);
      }, 400);
    }
  };

  const handleAbsen = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { hari, tanggal } = getToday();
    const paraf = sigPadRef.current?.getTrimmedCanvas().toDataURL() || '';
    
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn,
          checkOut,
          keterangan,
          paraf,
          tanggal: new Date().toISOString().slice(0, 10),
          userId: parseInt(userId),
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Refresh data dari database
        const res2 = await fetch(`/api/absensi?userId=${userId}`);
        const data2 = await res2.json();
        
        if (res2.ok) {
          setRows(
            data2.attendances.map((a: any, idx: number) => ({
              id: a.id,
              hari: new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long' }),
              tanggal: new Date(a.date).toLocaleDateString('id-ID'),
              checkIn: a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
              checkOut: a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
              paraf: a.signature?.imageData || '',
              keterangan: a.keterangan || '',
            }))
          );
        }
        
        // Reset form
        setCheckIn('');
        setCheckOut('');
        setKeterangan('');
        sigPadRef.current?.clear();
        
        // Close form with animation
        setIsFormAnimating(true);
        setTimeout(() => {
          setShowForm(false);
          setIsFormAnimating(false);
        }, 400);
        
        // Show success message
        showToast('Absensi berhasil disimpan!', 'success');
      } else {
        showToast(data.error || 'Gagal simpan absen', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan saat menyimpan absen', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Get user ID from localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';

  useEffect(() => {
    const fetchAbsensi = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/absensi?userId=${userId}`);
        const data = await res.json();
        if (res.ok) {
          setRows(
            data.attendances.map((a: any, idx: number) => ({
              id: a.id,
              hari: new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long' }),
              tanggal: new Date(a.date).toLocaleDateString('id-ID'),
              checkIn: a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
              checkOut: a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '',
              paraf: a.signature?.imageData || '',
              keterangan: a.keterangan || '',
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching absensi:', error);
      }
    };
    fetchAbsensi();
  }, [userId]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/user/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setUserName(data.user.name);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
      setLoadingUser(false);
    };
    fetchUser();
  }, [userId]);

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md print:hidden border-b-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="text-center sm:text-left">
              <h1 className="text-xl font-bold text-gray-800">Sistem Absensi</h1>
              <p className="text-sm text-gray-700 font-medium">PT. MOYVERONIKA</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-gray-800 font-medium truncate max-w-[120px] sm:max-w-none">
                {loadingUser ? 'Loading...' : userName}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Simple Stats */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-5 mb-4 sm:mb-6 print:hidden border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-6 sm:space-x-10 w-full sm:w-auto justify-between sm:justify-start">
              <div className="text-center">
                <p className="text-sm text-gray-700 font-medium">Total Absensi</p>
                <p className="text-2xl font-bold text-blue-600">{rows.length}</p>
              </div>
            </div>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
              <button
                onClick={handleToggleForm}
                className="px-4 sm:px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md w-1/2 sm:w-auto"
              >
                {showForm ? 'Tutup Form' : 'Tambah Absensi'}
              </button>
              <button
                onClick={handlePrint}
                className="px-4 sm:px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md w-1/2 sm:w-auto"
              >
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Form Absensi with Modern Animation */}
        <div className={`overflow-hidden transition-all duration-500 ease-out ${
          showForm ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className={`bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6 print:hidden border border-gray-200 transform transition-all duration-400 ease-out ${
            showForm && !isFormAnimating 
              ? 'opacity-100 scale-100 translate-y-0 rotate-0' 
              : 'opacity-0 scale-95 translate-y-8 -rotate-1'
          } backdrop-blur-sm`}> 
            <div className={`transition-all duration-300 delay-100 ${
              showForm && !isFormAnimating 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}>
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                Form Absensi
              </h2>
              <form onSubmit={handleAbsen} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div className={`transition-all duration-300 delay-200 ${
                    showForm && !isFormAnimating 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-4'
                  }`}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Check In
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-blue-400 focus:shadow-lg"
                      value={checkIn}
                      onChange={e => setCheckIn(e.target.value)}
                      required
                    />
                  </div>
                  <div className={`transition-all duration-300 delay-300 ${
                    showForm && !isFormAnimating 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 translate-x-4'
                  }`}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Check Out
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-blue-400 focus:shadow-lg"
                      value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                    />
                  </div>
                </div>
                <div className={`transition-all duration-300 delay-400 ${
                  showForm && !isFormAnimating 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-all duration-200 hover:border-blue-400 focus:shadow-lg"
                    value={keterangan}
                    onChange={e => setKeterangan(e.target.value)}
                    placeholder="Keterangan (opsional)"
                  />
                </div>
                <div className={`transition-all duration-300 delay-500 ${
                  showForm && !isFormAnimating 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95'
                }`}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanda Tangan
                  </label>
                  <div className="border-2 border-dashed border-gray-400 rounded-lg p-2 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-gray-50 transition-all duration-300">
                    <div className="bg-white rounded-lg shadow-inner" style={{ width: '100%', maxWidth: 600, height: 200, margin: '0 auto' }}>
                      <SignaturePadWrapper
                        ref={sigPadRef}
                        penColor="black"
                        minWidth={1}
                        maxWidth={2}
                        velocityFilterWeight={0.9}
                        minDistance={1}
                        throttle={8}
                        canvasProps={{
                          width: 600,
                          height: 200,
                          style: {
                            touchAction: 'none',
                            cursor: 'crosshair',
                            display: 'block',
                            width: '100%',
                            height: '200px',
                            maxWidth: '600px',
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => sigPadRef.current?.clear()}
                      className="mt-3 px-4 py-2 text-sm text-red-600 bg-red-100 rounded-lg hover:bg-red-200 font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      Hapus Tanda Tangan
                    </button>
                  </div>
                </div>
                <div className={`flex justify-end space-x-3 transition-all duration-300 delay-600 ${
                  showForm && !isFormAnimating 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}>
                  <button
                    type="button"
                    onClick={handleToggleForm}
                    className="px-5 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Tabel Absensi */}
        <div className="bg-white rounded-lg shadow-md print-table border border-gray-200 overflow-x-auto">
          {/* Print Header */}
          <div className="hidden print:block text-center py-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ABSEN KARYAWAN MAGANG PT.MOYVERONIKA
            </h1>
            <p className="text-lg text-gray-700 mb-1">
              Nama: {loadingUser ? 'Loading...' : userName}
            </p>
            <p className="text-lg text-gray-700">
              Bulan Juli 2025
            </p>
          </div>

          {/* Screen Header */}
          <div className="p-3 sm:p-5 border-b border-gray-200 print:hidden">
            <h2 className="text-lg font-bold text-gray-800">Riwayat Absensi</h2>
            <p className="text-sm text-gray-700 font-medium">{rows.length} total absensi</p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] sm:min-w-0 text-xs sm:text-sm print:border print:border-black print:border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase print:border print:border-black">
                    No
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase print:border print:border-black">
                    Hari/Tanggal
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase print:border print:border-black">
                    Check In
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase print:border print:border-black">
                    Check Out
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase print:border print:border-black">
                    Tanda Tangan
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase print:border print:border-black">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 sm:px-4 py-8 text-center text-gray-600 font-medium">
                      Belum ada data absensi
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50 border-b border-gray-100 transition-all duration-200 hover:shadow-sm">
                      <td className="px-2 sm:px-4 py-2 sm:py-4 text-sm text-gray-800 font-medium print:border print:border-black">{idx + 1}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 text-sm text-gray-800 print:border print:border-black">
                        <div>
                          <p className="font-semibold text-gray-900">{row.hari}</p>
                          <p className="text-gray-700">{row.tanggal}</p>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 text-sm text-gray-800 font-medium print:border print:border-black">{row.checkIn || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 text-sm text-gray-800 font-medium print:border print:border-black">{row.checkOut || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 text-sm text-gray-800 print:border print:border-black">
                        {row.paraf ? (
                          <img 
                            src={row.paraf} 
                            alt="Tanda Tangan" 
                            className="h-10 w-auto max-w-full"
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-4 text-sm text-gray-800 print:border print:border-black">{row.keterangan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}