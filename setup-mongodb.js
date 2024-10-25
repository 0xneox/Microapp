
const mongoose = require('mongoose');
require('dotenv').config();

const safeDatabaseSetup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // First, handle the conflicting index
        const referralsCollection = mongoose.connection.db.collection('referrals');
        
        console.log('Checking existing indexes...');
        const existingIndexes = await referralsCollection.indexes();
        
        // Drop conflicting code_1 index if it exists
        for (const index of existingIndexes) {
            if (index.name === 'code_1') {
                console.log('Found conflicting index, dropping it...');
                await referralsCollection.dropIndex('code_1');
                console.log('Successfully dropped conflicting index');
                break;
            }
        }

        const collections = [
            {
                name: 'users',
                indexes: [
                    { key: { telegramId: 1 }, unique: true },
                    { key: { referralCode: 1 }, unique: true, sparse: true },
                    { key: { username: 1 } }
                ]
            },
            {
                name: 'referrals',
                indexes: [
                    { key: { referred: 1 }, unique: true },
                    { key: { referrer: 1 } },
                    // Modified index specification for code
                    { 
                        key: { code: 1 },
                        options: { 
                            name: 'code_1_non_unique',
                            unique: false,
                            background: true
                        }
                    },
                    { key: { referrer: 1, referred: 1 } }
                ]
            },
            {
                name: 'activities',
                indexes: [
                    { key: { user: 1, timestamp: -1 } },
                    { key: { type: 1 } }
                ]
            }
        ];

        for (const collection of collections) {
            // Check if collection exists
            const collectionExists = await mongoose.connection.db
                .listCollections({ name: collection.name })
                .hasNext();

            if (!collectionExists) {
                console.log(`Creating new collection: ${collection.name}`);
                await mongoose.connection.db.createCollection(collection.name);
            } else {
                console.log(`Collection ${collection.name} already exists, skipping creation`);
            }

            // Safely create indexes
            for (const index of collection.indexes) {
                try {
                    const options = {
                        ...index.options,
                        background: true
                    };

                    console.log(`Creating/Updating index on ${collection.name}:`, index.key);
                    await mongoose.connection.db
                        .collection(collection.name)
                        .createIndex(index.key, options);
                    
                    console.log(`Index created/updated successfully on ${collection.name}`);
                } catch (indexError) {
                    if (indexError.code === 85 || indexError.code === 86) {
                        console.log(`Index already exists on ${collection.name}, skipping...`);
                    } else {
                        console.error(`Error creating index on ${collection.name}:`, indexError);
                    }
                }
            }
        }

        console.log('\nDatabase setup completed successfully');

    } catch (error) {
        console.error('Database setup error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

// Run setup with confirmation
console.log('Starting safe database setup...');
console.log('This script will:');
console.log('1. Drop conflicting code_1 index if it exists');
console.log('2. Create collections if they don\'t exist');
console.log('3. Create or update indexes with correct specifications');
console.log('4. Maintain data integrity\n');

safeDatabaseSetup().then(() => {
    console.log('\nSetup completed safely!');
}).catch(error => {
    console.error('Setup failed:', error);
});
