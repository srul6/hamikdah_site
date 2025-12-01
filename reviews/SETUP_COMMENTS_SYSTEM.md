# 📝 Comments System Setup Guide

## Step 1: Create the Comments Table in Supabase

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to SQL Editor** (icon on the left sidebar)
3. **Click "New Query"**
4. **Copy and paste** the entire contents of `backend/CREATE_COMMENTS_TABLE.sql`
5. **Click "Run"** to execute the SQL

This will create:
- ✅ A `comments` table with all necessary columns
- ✅ Indexes for better performance
- ✅ Row Level Security policies
- ✅ Auto-update trigger for `updated_at` field

## Step 2: Seed the Comments Data

Once the table is created, run the seed script:

```bash
node backend/src/seedComments.js
```

This will populate your database with 6 sample comments (4 text, 2 video placeholders).

## Step 3: Upload Video Files to Supabase Storage

### Option A: Using the Admin Panel (Recommended)

1. **Go to your admin panel**: http://localhost:3001/admin
2. **Click the "Comments" tab**
3. **Find the video comments** (Moshe Goldberg and Yosef Shapiro)
4. **Click "Edit"** on each video comment
5. **Upload the video file** using the drag-and-drop uploader
6. **Save** the comment

### Option B: Manually Upload to Supabase Storage

1. **Go to Supabase Storage**: https://supabase.com/dashboard
2. **Navigate to the `product-images` bucket**
3. **Create/Open the `comments` folder**
4. **Upload your video files**:
   - `comment1.mp4`
   - `testimonial-video-2.mp4`
5. **Copy the public URLs** of the uploaded videos
6. **Update the video comments** in the admin panel with the correct URLs

## Step 4: Verify the Setup

1. **Go to the Admin Panel**: http://localhost:3001/admin
2. **Click the "Comments" tab**
3. **You should see 6 comments** listed
4. **Edit any comment** to test the functionality

## Step 5: Update the Homepage to Use the API

The CommentsSection component currently uses hardcoded data. Once you've verified the admin panel works, we'll update it to fetch comments from the API.

---

## 🎯 Current Comment Structure

### Text Comments:
```javascript
{
  name_he: "דוד כהן",
  name_en: "David Cohen",
  text_he: "המוצרים איכותיים מאוד...",
  text_en: "The products are very high quality...",
  type: "text",
  video_url: null,
  rating: 5
}
```

### Video Comments:
```javascript
{
  name_he: "משה גולדברג",
  name_en: "Moshe Goldberg",
  text_he: null,
  text_en: null,
  type: "video",
  video_url: "https://your-supabase-url.com/storage/v1/object/public/product-images/comments/comment1.mp4",
  rating: 5
}
```

---

## 🚨 Troubleshooting

### Error: "comments table does not exist"
- **Solution**: Run the SQL from `CREATE_COMMENTS_TABLE.sql` in Supabase SQL Editor

### Error: "Failed to create comment"
- **Check**: Make sure the table exists
- **Check**: Verify your SUPABASE_URL and SUPABASE_KEY in `backend/.env`
- **Check**: Ensure Row Level Security policies are set correctly

### Video comments not showing videos
- **Check**: Make sure videos are uploaded to Supabase Storage in the `comments` folder
- **Check**: Verify the `video_url` field has the full Supabase URL
- **Check**: Ensure the bucket is public or has correct access policies

---

## 📦 File Structure

```
backend/
├── CREATE_COMMENTS_TABLE.sql       # SQL to create the table
├── src/
│   ├── controllers/
│   │   ├── commentsController.js   # Comments API logic
│   │   └── supabaseController.js   # Database operations
│   ├── routes/
│   │   └── comments.js             # API endpoints
│   └── seedComments.js             # Seed script
frontend/
├── src/
│   ├── api/
│   │   └── comments.js             # API client functions
│   ├── components/
│   │   ├── CommentsSection.jsx     # Homepage comments display
│   │   └── VideoUploader.jsx       # Video upload component
│   └── pages/
│       └── AdminPanel.jsx          # Admin management
```

---

## ✅ Next Steps

After completing the setup, you'll be able to:
1. ✅ View all comments in the admin panel
2. ✅ Add new text or video comments
3. ✅ Edit existing comments
4. ✅ Delete comments
5. ✅ Upload videos via drag-and-drop
6. ✅ Display comments on the homepage

---

**Need help? Check the console logs in both frontend and backend for detailed error messages.**

