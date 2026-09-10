import { NavLink, Outlet } from 'react-router-dom';

export function AppShell() {
  const assetUrl = (fileName: string) => `./${fileName}`;

  return (
    <div className="app-shell">
      <div
        className="site-backdrop"
        aria-hidden="true"
        style={{ backgroundImage: `url("${assetUrl('aurora-blue-purple-bg.png')}")` }}
      />
      <aside className="desktop-sidebar">
        <NavLink to="/" className="brand"><img className="brand-logo" src={assetUrl('financial-lens-logo.png')} alt="金融透镜标志" /><span><b>金融透镜</b><small>Financial Lens</small></span></NavLink>
        <p className="nav-caption">资讯中心</p>
        <nav aria-label="桌面主要导航">
          <NavLink to="/" end><span aria-hidden="true">⌂</span><b>今日市场</b></NavLink>
          <NavLink to="/brief"><span aria-hidden="true">◫</span><b>每日 Brief</b></NavLink>
          <NavLink to="/learn"><span aria-hidden="true">◇</span><b>学一点</b></NavLink>
        </nav>
        <div className="sidebar-note"><span>市场状态</span><strong><i /> 延迟快照</strong><small>数据仅供学习与观察</small></div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <NavLink to="/" className="mobile-brand brand"><img className="brand-logo" src={assetUrl('financial-lens-logo.png')} alt="金融透镜标志" /><span>金融透镜</span></NavLink>
          <div><strong>穿过噪音，看清市场</strong><p className="topbar-subtitle">每天看懂一点世界和市场</p></div>
          <span className="demo-badge">新闻与市场快照</span>
        </header>
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label="主要导航">
        <NavLink to="/" end><span>今日</span><small>市场与资讯</small></NavLink>
        <NavLink to="/brief"><span>Brief</span><small>每日重点</small></NavLink>
        <NavLink to="/learn"><span>学一点</span><small>金融知识</small></NavLink>
      </nav>
    </div>
  );
}
