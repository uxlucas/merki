import { Link } from '../lib/router';

export function NotFound({ missingIcon }: { missingIcon?: string }) {
  return (
    <main className="notfound" data-notfound="">
      <h1>{missingIcon ? `There's no icon called “${missingIcon}”.` : 'No page here.'}</h1>
      <p>
        <Link to="/#icons">Browse all icons</Link>
      </p>
    </main>
  );
}
