const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const newDb = new Database('dispatch.db');
const oldDb = new Database('/Users/gurneet/openclaw/dispatch-live/dispatch.db', { readonly: true });

// Create admin user
const passwordHash = bcrypt.hashSync('karandeep@007', 10);
try {
  newDb.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run('bhullargp', 'bhullargp@yahoo.com', passwordHash, 'admin');
  console.log('✓ Admin user created');
} catch (e) {
  console.log('✓ Admin user already exists');
}

// Migrate trips
const trips = oldDb.prepare("SELECT * FROM trips WHERE trip_number LIKE 'T%'").all();
console.log(`Found ${trips.length} trips to migrate`);

const insert = newDb.prepare('INSERT INTO trips (trip_number, start_date, end_date, total_miles, route, status, notes, start_odometer, end_odometer, trailer, trailer_2, trailer_3, trailer_4, trailer_5, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');

const insertMany = newDb.transaction((trips) => {
  for (const trip of trips) {
    insert.run(
      trip.trip_number,
      trip.start_date || null,
      trip.end_date || null,
      trip.total_miles || 0,
      trip.route || '',
      trip.status || 'Not Started',
      trip.notes || '',
      trip.start_odometer || null,
      trip.end_odometer || null,
      trip.trailer || '',
      trip.trailer_2 || '',
      trip.trailer_3 || '',
      trip.trailer_4 || '',
      trip.trailer_5 || ''
    );
  }
});

insertMany(trips);
console.log(`✓ Migrated ${trips.length} trips successfully!`);
console.log(`✓ All trips assigned to admin (user_id=1)`);
