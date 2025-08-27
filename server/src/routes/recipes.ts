import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { parseOpFilter } from '../utils/op.js';

const router = Router();

/**
 * GET /api/recipes
 * Paginated + sorted (rating desc)
 * Query: page=1, limit=10
 */
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)));
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    const totalQ = await client.query('SELECT COUNT(*)::int AS c FROM recipes');
    const total = totalQ.rows[0].c as number;

    const rowsQ = await client.query(
      `SELECT id, title, cuisine, rating, prep_time, cook_time, total_time, description, nutrients, serves
       FROM recipes
       ORDER BY rating DESC NULLS LAST, id ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ page, limit, total, data: rowsQ.rows });
  } finally {
    client.release();
  }
});

/**
 * GET /api/recipes/search
 * Query params:
 * - title (ILIKE partial)
 * - cuisine (exact match)
 * - rating (op-value e.g. >=4.5)
 * - total_time (op-value e.g. <=30)
 * - calories (op-value e.g. <=400) extracted from nutrients->>'calories'
 */
router.get('/search', async (req: Request, res: Response) => {
  const { title, cuisine } = req.query as Record<string, string | undefined>;
  const ratingF = parseOpFilter(req.query.rating as string | undefined);
  const timeF = parseOpFilter(req.query.total_time as string | undefined);
  const calF = parseOpFilter(req.query.calories as string | undefined);

  const where: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (title) {
    where.push(`title ILIKE $${i++}`);
    values.push(`%${title}%`);
  }
  if (cuisine) {
    where.push(`cuisine = $${i++}`);
    values.push(cuisine);
  }
  if (ratingF) {
    where.push(`rating ${ratingF.op} $${i++}`);
    values.push(ratingF.value);
  }
  if (timeF) {
    where.push(`total_time ${timeF.op} $${i++}`);
    values.push(timeF.value);
  }
  if (calF) {
    // Extract number from nutrients->>'calories' like "389 kcal"
    where.push(`
      COALESCE(
        NULLIF(regexp_replace(nutrients->>'calories', '[^0-9\\.]', '', 'g'), ''),
        '0'
      )::float ${calF.op} $${i++}
    `);
    values.push(calF.value);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const q = `
    SELECT id, title, cuisine, rating, prep_time, cook_time, total_time, description, nutrients, serves
    FROM recipes
    ${clause}
    ORDER BY rating DESC NULLS LAST, id ASC
    LIMIT 200
  `;

  const { rows } = await pool.query(q, values);
  res.json({ data: rows });
});

export default router;
