import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { checkIn, checkOut, keterangan, paraf, tanggal, userId } = await req.json();
    if (!userId || !tanggal || !paraf) {
      return NextResponse.json({ error: "Data wajib diisi." }, { status: 400 });
    }
    // Simpan attendance
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: new Date(tanggal),
        checkIn: checkIn ? new Date(`${tanggal}T${checkIn}`) : null,
        checkOut: checkOut ? new Date(`${tanggal}T${checkOut}`) : null,
        keterangan, // <-- tambahkan ini
        signature: {
          create: {
            imageData: paraf,
          },
        },
        // keterangan bisa disimpan di kolom baru jika ada, atau di signature.imageData jika tidak ada kolom
      },
      include: { signature: true },
    });
    return NextResponse.json({ success: true, attendance });
  } catch (err) {
    console.error('API ABSENSI ERROR:', err);
    return NextResponse.json({ error: "Gagal simpan absen.", detail: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: "userId wajib diisi." }, { status: 400 });
    }
    const attendances = await prisma.attendance.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { date: 'desc' },
      include: { signature: true },
    });
    return NextResponse.json({ success: true, attendances });
  } catch (err) {
    return NextResponse.json({ error: "Gagal ambil data absen." }, { status: 500 });
  }
} 