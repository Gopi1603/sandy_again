import React, { useEffect, useMemo, useState } from 'react';
import StarRating from './StarRating';
import type { Recipe } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

type ListResp = { page: number; limit: number; total: number; data: Recipe[]; };

export default function App() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [rows, setRows] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [fTitle, setFTitle] = useState('');
  const [fCuisine, setFCuisine] = useState('');
  const [fRating, setFRating] = useState('');       // e.g. ">=4.5"
  const [fTotalTime, setFTotalTime] = useState(''); // e.g. "<=30"
  const [fCalories, setFCalories] = useState('');   // e.g. "<=400"

  // Drawer
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Recipe | null>(null);

  const hasFilters = useMemo(() =>
    [fTitle, fCuisine, fRating, fTotalTime, fCalories].some(Boolean), 
  [fTitle, fCuisine, fRating, fTotalTime, fCalories]);

  async function loadList() {
    setLoading(true);
    try {
      if (hasFilters) {
        const params = new URLSearchParams();
        if (fTitle) params.set('title', fTitle);
        if (fCuisine) params.set('cuisine', fCuisine);
        if (fRating) params.set('rating', fRating);
        if (fTotalTime) params.set('total_time', fTotalTime);
        if (fCalories) params.set('calories', fCalories);
        const r = await fetch(`${API_BASE}/api/recipes/search?` + params.toString());
        const j = await r.json();
        setRows(j.data ?? []);
        setTotal(j.data?.length ?? 0);
      } else {
        const r = await fetch(`${API_BASE}/api/recipes?page=${page}&limit=${limit}`);
        const j: ListResp = await r.json();
        setRows(j.data);
        setTotal(j.total);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadList(); /* eslint-disable-next-line */ }, [page, limit]);
  useEffect(() => { setPage(1); loadList(); /* eslint-disable-next-line */ }, [fTitle, fCuisine, fRating, fTotalTime, fCalories]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container">
      <h1>Recipes</h1>
      <div className="header">
        <input className="input" placeholder="Filter title (partial)" value={fTitle} onChange={e=>setFTitle(e.target.value)} />
        <input className="input" placeholder="Cuisine (exact)" value={fCuisine} onChange={e=>setFCuisine(e.target.value)} />
        <input className="input" placeholder="Rating (e.g. >=4.5)" value={fRating} onChange={e=>setFRating(e.target.value)} />
        <input className="input" placeholder="Total time (e.g. <=30)" value={fTotalTime} onChange={e=>setFTotalTime(e.target.value)} />
        <input className="input" placeholder="Calories (e.g. <=400)" value={fCalories} onChange={e=>setFCalories(e.target.value)} />
        <select className="select" value={limit} onChange={e=>setLimit(Number(e.target.value))}>
          {[15,20,25,30,40,50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button onClick={()=>{
          setFTitle(''); setFCuisine(''); setFRating(''); setFTotalTime(''); setFCalories('');
        }}>Clear filters</button>
      </div>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty">{hasFilters ? 'No results found for given filters.' : 'No data available.'}</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th style={{width: '40%'}}>Title</th>
                <th>Cuisine</th>
                <th>Rating</th>
                <th>Total Time</th>
                <th>Serves</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} onClick={() => { setActive(r); setOpen(true); }}>
                  <td><div className="truncate" title={r.title}>{r.title}</div></td>
                  <td>{r.cuisine ?? '-'}</td>
                  <td><StarRating value={r.rating}/></td>
                  <td>{r.total_time ?? '-'}</td>
                  <td>{r.serves ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!hasFilters && (
            <div className="pagination">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button>
              <span>Page {page} / {totalPages}</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      <div className={`drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="drawer-header">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontWeight:600}}>{active?.title ?? ''}</div>
              <div className="muted">{active?.cuisine ? <span className="tag">{active.cuisine}</span> : null}</div>
            </div>
            <button onClick={()=>setOpen(false)}>Close</button>
          </div>
        </div>
        <div className="drawer-body">
          {active && (
            <>
              <div className="kv"><strong>Description:</strong> <span className="muted">{active.description ?? '-'}</span></div>

              <div className="kv">
                <strong>Total Time:</strong> {active.total_time ?? '-'}{' '}
                <details style={{marginTop:6}}>
                  <summary>Expand</summary>
                  <div className="muted">Prep Time: {active.prep_time ?? '-'}</div>
                  <div className="muted">Cook Time: {active.cook_time ?? '-'}</div>
                </details>
              </div>

              <h3>Nutrition</h3>
              {active.nutrients ? (
                <table>
                  <thead>
                    <tr>
                      <th>Key</th><th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(active.nutrients).map(([k,v])=>(
                      <tr key={k}><td>{k}</td><td>{String(v)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : (<div className="muted">No nutrition info.</div>)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
