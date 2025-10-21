"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, UserMinus } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import DateDisplay from "@/app/components/DateDisplay";

export default function AdminDashboardPage() {
  const dataGuru = [
    { name: "Minggu 1", hadir: 20, izin: 2, alfa: 1 },
    { name: "Minggu 2", hadir: 21, izin: 1, alfa: 0 },
    { name: "Minggu 3", hadir: 19, izin: 3, alfa: 1 },
    { name: "Minggu 4", hadir: 22, izin: 0, alfa: 0 },
  ];

  const dataSiswa = [
    { name: "Minggu 1", hadir: 180, izin: 8, alfa: 4 },
    { name: "Minggu 2", hadir: 185, izin: 6, alfa: 3 },
    { name: "Minggu 3", hadir: 178, izin: 9, alfa: 6 },
    { name: "Minggu 4", hadir: 190, izin: 5, alfa: 2 },
  ];

  return (
    <div className="p-6 space-y-6 ps-20 pt-10">
      <span className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-2 md:mb-3 flex-1">
        <DateDisplay />
      </span>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Guru</p>
              <h2 className="text-2xl font-bold">24</h2>
            </div>
            <Users className="w-6 h-6 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Guru Hadir</p>
              <h2 className="text-2xl font-bold">22</h2>
            </div>
            <UserCheck className="w-6 h-6 text-green-600" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Guru Izin</p>
              <h2 className="text-2xl font-bold">1</h2>
            </div>
            <UserMinus className="w-6 h-6 text-yellow-500" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Guru Alfa</p>
              <h2 className="text-2xl font-bold">1</h2>
            </div>
            <UserX className="w-6 h-6 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Siswa</p>
              <h2 className="text-2xl font-bold">200</h2>
            </div>
            <Users className="w-6 h-6 text-blue-600" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Siswa Hadir</p>
              <h2 className="text-2xl font-bold">190</h2>
            </div>
            <UserCheck className="w-6 h-6 text-green-600" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Siswa Izin</p>
              <h2 className="text-2xl font-bold">6</h2>
            </div>
            <UserMinus className="w-6 h-6 text-yellow-500" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Siswa Alfa</p>
              <h2 className="text-2xl font-bold">4</h2>
            </div>
            <UserX className="w-6 h-6 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tren Kehadiran Guru</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dataGuru}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hadir" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="izin" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="alfa" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tren Kehadiran Siswa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dataSiswa}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hadir" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="izin" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="alfa" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Ringkasan Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm leading-relaxed text-muted-foreground">
            Hari ini, <span className="font-semibold text-green-600">22 guru</span> hadir,
            <span className="font-semibold text-yellow-600"> 1 izin</span>, dan
            <span className="font-semibold text-red-600"> 1 alfa</span>. Dari total
            <span className="font-semibold text-blue-600"> 200 siswa</span>, sebanyak
            <span className="font-semibold text-green-600"> 190 hadir</span>,<span className="font-semibold text-yellow-600"> 6 izin</span>, dan
            <span className="font-semibold text-red-600"> 4 alfa</span>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
