import { useState, useRef, useEffect } from 'react';

const DELETE_W = 72;
const THRESHOLD = 32;

export default function SwipeableRow({ onDelete, children, disabled }) {
  const [offset, setOffset] = useState(0);
  const [locked, setLocked] = useState(false);
  const startX = useRef(null);
  const live = useRef(0);

  const onTouchStart = (e) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => {
    if (disabled || startX.current === null) return;
    const base = locked ? DELETE_W : 0;
    const delta = startX.current - e.touches[0].clientX;
    const next = Math.max(0, Math.min(DELETE_W, base + delta));
    live.current = next;
    setOffset(next);
  };

  const onTouchEnd = () => {
    if (live.current > THRESHOLD) {
      setOffset(DELETE_W);
      setLocked(true);
    } else {
      setOffset(0);
      setLocked(false);
    }
    startX.current = null;
  };

  const close = () => {
    setOffset(0);
    setLocked(false);
  };

  useEffect(() => {
    if (disabled) {
      setOffset(0);
      setLocked(false);
    }
  }, [disabled]);

  return (
    <div className="swipe-wrap">
      <div className="swipe-delete-btn" onClick={onDelete}>
        🗑
      </div>
      <div
        className="swipe-content"
        style={{
          transform: `translateX(-${offset}px)`,
          transition: startX.current !== null ? 'none' : 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div onClick={locked ? close : undefined}>{children}</div>
      </div>
    </div>
  );
}
