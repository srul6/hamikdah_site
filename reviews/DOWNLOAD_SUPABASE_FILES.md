# 📥 How to Download All Files from Supabase Storage

## Method 1: Using Supabase Dashboard (Easiest) ✅

### Step-by-Step:

1. **Log in to Supabase**:
   - Go to https://supabase.com/dashboard
   - Sign in to your account

2. **Navigate to Storage**:
   - Click on **"Storage"** in the left sidebar
   - You should see your buckets listed

3. **Open your bucket**:
   - Click on the bucket name (usually `product-images`)
   - You'll see all folders and files

4. **Download files**:
   - **Option A: Download individual files**
     - Click on each file
     - Click "Download" button
     - Repeat for all files
   
   - **Option B: Download folder** (if available)
     - Right-click on a folder
     - Select "Download" (if option available)
   
   - **Option C: Select multiple files**
     - Check the boxes next to files
     - Look for "Download" or "Download Selected" button

### Limitations:
- ⚠️ Can't download entire bucket at once
- ⚠️ Need to download files/folders one by one
- ⚠️ Time-consuming for many files

---

## Method 2: Using Supabase CLI (Recommended for Many Files) ✅

### Step 1: Install Supabase CLI

**On macOS:**
```bash
brew install supabase/tap/supabase
```

**On Windows:**
```bash
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or download from: https://github.com/supabase/cli/releases
```

**On Linux:**
```bash
# Download binary
wget -O supabase https://github.com/supabase/cli/releases/download/v1.xxx.xxx/supabase_xxx_linux_amd64
chmod +x supabase
sudo mv supabase /usr/local/bin/
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Link Your Project

```bash
supabase link --project-ref your-project-ref
```

To find your project ref:
- Go to Supabase Dashboard → Settings → General
- Look for "Reference ID" or "Project ID"

### Step 4: Download All Files

```bash
# Download entire bucket
supabase storage download product-images ./supabase-backup

# Or download specific folder
supabase storage download product-images/products ./supabase-backup/products
supabase storage download product-images/comments ./supabase-backup/comments
```

This will download all files to `./supabase-backup` folder.

---

## Method 3: Using Node.js Script (Automated) ✅

Create a script to download all files programmatically:

### Create `download-supabase-files.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = 'product-images'; // Your bucket name
const downloadPath = './supabase-backup';

const supabase = createClient(supabaseUrl, supabaseKey);

// Create download directory
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
}

async function downloadFile(filePath, localPath) {
    return new Promise((resolve, reject) => {
        const url = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
        const file = fs.createWriteStream(localPath);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${filePath}`);
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download ${filePath}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(localPath, () => {}); // Delete file on error
            reject(err);
        });
    });
}

async function listAllFiles(folder = '') {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .list(folder, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) throw error;

        const files = [];
        
        for (const item of data) {
            const fullPath = folder ? `${folder}/${item.name}` : item.name;
            
            if (item.id === null) {
                // It's a folder, recurse
                const folderFiles = await listAllFiles(fullPath);
                files.push(...folderFiles);
            } else {
                // It's a file
                files.push(fullPath);
            }
        }
        
        return files;
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
}

async function downloadAllFiles() {
    console.log('📥 Starting download from Supabase...\n');
    
    const files = await listAllFiles();
    console.log(`Found ${files.length} files to download\n`);
    
    for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        const localPath = path.join(downloadPath, filePath);
        const dir = path.dirname(localPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        try {
            await downloadFile(filePath, localPath);
            console.log(`Progress: ${i + 1}/${files.length}`);
        } catch (error) {
            console.error(`❌ Error downloading ${filePath}:`, error.message);
        }
    }
    
    console.log(`\n✅ Download complete! Files saved to: ${downloadPath}`);
}

// Run the script
downloadAllFiles().catch(console.error);
```

### Run the script:

```bash
cd backend
node download-supabase-files.js
```

This will:
- List all files in your bucket
- Download them to `./supabase-backup` folder
- Preserve folder structure
- Show progress

---

## Method 4: Using Supabase API Directly (Advanced)

You can also use the Supabase REST API to list and download files:

```bash
# List files
curl -X POST "https://[project-ref].supabase.co/storage/v1/object/list/product-images" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Download file
curl "https://[project-ref].supabase.co/storage/v1/object/public/product-images/path/to/file.jpg" \
  -o "file.jpg"
```

---

## Recommended Approach

### For Small Number of Files (< 50):
- ✅ Use **Method 1** (Supabase Dashboard)
- Simple, no setup needed

### For Many Files (> 50):
- ✅ Use **Method 3** (Node.js Script)
- Automated, preserves folder structure
- Can resume if interrupted

### For Complete Backup:
- ✅ Use **Method 2** (Supabase CLI)
- Most reliable
- Handles all edge cases

---

## After Downloading

Once you have all files downloaded:

1. **Verify files**: Check that all files downloaded correctly
2. **Check folder structure**: Make sure folders are preserved
3. **Upload to R2**: Use R2 dashboard or script to upload to Cloudflare R2
4. **Update URLs**: Update your database to use new R2 URLs

---

## Quick Script Setup

I can create the Node.js download script for you. Would you like me to:
1. Create `download-supabase-files.js` in your backend folder?
2. Add it to your package.json scripts?
3. Include it in the migration guide?

Let me know! 🚀

