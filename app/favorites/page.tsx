"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { FavoritesContent } from "./FavoritesContent";

export default function FavoritesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4">
          <FavoritesContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
