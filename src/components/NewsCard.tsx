import { Link } from 'react-router-dom';
import type { NewsItem } from '../data/types';

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="news-card">
      <div className="card-row"><span className="topic">{item.region} · {item.topic}</span><span className="demo-badge subtle">{item.mode}</span></div>
      <Link to={`/news/${item.id}`}><h3>{item.title}</h3></Link>
      <p>{item.summary}</p>
      <footer><span>{item.sourceName}</span><time>{item.publishedAt}</time></footer>
    </article>
  );
}
