import { ArrowUpRightIcon, CheckIcon, CopyIcon, StarIcon, TerminalIcon } from 'merki-icons';
import { LINKS } from '../config';
import { useCopy } from '../lib/copy';
import { formatStars, useStars } from '../lib/stars';
import { FigmaLogo, GitHubMark } from './BrandLogos';
import { LucasMark } from './LucasMark';

function NpmLink() {
  const { state, copy } = useCopy();
  return (
    <button type="button" className="hero-link" aria-label="Copy npm i merki-icons" onClick={() => copy(LINKS.npmCommand)}>
      <TerminalIcon className="lead" />
      <code className="label">{LINKS.npmCommand}</code>
      <span className="trail swap" data-state={state === 'copied' ? 'copied' : 'idle'} aria-hidden="true">
        <CopyIcon size={14} className="swap-a" />
        <CheckIcon size={14} className="swap-b" />
      </span>
      {state === 'failed' && <span className="trail-text">Couldn't copy</span>}
      <span className="sr-only" aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? "Couldn't copy" : ''}</span>
    </button>
  );
}

function FigmaLink() {
  const body = (
    <>
      <FigmaLogo />
      <span className="label">Figma community file</span>
      <ArrowUpRightIcon size={14} className="trail" />
    </>
  );
  // Until the Community file is published the link is visible but goes nowhere (spec §6).
  return LINKS.figma ? (
    <a className="hero-link" href={LINKS.figma} target="_blank" rel="noreferrer">{body}</a>
  ) : (
    <a className="hero-link" role="link" aria-disabled="true">{body}</a>
  );
}

function GitHubLink() {
  const stars = useStars(LINKS.githubRepo);
  return (
    <a className="hero-link" href={LINKS.github} target="_blank" rel="noreferrer">
      <GitHubMark />
      <span className="label">GitHub</span>
      {stars !== null && (
        <>
          <span className="stars" aria-hidden="true">
            <StarIcon size={12} />
            {formatStars(stars)}
          </span>
          <span className="sr-only">{`, ${stars.toLocaleString('en-US')} ${stars === 1 ? 'star' : 'stars'}`}</span>
        </>
      )}
      <ArrowUpRightIcon size={14} className="trail" />
    </a>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <a className="byline" href={LINKS.portfolio}>
        Brought to you by{' '}
        <span className="byline-name">
          <LucasMark />
          Lucas Lima
        </span>
      </a>
      <h1 id="hero-title">
        {/* The trailing space keeps the words apart on phones, where the <br> is hidden. */}
        {'An icon library that '}
        <br />
        obsesses over details
      </h1>
      <div className="hero-copy">
        <p>I wanted a set of icons that felt familiar, but had a little more personality. So I started drawing my own.</p>
        <p>
          <strong>merki-icons</strong> is a growing collection of bold, rounded icons for Figma and code. Open source and free to use
          under the <a href={LINKS.license}>MIT License</a>.
        </p>
      </div>
      <div className="hero-links">
        <NpmLink />
        <FigmaLink />
        <GitHubLink />
      </div>
    </section>
  );
}
