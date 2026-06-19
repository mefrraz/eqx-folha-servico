"use client";

import Link from "next/link";

export default function AddUserButton() {
  return (
    <Link href="/auth/signup" className="btn-primary text-sm !py-2 !px-4">
      Adicionar utilizador
    </Link>
  );
}
