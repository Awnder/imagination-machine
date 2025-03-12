"use client";

import Image from "next/image";
import Link from "next/link";
import MultiStepForm from "@/_components/MultiStepForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-2">
      <MultiStepForm />
    </div>
  );
}
