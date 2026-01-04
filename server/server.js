const express = require('express');
const cors = require('cors');
const { docClient } = require('./db');
const { ScanCommand, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const r2 = require('./r2');
const upload = require('./upload');

const deleteR2Object = async (url) => {
    if (!url) return;
    try {
        const domain = process.env.R2_PUBLIC_DOMAIN;
        if (url.startsWith(domain)) {
            const key = url.replace(`${domain}/`, '');
            console.log(`Deleting old image from R2: ${key}`);
            await r2.send(new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            }));
        }
    } catch (error) {
        console.error('Error deleting object from R2:', error);
    }
};

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// TABLES configuration remains the same

const TABLES = {
    SECTIONS: process.env.DYNAMODB_TABLE_SECTIONS,
    CATEGORIES: process.env.DYNAMODB_TABLE_CATEGORIES,
    SUBCATEGORIES: process.env.DYNAMODB_TABLE_SUBCATEGORIES,
    PRODUCTS: process.env.DYNAMODB_TABLE_PRODUCTS,
    BANNERS: process.env.DYNAMODB_TABLE_BANNERS,
};

// --- Helper Functions ---
const scanTable = async (tableName) => {
    try {
        const command = new ScanCommand({ TableName: tableName });
        const response = await docClient.send(command);
        return response.Items;
    } catch (error) {
        console.error(`Error scanning table ${tableName}:`, error);
        throw error;
    }
};

const getItem = async (tableName, key) => {
    try {
        const command = new GetCommand({
            TableName: tableName,
            Key: key,
        });
        const response = await docClient.send(command);
        return response.Item;
    } catch (error) {
        console.error(`Error getting item from ${tableName}:`, error);
        throw error;
    }
};

const putItem = async (tableName, item) => {
    try {
        const command = new PutCommand({
            TableName: tableName,
            Item: item,
        });
        await docClient.send(command);
        return item;
    } catch (error) {
        console.error(`Error putting item to ${tableName}:`, error);
        throw error;
    }
};

const deleteItem = async (tableName, key) => {
    try {
        const command = new DeleteCommand({
            TableName: tableName,
            Key: key,
        });
        await docClient.send(command);
        return { success: true };
    } catch (error) {
        console.error(`Error deleting item from ${tableName}:`, error);
        throw error;
    }
};

// --- Transformers ---

const transformSectionFromDb = (item) => ({
    ...item,
    id: item.sectionId,
    imageUrl: item.image,
});

const transformSectionToDb = (item) => {
    const { id, imageUrl, ...rest } = item;
    return {
        ...rest,
        sectionId: id,
        image: imageUrl,
    };
};

const transformProductFromDb = (item) => {
    const specs = item.specs ? Object.entries(item.specs).map(([key, value]) => ({ key, value })) : [];
    return {
        ...item,
        id: item.productId,
        thumbnailUrl: item.thumbnailImg,
        imageUrls: item.images || [],
        specs,
    };
};

const transformProductToDb = (item) => {
    const { id, thumbnailUrl, imageUrls, specs, ...rest } = item;
    const specsMap = specs.reduce((acc, curr) => {
        if (curr.key) acc[curr.key] = curr.value;
        return acc;
    }, {});
    return {
        ...rest,
        productId: id,
        thumbnailImg: thumbnailUrl,
        images: imageUrls,
        specs: specsMap,
    };
};

const transformBannerFromDb = (item) => ({
    ...item,
    id: item.bannerId,
    image: item.image || '',
});

const transformBannerToDb = (item) => {
    const { id, image, ...rest } = item;
    return {
        ...rest,
        bannerId: id,
        image: image,
    };
};

