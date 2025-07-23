"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Image as ImageIcon, Users, Heart } from "lucide-react";

// Mock data
const stats = [
  {
    label: "Total Wallpapers",
    value: 5000,
    icon: ImageIcon,
  },
  {
    label: "Total Downloads",
    value: 1500000,
    icon: Download,
  },
  {
    label: "Happy Users",
    value: 250000,
    icon: Users,
  },
  {
    label: "Favorites",
    value: 750000,
    icon: Heart,
  },
];

// Counter animation component
const CounterAnimation = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!countRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const increment = Math.ceil(value / (duration * 60));
          let currentCount = 0;
          
          const interval = setInterval(() => {
            currentCount += increment;
            if (currentCount >= value) {
              setCount(value);
              clearInterval(interval);
            } else {
              setCount(currentCount);
            }
          }, 1000 / 60); // 60fps
          
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observerRef.current.observe(countRef.current);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [value, duration]);

  // Format the number with commas
  const formattedCount = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return <span ref={countRef}>{formattedCount}</span>;
};

const StatsSection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-[8rem] -z-10"></div>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Our Wallpapers in Numbers
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            PixelPulse has become the go-to resource for high-quality wallpapers,
            serving millions of users worldwide.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="card flex flex-col items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
            >
              <div className="mb-4 p-3 rounded-full bg-primary/10">
                <stat.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <CounterAnimation value={stat.value} />
              </h3>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 