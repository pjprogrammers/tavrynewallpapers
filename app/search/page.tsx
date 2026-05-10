import { Suspense } from "react";
import SearchContent from "./SearchContent";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">
            Loading search...
          </p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}