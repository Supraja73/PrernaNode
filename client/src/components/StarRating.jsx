import React from 'react';

const StarRating = ({ value = 0, onChange, size = 16, readOnly = false }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(s)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(value) ? '#f0b429' : 'none'} stroke="#f0b429" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default StarRating;
