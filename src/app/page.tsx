'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal login.");
      } else {
        // Simpan userId dan userName ke localStorage
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        // router.push("/dashboard");
        router.push("/absensi"); // ganti ke halaman utama setelah login
      }
    } catch (err) {
      setError("Gagal login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Login..." : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          Belum punya akun?{' '}
          <a href="/register" className="text-blue-600 hover:underline">Daftar</a>
        </div>
      </div>
    </div>
  );
}
