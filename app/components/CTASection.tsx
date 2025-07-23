"use client";

import { motion } from "framer-motion";
import { Upload, Users } from "lucide-react";
import Link from "next/link";

const CTASection = () => {
  return (
    <section className="py-16 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted -z-10"></div>
      
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[10rem] -z-5"></div>
      <div className="absolute top-0 left-0 w-[20rem] h-[20rem] rounded-full bg-secondary/5 blur-[8rem] -z-5"></div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-card rounded-2xl overflow-hidden border border-border shadow-xl shadow-black/20">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left column with text content */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Join Our Community</h2>
                <p className="text-muted-foreground mb-6">
                  Share your amazing wallpapers with millions of users worldwide or browse our 
                  growing collection of high-quality wallpapers.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/upload" className="btn-primary py-3 flex items-center justify-center gap-2 w-full">
                      <Upload size={18} />
                      Upload Wallpaper
                    </Link>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/signup" className="btn-secondary py-3 flex items-center justify-center gap-2 w-full">
                      <Users size={18} />
                      Join Community
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            {/* Right column with grid pattern */}
            <div className="bg-muted relative overflow-hidden hidden md:block">
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/5"></div>
              
              {/* Floating elements */}
              <motion.div
                className="absolute w-20 h-20 rounded-lg bg-primary/20 backdrop-blur-md"
                initial={{ x: '20%', y: '30%', rotate: 0 }}
                animate={{ x: '25%', y: '25%', rotate: 10 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 5,
                  ease: "easeInOut"
                }}
              />
              
              <motion.div
                className="absolute w-16 h-16 rounded-full bg-secondary/20 backdrop-blur-md"
                initial={{ x: '60%', y: '50%', scale: 1 }}
                animate={{ x: '65%', y: '55%', scale: 1.1 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 7,
                  ease: "easeInOut"
                }}
              />
              
              <motion.div
                className="absolute w-28 h-28 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-md border border-white/10"
                initial={{ x: '70%', y: '20%', rotate: -5 }}
                animate={{ x: '75%', y: '15%', rotate: 5 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 9,
                  ease: "easeInOut"
                }}
              />
              
              {/* Central icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="w-24 h-24 flex items-center justify-center rounded-full bg-background/50 backdrop-blur-md shadow-lg animate-glow"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1 }}
                >
                  <span className="text-5xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
                    PP
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

// CSS to be added to globals.css
// Add this to globals.css:
// .bg-grid-pattern {
//   background-image: linear-gradient(to right, rgb(255 255 255 / 0.1) 1px, transparent 1px),
//                      linear-gradient(to bottom, rgb(255 255 255 / 0.1) 1px, transparent 1px);
//   background-size: 20px 20px;
// } 