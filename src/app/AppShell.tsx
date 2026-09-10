import { NavLink, Outlet } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand"><span className="brand-mark">融</span><span>金融资讯台</span></NavLink>
        <span className="demo-badge">新闻与市场快照</span>
      </header>
      <Outlet />
      <nav className="bottom-nav" aria-label="主要导航">
        <NavLink to="/" end><span>今日</span><small>市场与资讯</small></NavLink>
        <NavLink to="/brief"><span>Brief</span><small>每日重点</small></NavLink>
        <NavLink to="/learn"><span>学一点</span><small>金融知识</small></NavLink>
      </nav>
    </div>
  );
}
