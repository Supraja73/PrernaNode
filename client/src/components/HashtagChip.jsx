import React from 'react';
import { Link } from 'react-router-dom';

const HashtagChip = ({ tag, count }) => (
  <Link
    to={`/hashtag/${tag}`}
    className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors"
  >
    #{tag}
    {count !== undefined && <span className="text-cyan/60">· {count}</span>}
  </Link>
);

export default HashtagChip;
