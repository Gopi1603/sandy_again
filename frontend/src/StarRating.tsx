import React from 'react';

export default function StarRating({ value }: { value: number | null }) {
  const v = Math.max(0, Math.min(5, value ?? 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    if (i < full) return '★';
    if (i === full && half) return '☆'; // simple half hint; keep minimal
    return '☆';
  });
  return <span className="stars" aria-label={`${v} out of 5`}>{stars.join(' ')}</span>;
}
