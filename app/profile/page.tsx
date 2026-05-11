import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-green-400">
        <p>
          Please <Link href="/login" className="underline">sign in</Link> to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl perspective-1000">
        {/* 3D Card */}
        <div className="transform-style-preserve-3d transition-transform duration-500 hover:rotate-y-5 hover:rotate-x-5 bg-green-900/20 backdrop-blur-md rounded-2xl border border-green-500/30 shadow-2xl">
          {/* Profile Image */}
          <div className="absolute inset-0">
            <img
              src={user.photoURL || "/globe.svg"}
              alt="User avatar"
              className="w-full h-full object-cover rounded-2xl opacity-90"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 text-center text-green-400">
            <h1 className="text-4xl font-bold mb-4">{user.displayName || "User"}</h1>
            <p className="text-xl mb-6">{user.email}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-green-900/30 rounded-xl border border-green-500/20">
                <p className="text-2xl font-semibold">128</p>
                <p className="text-sm">Wallpapers</p>
              </div>
              <div className="p-4 bg-green-900/30 rounded-xl border border-green-500/20">
                <p className="text-2xl font-semibold">2.4K</p>
                <p className="text-sm">Downloads</p>
              </div>
            </div>

            {/* Bio */}
            <p className="max-w-md mx-auto mb-6 text-green-300/80">
              Passionate about creating beautiful digital experiences. Exploring the intersection of art and technology through wallpaper design.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/wallpaper/upload"
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 border border-green-400/20"
              >
                Upload Wallpaper
              </Link>

              <Link
                href="/settings"
                className="flex-1 px-6 py-3 border border-green-500/30 bg-green-900/20 hover:bg-green-900/30 text-green-400 font-medium rounded-xl transition-all duration-300 hover:scale-105"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-4 right-4 w-16 h-16 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
    </div>
  );
};

export default ProfilePage;