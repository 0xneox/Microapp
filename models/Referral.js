
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referrer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    referred: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true  // Each user can only be referred once
    },
    code: { 
        type: String, 
        required: true,
        index: true  
    },
    tier: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 3 
    },
    dateReferred: { 
        type: Date, 
        default: Date.now 
    },
    totalRewardsDistributed: { 
        type: Number, 
        default: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
});

// Compound index for referrer and referred
referralSchema.index({ referrer: 1, referred: 1 }, { unique: true });


async function updateIndexes() {
    try {
        await mongoose.model('Referral').collection.dropIndex('code_1');
    } catch (error) {
        // Index might not exist, that's okay
    }
}

updateIndexes().catch(console.error);

module.exports = mongoose.model('Referral', referralSchema);
