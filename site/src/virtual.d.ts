declare module 'virtual:merki-icons' {
  const icons: Array<{
    name: string;
    svg: string;
    meta: { category?: string; tags?: string[]; aliases?: string[] } | null;
  }>;
  export default icons;
}
