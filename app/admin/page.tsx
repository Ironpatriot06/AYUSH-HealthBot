// app/admin/page.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth";

// import "@/lib/amplify";
import AdminDashboard from "@/components/admin/admin-dashboard";

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  );
}
