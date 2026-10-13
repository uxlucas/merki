import { Layout } from '../components/Layout';
import { LINKS } from '../config';

export function PrivacyPage() {
  return (
    <Layout active={null}>
      <article className="prose">
        <h1>Privacy</h1>
        <p>Last updated 12 October 2026.</p>
        <p>
          This site presents an open-source icon library. It has no accounts, no forms, no cookies and no analytics, and it doesn't
          track you.
        </p>

        <h2>What your browser keeps</h2>
        <p>
          Your theme (light or dark) and the icon size you picked are saved in your browser's local storage, so they're still there
          next time. The GitHub star count is kept in session storage until you close the tab. None of it is sent anywhere, and
          clearing this site's data removes it.
        </p>

        <h2>Who else sees your visit</h2>
        <ul>
          <li>
            <strong>Vercel</strong> hosts the site. Like any web host it keeps standard server logs, such as IP address, page and
            browser, to run and secure the service. See <a href="https://vercel.com/legal/privacy-policy">Vercel's privacy policy</a>.
          </li>
          <li>
            <strong>GitHub.</strong> To show the star count, your browser asks GitHub's public API about the repository, so GitHub
            sees your IP address. See{' '}
            <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's privacy statement</a>.
          </li>
        </ul>
        <p>Fonts and icons are served from this site, not from anyone else.</p>

        <h2>Questions</h2>
        <p>
          Ask Lucas Lima through <a href={LINKS.portfolio}>lucaslima.design</a>.
        </p>
      </article>
    </Layout>
  );
}
