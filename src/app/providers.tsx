
"use client";

import { Toaster } from "@/components/ui/toaster";
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
