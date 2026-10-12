import { ArrowUpIcon } from 'merki-icons';
import { useEffect, useState } from 'react';

/** Shows once `watch` scrolls out of view; scrolls to the top and puts focus back on the logo. */
export function BackToTop({ watch }: { watch: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(watch);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting;
      setVisible(show);
      // A hidden button can't keep focus: hand it to the logo, where Back to top would have put it.
      const active = document.activeElement;
      if (!show && active instanceof HTMLElement && active.classList.contains('to-top')) {
        document.querySelector<HTMLElement>('.logo')?.focus({ preventScroll: true });
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);

  const toTop = () => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.logo')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      className="to-top"
      aria-label="Back to top"
      data-visible={visible}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={toTop}
    >
      <ArrowUpIcon size={16} />
    </button>
  );
}
