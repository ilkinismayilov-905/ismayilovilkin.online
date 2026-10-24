// Every page of the site, both locales.
export const caseSlugs = ['milly', 'yolcu', 'abadland-qarabag'];
export const pages = [
  '/', '/az/',
  ...caseSlugs.flatMap((s) => [`/work/${s}/`, `/az/work/${s}/`]),
  '/404.html', '/az/404.html',
];
