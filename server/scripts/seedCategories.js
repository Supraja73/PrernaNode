// Populates the Category collection with the real taxonomy defined for PrernaNode
// (not sample/demo content — these are the actual categories stories are tagged with).
// Run manually with: npm run seed:categories
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Story = require('../models/Story');

const slugify = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const run = async () => {
  await connectDB();

  const ops = Story.CATEGORIES.map((name) => ({
    updateOne: {
      filter: { slug: slugify(name) },
      update: { $setOnInsert: { name, slug: slugify(name) } },
      upsert: true,
    },
  }));

  const result = await Category.bulkWrite(ops);
  console.log(`Categories seeded. Upserted: ${result.upsertedCount}, matched: ${result.matchedCount}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