// --- SECTIONS ---
app.get('/api/sections', async (req, res) => {
    try {
        const items = await scanTable(TABLES.SECTIONS);
        res.json(items.map(transformSectionFromDb));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sections', upload.single('image'), async (req, res) => {
    try {
        const { id, ...data } = req.body;

        // Parse fields
        if (data.order) data.order = parseInt(data.order);
        if (data.isActive) data.isActive = data.isActive === 'true';
        if (data.showOnHome) data.showOnHome = data.showOnHome === 'true';

        const sectionId = id || uuidv4();
        let imageUrl = data.imageUrl || data.image; // Handle both keys

        if (req.file) {
            console.log('Starting R2 upload (Section)...');
            const timestamp = Date.now();
            const slug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + `-${timestamp}`;
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[req.file.mimetype] || 'jpg';
            const key = `sections/${slug}.${ext}`;

            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };

            await r2.send(new PutObjectCommand(uploadParams));
            imageUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            console.log(`R2 upload successful. Public URL: ${imageUrl}`);
        }

        const item = {
            PK: `SECTION#${sectionId}`,
            SK: 'META',
            id: sectionId,
            ...data,
            imageUrl, // Frontend uses imageUrl
        };
        const dbItem = transformSectionToDb(item);

        console.log('Saving Section to DynamoDB...');
        await putItem(TABLES.SECTIONS, dbItem);
        console.log('Section saved successfully');
        res.json(transformSectionFromDb(dbItem));
    } catch (error) {
        console.error('Error creating section:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/sections/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Parse fields
        if (data.order) data.order = parseInt(data.order);
        if (data.isActive) data.isActive = data.isActive === 'true';
        if (data.showOnHome) data.showOnHome = data.showOnHome === 'true';

        const existingItem = await getItem(TABLES.SECTIONS, { PK: `SECTION#${id}`, SK: 'META' });
        let imageUrl = data.imageUrl || data.image;
        if (imageUrl === undefined) imageUrl = existingItem.image;

        if (req.file) {
            if (existingItem.image) {
                await deleteR2Object(existingItem.image);
            }
            console.log('Starting R2 upload (Section Update)...');
            const timestamp = Date.now();
            const slug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + `-${timestamp}`;
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[req.file.mimetype] || 'jpg';
            const key = `sections/${slug}.${ext}`;


            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };

            await r2.send(new PutObjectCommand(uploadParams));
            imageUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            console.log(`R2 upload successful. Public URL: ${imageUrl}`);
        }

        const item = {
            PK: `SECTION#${id}`,
            SK: 'META',
            id,
            ...data,
            imageUrl,
        };
        const dbItem = transformSectionToDb(item);

        console.log('Updating Section in DynamoDB...');
        await putItem(TABLES.SECTIONS, dbItem);
        console.log('Section updated successfully');
        res.json(transformSectionFromDb(dbItem));
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/sections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteItem(TABLES.SECTIONS, { PK: `SECTION#${id}`, SK: 'META' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const transformCategoryFromDb = (item) => ({
    ...item,
    id: item.categoryId,
});

const transformCategoryToDb = (item) => {
    const { id, ...rest } = item;
    return {
        ...rest,
        categoryId: id,
    };
};

// ... (keep other transformers)

// ... (keep other transformers)

// ... (keep other transformers)

// ... (keep other transformers)

// --- CATEGORIES ---
app.get('/api/categories', async (req, res) => {
    try {
        const items = await scanTable(TABLES.CATEGORIES);
        res.json(items.map(transformCategoryFromDb));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', upload.single('image'), async (req, res) => {
    try {
        const { id, ...data } = req.body;

        // Parse fields from multipart/form-data
        if (data.order) data.order = parseInt(data.order);
        if (data.isActive) data.isActive = data.isActive === 'true';

        // Check for duplicate name
        const items = await scanTable(TABLES.CATEGORIES);
        const existing = items.find(i => i.name.toLowerCase() === data.name.toLowerCase());
        if (existing) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        const categoryId = id || uuidv4();
        let imageUrl = data.image; // Could be existing URL if not updating

        // Handle Image Upload
        if (req.file) {
            console.log('Starting R2 upload...');
            const timestamp = Date.now();
            const slug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + `-${timestamp}`;
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[req.file.mimetype] || 'jpg';
            const key = `category/${slug}.${ext}`;

            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                // ACL: 'public-read', // R2 usually handles public access via bucket settings or worker
            };

            await r2.send(new PutObjectCommand(uploadParams));
            imageUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            console.log(`R2 upload successful. Public URL: ${imageUrl}`);
        }

        const timestamp = new Date().toISOString();

        const dbItem = {
            ...data,
            image: imageUrl,
            categoryId: categoryId,
            PK: `CATEGORY#${categoryId}`,
            SK: 'META',
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        console.log('Saving to DynamoDB...');
        await putItem(TABLES.CATEGORIES, dbItem);
        console.log('Category saved successfully');
        res.json(transformCategoryFromDb(dbItem));
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Parse fields from multipart/form-data
        if (data.order) data.order = parseInt(data.order);
        if (data.isActive) data.isActive = data.isActive === 'true';

        // Check for duplicate name
        const items = await scanTable(TABLES.CATEGORIES);
        const existing = items.find(i => i.name.toLowerCase() === data.name.toLowerCase() && i.categoryId !== id);
        if (existing) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        const existingItem = await getItem(TABLES.CATEGORIES, { PK: `CATEGORY#${id}`, SK: 'META' });
        const createdAt = existingItem && existingItem.createdAt ? existingItem.createdAt : new Date().toISOString();

        let imageUrl = data.image;
        if (imageUrl === undefined) {
            imageUrl = existingItem.image;
        }

        // Handle Image Upload
        if (req.file) {
            if (existingItem.image) {
                await deleteR2Object(existingItem.image);
            }
            console.log('Starting R2 upload (Update)...');
            const timestamp = Date.now();
            const slug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + `-${timestamp}`;
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[req.file.mimetype] || 'jpg';
            const key = `category/${slug}.${ext}`;

            const uploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };

            await r2.send(new PutObjectCommand(uploadParams));
            imageUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            console.log(`R2 upload successful. Public URL: ${imageUrl}`);
        }

        const dbItemRaw = {
            ...data,
            image: imageUrl,
            id: id,
            createdAt,
            updatedAt: new Date().toISOString(),
        };

        const dbItem = {
            ...transformCategoryToDb(dbItemRaw),
            PK: `CATEGORY#${id}`,
            SK: 'META',
        };

        console.log('Updating DynamoDB...');
        await putItem(TABLES.CATEGORIES, dbItem);
        console.log('Category updated successfully');
        res.json(transformCategoryFromDb(dbItem));
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteItem(TABLES.CATEGORIES, { PK: `CATEGORY#${id}`, SK: 'META' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const transformSubcategoryFromDb = (item) => ({
    ...item,
    id: item.subcategoryId,
});

const transformSubcategoryToDb = (item) => {
    const { id, ...rest } = item;
    const subcategoryId = item.subcategoryId || id;
    return {
        ...rest,
        subcategoryId,
    };
};

// ... (keep other transformers)

// --- SUBCATEGORIES ---
app.get('/api/subcategories', async (req, res) => {
    try {
        const items = await scanTable(TABLES.SUBCATEGORIES);
        res.json(items.map(transformSubcategoryFromDb));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/subcategories', async (req, res) => {
    try {
        const { id, categoryId, ...data } = req.body;

        // Check for duplicate name globally
        const items = await scanTable(TABLES.SUBCATEGORIES);
        const existing = items.find(i => i.name.toLowerCase() === data.name.toLowerCase());
        if (existing) {
            return res.status(400).json({ error: 'Subcategory with this name already exists' });
        }

        const subcategoryId = id || uuidv4();

        const timestamp = new Date().toISOString();

        const dbItem = {
            ...data,
            categoryId,
            subcategoryId,
            PK: `CATEGORY#${categoryId}`,
            SK: `SUBCATEGORY#${subcategoryId}`,
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        await putItem(TABLES.SUBCATEGORIES, dbItem);
        res.json(transformSubcategoryFromDb(dbItem));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/subcategories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryId, ...data } = req.body;

        // Check for duplicate name globally
        const items = await scanTable(TABLES.SUBCATEGORIES);
        const existing = items.find(i => i.name.toLowerCase() === data.name.toLowerCase() && i.subcategoryId !== id);
        if (existing) {
            return res.status(400).json({ error: 'Subcategory with this name already exists' });
        }

        // Check if categoryId changed (which changes PK)
        const allItems = await scanTable(TABLES.SUBCATEGORIES);
        const existingItem = allItems.find(i => i.subcategoryId === id || i.id === id);

        if (existingItem && existingItem.categoryId !== categoryId) {
            await deleteItem(TABLES.SUBCATEGORIES, { PK: existingItem.PK, SK: existingItem.SK });
        }

        const createdAt = existingItem && existingItem.createdAt ? existingItem.createdAt : new Date().toISOString();

        const dbItem = {
            ...data,
            categoryId,
            subcategoryId: id,
            PK: `CATEGORY#${categoryId}`,
            SK: `SUBCATEGORY#${id}`,
            createdAt,
            updatedAt: new Date().toISOString(),
        };

        await putItem(TABLES.SUBCATEGORIES, dbItem);
        res.json(transformSubcategoryFromDb(dbItem));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/subcategories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Find item to get PK (which needs categoryId)
        const items = await scanTable(TABLES.SUBCATEGORIES);
        const item = items.find(i => i.subcategoryId === id || i.id === id);

        if (item) {
            await deleteItem(TABLES.SUBCATEGORIES, { PK: item.PK, SK: item.SK });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Subcategory not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
    try {
        const items = await scanTable(TABLES.PRODUCTS);
        res.json(items.map(transformProductFromDb));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 5 }]), async (req, res) => {
    try {
        const { id, ...data } = req.body;

        // Parse fields
        if (data.isActive) data.isActive = data.isActive === 'true';
        if (data.isNewArrival) data.isNewArrival = data.isNewArrival === 'true';
        if (data.isBestSeller) data.isBestSeller = data.isBestSeller === 'true';
        if (data.isFeatured) data.isFeatured = data.isFeatured === 'true';
        if (data.isTrending) data.isTrending = data.isTrending === 'true';
        if (data.isPremium) data.isPremium = data.isPremium === 'true';
        if (data.isRecommended) data.isRecommended = data.isRecommended === 'true';
        if (data.isOnOffer) data.isOnOffer = data.isOnOffer === 'true';
        if (data.isCustomOrder) data.isCustomOrder = data.isCustomOrder === 'true';
        if (data.isInStock) data.isInStock = data.isInStock === 'true';
        if (data.rating) data.rating = parseFloat(data.rating);
        if (data.specs && typeof data.specs === 'string') {
            try {
                data.specs = JSON.parse(data.specs);
            } catch (e) {
                console.error('Error parsing specs:', e);
                data.specs = [];
            }
        }

        const productId = id || uuidv4();
        const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        let thumbnailUrl = data.thumbnailUrl;
        let imageUrls = data.imageUrls ? (Array.isArray(data.imageUrls) ? data.imageUrls : [data.imageUrls]) : [];
        if (typeof imageUrls === 'string') imageUrls = JSON.parse(imageUrls); // In case it comes as stringified JSON

        // Handle Thumbnail Upload
        if (req.files['thumbnail']) {
            console.log('Uploading Product Thumbnail...');
            const file = req.files['thumbnail'][0];
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[file.mimetype] || 'jpg';
            const timestamp = Date.now();
            const key = `products/${slug}-thumb-${timestamp}.${ext}`;
            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            thumbnailUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            console.log('Thumbnail uploaded:', thumbnailUrl);
        }

        // Handle Gallery Images Upload
        if (req.files['images']) {
            console.log('Uploading Product Gallery Images...');
            const newImages = await Promise.all(req.files['images'].map(async (file, index) => {
                const mimeToExt = {
                    'image/jpeg': 'jpg',
                    'image/png': 'png',
                    'image/webp': 'webp',
                };
                const ext = mimeToExt[file.mimetype] || 'jpg';
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const key = `products/${slug}-${uniqueSuffix}.${ext}`;
                await r2.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));
                return `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            }));
            imageUrls = [...(imageUrls || []), ...newImages];
            console.log('Gallery images uploaded:', newImages);
        }

        const timestamp = new Date().toISOString();
        const item = {
            PK: `PRODUCT#${productId}`,
            SK: 'META',
            id: productId,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...data,
            thumbnailUrl,
            imageUrls,
        };
        const dbItem = transformProductToDb(item);

        console.log('Saving Product to DynamoDB...');
        await putItem(TABLES.PRODUCTS, dbItem);
        console.log('Product saved successfully');
        res.json(transformProductFromDb(dbItem));
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 5 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Parse fields
        if (data.isActive) data.isActive = data.isActive === 'true';
        if (data.isNewArrival) data.isNewArrival = data.isNewArrival === 'true';
        if (data.isBestSeller) data.isBestSeller = data.isBestSeller === 'true';
        if (data.isFeatured) data.isFeatured = data.isFeatured === 'true';
        if (data.isTrending) data.isTrending = data.isTrending === 'true';
        if (data.isPremium) data.isPremium = data.isPremium === 'true';
        if (data.isRecommended) data.isRecommended = data.isRecommended === 'true';
        if (data.isOnOffer) data.isOnOffer = data.isOnOffer === 'true';
        if (data.isCustomOrder) data.isCustomOrder = data.isCustomOrder === 'true';
        if (data.isInStock) data.isInStock = data.isInStock === 'true';
        if (data.rating) data.rating = parseFloat(data.rating);
        if (data.specs && typeof data.specs === 'string') {
            try {
                data.specs = JSON.parse(data.specs);
            } catch (e) {
                data.specs = [];
            }
        }

        const existingItem = await getItem(TABLES.PRODUCTS, { PK: `PRODUCT#${id}`, SK: 'META' });
        const createdAt = existingItem && existingItem.createdAt ? existingItem.createdAt : new Date().toISOString();

        const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        let thumbnailUrl = data.thumbnailUrl;
        if (thumbnailUrl === undefined) thumbnailUrl = existingItem.thumbnailImg;

        let imageUrls = data.imageUrls;
        if (typeof imageUrls === 'string') {
            try {
                imageUrls = JSON.parse(imageUrls);
            } catch (e) {
                imageUrls = [];
            }
        }
        if (!imageUrls) imageUrls = existingItem.images || [];

        // Handle Thumbnail Upload
        if (req.files['thumbnail']) {
            if (existingItem.thumbnailImg) {
                await deleteR2Object(existingItem.thumbnailImg);
            }
            console.log('Uploading Product Thumbnail (Update)...');
            const file = req.files['thumbnail'][0];
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[file.mimetype] || 'jpg';
            const timestamp = Date.now();
            const key = `products/${slug}-thumb-${timestamp}.${ext}`;
            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            thumbnailUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
        }

        // Handle Gallery Images Upload
        if (req.files['images']) {
            console.log('Uploading Product Gallery Images (Update)...');
            const newImages = await Promise.all(req.files['images'].map(async (file) => {
                const mimeToExt = {
                    'image/jpeg': 'jpg',
                    'image/png': 'png',
                    'image/webp': 'webp',
                };
                const ext = mimeToExt[file.mimetype] || 'jpg';
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const key = `products/${slug}-${uniqueSuffix}.${ext}`;
                await r2.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));
                return `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            }));
            imageUrls = [...(imageUrls || []), ...newImages];
        }

        const item = {
            PK: `PRODUCT#${id}`,
            SK: 'META',
            id,
            createdAt,
            updatedAt: new Date().toISOString(),
            ...data,
            thumbnailUrl,
            imageUrls,
        };
        const dbItem = transformProductToDb(item);

        console.log('Updating Product in DynamoDB...');
        await putItem(TABLES.PRODUCTS, dbItem);
        console.log('Product updated successfully');
        res.json(transformProductFromDb(dbItem));
    } catch (error) {
        console.error(`Error updating product ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteItem(TABLES.PRODUCTS, { PK: `PRODUCT#${id}`, SK: 'META' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- BANNERS ---
app.get('/api/banners', async (req, res) => {
    try {
        const items = await scanTable(TABLES.BANNERS);
        res.json(items.map(transformBannerFromDb));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/banners', upload.single('image'), async (req, res) => {
    try {
        const { id, ...data } = req.body;

        // Parse fields
        if (data.order) data.order = parseInt(data.order);
        if (data.isActive) data.isActive = data.isActive === 'true';

        const bannerId = id || uuidv4();
        const slug = data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : bannerId;

        let imageUrl = data.image;

        // Handle Image Upload
        if (req.file) {
            console.log('Uploading Banner Image...');
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[req.file.mimetype] || 'jpg';
            const timestamp = Date.now();
            const key = `banners/${slug}-${timestamp}.${ext}`;

            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }));
            imageUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
            console.log('Banner image uploaded:', imageUrl);
        }

        const timestamp = new Date().toISOString();
        const item = {
            PK: `BANNER#${bannerId}`,
            SK: 'META',
            id: bannerId,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...data,
            image: imageUrl,
        };
        const dbItem = transformBannerToDb(item);

        console.log('Saving Banner to DynamoDB...');
        await putItem(TABLES.BANNERS, dbItem);
        console.log('Banner saved successfully');
        res.json(transformBannerFromDb(dbItem));
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/banners/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Parse fields
        if (data.order) data.order = parseInt(data.order);
        if (data.isActive) data.isActive = data.isActive === 'true';

        const existingItem = await getItem(TABLES.BANNERS, { PK: `BANNER#${id}`, SK: 'META' });
        const createdAt = existingItem && existingItem.createdAt ? existingItem.createdAt : new Date().toISOString();

        const slug = data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id;

        let imageUrl = data.image;
        if (imageUrl === undefined) imageUrl = existingItem.image;

        // Handle Image Upload
        if (req.file) {
            if (existingItem.image) {
                await deleteR2Object(existingItem.image);
            }
            console.log('Uploading Banner Image (Update)...');
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
            };
            const ext = mimeToExt[req.file.mimetype] || 'jpg';
            const timestamp = Date.now();
            const key = `banners/${slug}-${timestamp}.${ext}`;

            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }));
            imageUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
        }

        const item = {
            PK: `BANNER#${id}`,
            SK: 'META',
            id,
            createdAt,
            updatedAt: new Date().toISOString(),
            ...data,
            image: imageUrl,
        };
        const dbItem = transformBannerToDb(item);

        console.log('Updating Banner in DynamoDB...');
        await putItem(TABLES.BANNERS, dbItem);
        console.log('Banner updated successfully');
        res.json(transformBannerFromDb(dbItem));
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/banners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await deleteItem(TABLES.BANNERS, { PK: `BANNER#${id}`, SK: 'META' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
