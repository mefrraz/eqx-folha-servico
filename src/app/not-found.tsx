import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <h2 className="text-xl font-semibold text-gray-900">Página não encontrada</h2>
        <p className="text-sm text-gray-500">
          A página que procura não existe ou foi removida.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
