import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_IMAGE = 'https://prernanode.app/og-default.png'; // replace with a real hosted asset in production

// Dynamic per-page meta tags (title, description, Open Graph, Twitter Card, canonical
// URL, and JSON-LD structured data). A new component — wiring it into every existing
// page was intentionally left out per "do not modify existing UI"; it's applied here
// to the app-wide default (see main.jsx/App.jsx) and to the landing page, and is ready
// to drop into any other page with one line.
const SEO = ({
  title = 'PrernaNode — Connect. Inspire. Rise.',
  description = 'PrernaNode is an AI-powered networking and growth platform for women — mentorship, marketplace, communities, and career tools in one place.',
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
}) => {
  const url = `https://prernanode.app${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="PrernaNode" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'PrernaNode',
          url: 'https://prernanode.app',
          description,
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
