# Tavryne Wallpapers - Adding New Wallpapers Guide

This guide shows you how to add more wallpapers to your Tavryne Wallpapers collection by editing the `app/lib/wallpapers.ts` file.

## Method 1: Adding Individual Wallpapers (Best for Custom Details)

Edit `app/lib/wallpapers.ts` and add new entries at line 163 (after wallpaper #10 and before the loop):

```typescript
// Add new wallpapers here (after wallpaper #10)
{
  id: "41",
  title: "Your New Wallpaper Title", 
  description: "Description of your new wallpaper",
  filename: "41.jpg",  // Make sure this matches your image filename
  slug: "your-wallpaper-slug", // URL-friendly version of title
  categoryId: "nature", // Use one of the existing category IDs
  tags: ["4k", "mountain", "night"], // Use existing tag IDs
  views: 1500,
  downloads: 700,
  featured: true, // Set to true if you want it featured
  trending: true, // Set to true if you want it trending
  uploadDate: "2024-05-01", // Current or recent date
  resolution: "3840x2160" // Actual resolution of your wallpaper
},
```

**Category IDs you can use** (from lines 25-36):
- `abstract`, `nature`, `animals`, `space`, `dark`, `minimal`, `technology`, `cars`, `anime`, `architecture`

**Tag IDs you can use** (from lines 39-55):
- `4k`, `5k`, `8k`, `hd`, `dark`, `gradient`, `black`, `blue`, `green`, `red`, `space`, `mountain`, `forest`, `ocean`, `night`

## Method 2: Modifying the Loop for Bulk Addition

Edit line 167 in `app/lib/wallpapers.ts`:

```typescript
// Line 167: Change the loop range
for (let i = 11; i <= 60; i++) {  // Change 40 to 60 to add 20 more wallpapers
  // Rest of the code remains unchanged
}
```

This approach automatically generates wallpapers using the pattern established for wallpapers 11-40.

## Method 3: Adding a Helper Function (Most Flexible)

Add this function at the end of the file (around line 296):

```typescript
// Helper function to easily add new wallpapers
export function addNewWallpaper(
  id: number, 
  title: string, 
  description: string,
  categoryId: string,
  tags: string[] = ["4k"],
  featured: boolean = false,
  trending: boolean = false,
  resolution: string = "3840x2160"
) {
  const newId = id.toString();
  const filename = `${id}.jpg`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const newWallpaper: Wallpaper = {
    id: newId,
    title,
    description,
    filename,
    slug,
    categoryId,
    tags,
    views: 1000 + (id * 50),
    downloads: 500 + (id * 25),
    featured,
    trending,
    uploadDate: new Date().toISOString().split('T')[0],
    resolution
  };
  
  wallpapers.push(newWallpaper);
  
  // Update category count
  const category = getCategoryById(categoryId);
  if (category && category.count) {
    category.count += 1;
  }
  
  return newWallpaper;
}
```

Then add these example calls right before the "Update category counts" line (line 192):

```typescript
// Add your wallpapers using the helper function
addNewWallpaper(41, "Mountain Sunset", "Beautiful mountain sunset view", "nature", ["4k", "mountain"], true);
addNewWallpaper(42, "Ocean Waves", "Peaceful ocean waves at sunset", "nature", ["5k", "ocean"], false, true);
addNewWallpaper(43, "Cyberpunk City", "Futuristic cyberpunk cityscape", "abstract", ["4k", "dark"], true, true);
// Add more wallpapers as needed
```

## Step-by-Step Instructions

1. **Place your wallpaper image files:**
   - Save your wallpaper images in the `/public/wallpapers/` directory
   - Name files numerically (e.g., `41.jpg`, `42.jpg`, etc.)
   - Use high-quality JPG files with the appropriate resolution

2. **Edit `app/lib/wallpapers.ts`:**
   - Choose one of the methods above
   - Make the necessary changes to the file
   - Save the file

3. **Restart the Next.js server:**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` to restart

4. **Verify your changes:**
   - Check the homepage to see if new wallpapers appear
   - Test the wallpaper detail pages
   - Ensure all images load correctly

## Troubleshooting

If your wallpapers don't appear:

1. **Check file paths and extensions:**
   - Ensure images are in `/public/wallpapers/`
   - Verify the extension in the code matches your actual files (jpg vs png)

2. **Check for typos in category or tag IDs:**
   - Make sure you're using exact category and tag IDs from the lists above

3. **Check for duplicate IDs:**
   - Each wallpaper must have a unique ID

4. **Verify image loading:**
   - Check browser console for any 404 errors
   - Ensure image dimensions are appropriate

## Example of Complete Wallpaper Entry

```typescript
{
  id: "41",
  title: "Aurora Borealis",
  description: "Northern lights illuminating the night sky above snowy mountains",
  filename: "41.jpg",
  slug: "aurora-borealis",
  categoryId: "nature",
  tags: ["4k", "night", "space"],
  views: 3050,
  downloads: 1550,
  featured: true,
  trending: true,
  uploadDate: "2024-05-01",
  resolution: "3840x2160"
}
```

Remember to restart your Next.js server after making changes to see the new wallpapers! 