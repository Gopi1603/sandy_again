import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import { pool } from '../src/db.js';
import { toNullableNumber } from '../src/utils/num.js';

type Recipe = {
  Contient?: string;
  Country_State?: string;
  cuisine?: string;
  title: string;
  URL?: string;
  rating?: number | string;
  total_time?: number | string;
  prep_time?: number | string;
  cook_time?: number | string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  nutrients?: Record<string, any>;
  serves?: string;
};

async function main() {
  const filePath = path.resolve(process.cwd(), 'data/recipes.json');
  const raw = await readFile(filePath, 'utf8');
  const items: Recipe[] = JSON.parse(raw);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const r of items) {
      // NaN → NULL handling
      const rating = toNullableNumber(r.rating);
      const prep_time = toNullableNumber(r.prep_time);
      const cook_time = toNullableNumber(r.cook_time);
      const total_time = toNullableNumber(r.total_time);

      await client.query(
        `INSERT INTO recipes
           (cuisine, title, rating, prep_time, cook_time, total_time, description, nutrients, serves)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT DO NOTHING`,
        [
          r.cuisine ?? null,
          r.title,
          rating,
          prep_time,
          cook_time,
          total_time,
          r.description ?? null,
          r.nutrients ?? null,
          r.serves ?? null
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`Imported ${items.length} recipes`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
