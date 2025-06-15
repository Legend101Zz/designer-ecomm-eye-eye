// Migration to add size and color to existing cart items
const mongoose = require('mongoose');

async function updateCartItems() {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGODB_URI || 'your-connection-string');
    
    console.log('Starting cart items migration...');
    
    // Update all users with cart items missing size/color
    const result = await mongoose.connection.db.collection('users').updateMany(
      {
        'cart': { $exists: true, $ne: [] },
        $or: [
          { 'cart.size': { $exists: false } },
          { 'cart.color': { $exists: false } }
        ]
      },
      {
        $set: {
          'cart.$[].size': 'M',     // Default size
          'cart.$[].color': 'black' // Default color
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users with missing cart fields`);
    
    // Verify the update
    const usersWithInvalidCart = await mongoose.connection.db.collection('users').countDocuments({
      'cart': { $exists: true, $ne: [] },
      $or: [
        { 'cart.size': { $exists: false } },
        { 'cart.color': { $exists: false } }
      ]
    });
    
    console.log(`Remaining users with invalid cart: ${usersWithInvalidCart}`);
    
    await mongoose.disconnect();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

updateCartItems(); 