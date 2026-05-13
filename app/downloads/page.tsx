"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { DownloadsContent } from "./DownloadsContent";

export default function DownloadsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4">
          <DownloadsContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
