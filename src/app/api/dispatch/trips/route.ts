import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { ensureDispatchAuthSchemaAndSeed } from '@/lib/dispatch-auth';
import { requireAccess, userScopedWhere } from '@/lib/ownership';

const dbPath = path.resolve(process.cwd(), 'dispatch.db');

export async function GET(request: Request) {
  try {
    ensureDispatchAuthSchemaAndSeed();
    const { access, response } = requireAccess(request);
    if (response || !access) return response;

    const db = new Database(dbPath);
    const scope = userScopedWhere(access, 'user_id');
    const trips = db.prepare(`SELECT * FROM trips WHERE ${scope.clause} ORDER BY trip_number DESC`).all(...scope.params);
    return NextResponse.json(trips);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureDispatchAuthSchemaAndSeed();
    const { access, response } = requireAccess(request);
    if (response || !access) return response;

    const body = await request.json();
    const db = new Database(dbPath);

    // Fixed INSERT with all possible fields (those without defaults can be NULL)
    const stmt = db.prepare(`
      INSERT INTO trips (
        trip_number, start_date, end_date, total_miles, route,
        status, notes, start_odometer, end_odometer,
        trailer, trailer_2, trailer_3, trailer_4, trailer_5, trailer_number, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      body.trip_number,
      body.start_date || null,
      body.end_date || null,
      body.total_miles || 0,
      body.route || '',
      body.status || 'Not Started',
      body.notes || '',
      body.start_odometer || null,
      body.end_odometer || null,
      body.trailer || null,
      body.trailer_2 || null,
      body.trailer_3 || null,
      body.trailer_4 || null,
      body.trailer_5 || null,
      body.trailer_number || null,
      access.session.userId
    );

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
