import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center py-20">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl mb-8">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <Link href="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
} 