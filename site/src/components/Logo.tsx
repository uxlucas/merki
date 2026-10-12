import { Link } from '../lib/router';
import { LucasMark } from './LucasMark';

/** Lucas's mark + the mono wordmark. CSS (layout.css) glitches it once on hover. */
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="merki-icons home">
      <span className="logo-mark"><LucasMark size={16} /></span>
      <span className="logo-word" data-text="merki-icons">merki-icons</span>
    </Link>
  );
}
