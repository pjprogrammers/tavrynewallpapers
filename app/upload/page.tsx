"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, Check, Image as ImageIcon, Tag, Info, User } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    name: "",
    email: "",
    licenseAgreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an image smaller than 5MB.");
      return;
    }

    setSelectedFile(file);
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("Please select an image to upload.");
      return;
    }
    
    if (!formData.licenseAgreed) {
      alert("Please agree to the license terms.");
      return;
    }
    
    setSubmitting(true);
    
    // Here you would typically send the data to your server
    // For this demo, we'll just simulate a delay
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (error) {
      alert("An error occurred while uploading. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            {submitted ? (
              <div className="card p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check size={32} className="text-primary" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-4">Upload Successful!</h1>
                <p className="text-muted-foreground mb-8">
                  Thank you for contributing to our wallpaper collection. Your submission will be reviewed shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setSelectedFile(null);
                      setImagePreview(null);
                      setFormData({
                        title: "",
                        description: "",
                        category: "",
                        tags: "",
                        name: "",
                        email: "",
                        licenseAgreed: false,
                      });
                    }}
                    className="btn-primary"
                  >
                    Upload Another
                  </button>
                  <a href="/" className="btn-secondary">
                    Back to Home
                  </a>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2">Upload Wallpaper</h1>
                <p className="text-muted-foreground mb-8">
                  Share your amazing wallpapers with our community. High-quality images will be featured on our homepage.
                </p>
                
                <form onSubmit={handleSubmit}>
                  {/* Image Upload */}
                  <div className="mb-8">
                    <label className="block font-medium mb-2 flex items-center gap-2">
                      <ImageIcon size={18} className="text-primary" />
                      Wallpaper Image
                    </label>
                    
                    {!selectedFile ? (
                      <div
                        className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-border'} rounded-lg p-8 transition-colors text-center cursor-pointer`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center">
                          <div className="mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload size={24} className="text-primary" />
                          </div>
                          <p className="text-lg font-medium mb-1">Drag & drop your image here</p>
                          <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                          <p className="text-xs text-muted-foreground mb-2">Accepted formats: JPG, PNG, WebP</p>
                          <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative border border-border rounded-lg overflow-hidden group">
                        {imagePreview && (
                          <div className="aspect-video relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-muted transition-colors"
                              onClick={handleRemoveFile}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        <div className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="text-primary flex items-center gap-1">
                            <Check size={16} />
                            <span>Selected</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Wallpaper Information */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Info size={18} className="text-primary" />
                        Wallpaper Information
                      </h2>
                      
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                          placeholder="Enter a descriptive title"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="input w-full h-24 resize-none"
                          placeholder="Describe your wallpaper"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium mb-1">
                          Category
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                        >
                          <option value="" disabled>Select a category</option>
                          <option value="Nature">Nature</option>
                          <option value="Abstract">Abstract</option>
                          <option value="Minimal">Minimal</option>
                          <option value="Dark">Dark</option>
                          <option value="Neon">Neon</option>
                          <option value="Architecture">Architecture</option>
                          <option value="Technology">Technology</option>
                          <option value="Space">Space</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium mb-1">
                          Tags
                        </label>
                        <div className="relative">
                          <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            className="input w-full pl-9"
                            placeholder="landscape, mountains, sky (comma separated)"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Creator Information */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <User size={18} className="text-primary" />
                        Creator Information
                      </h2>
                      
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                          placeholder="Enter your name or username"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="input w-full"
                          required
                          placeholder="Your email address"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          We'll never share your email with anyone else.
                        </p>
                      </div>
                      
                      <div className="pt-4">
                        <div className="bg-muted rounded-lg p-4">
                          <h3 className="font-medium mb-2">License Information</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            By uploading, you grant PixelPulse a non-exclusive license to display and 
                            distribute your wallpaper while maintaining your copyright.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="licenseAgreed"
                              name="licenseAgreed"
                              checked={formData.licenseAgreed as boolean}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-primary"
                              required
                            />
                            <label htmlFor="licenseAgreed" className="text-sm">
                              I confirm that I own the rights to this image and agree to the terms
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="mt-8">
                    <motion.button
                      type="submit"
                      className="btn-primary py-3 w-full flex items-center justify-center gap-2 text-base"
                      disabled={submitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-t-2 border-white rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Upload Wallpaper
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 