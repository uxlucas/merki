/** Outside addresses. Change them here and nowhere else. */
export const SITE_URL = 'https://merki.lucaslima.design';

export const LINKS: {
  npmCommand: string;
  npmPackage: string;
  github: string;
  /** The license file the site links to. */
  license: string;
  /** owner/name of the GitHub repo, for the star count. */
  githubRepo: string;
  /** null until the Figma Community file is published: the link renders but goes nowhere. */
  figma: string | null;
  portfolio: string;
} = {
  npmCommand: 'npm i merki-icons',
  npmPackage: 'https://www.npmjs.com/package/merki-icons',
  github: 'https://github.com/uxlucas/merki',
  license: 'https://github.com/uxlucas/merki/blob/main/LICENSE',
  githubRepo: 'uxlucas/merki',
  figma: null,
  portfolio: 'https://lucaslima.design',
};
