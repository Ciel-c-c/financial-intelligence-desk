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
        <p className="nav-caption">FINANCIAL INTELLIGENCE</p>
        <nav aria-label="桌面主要导航">
          <NavLink to="/" end><span aria-hidden="true">⌂</span><b>资讯</b></NavLink>
          <NavLink to="/brief"><span aria-hidden="true">◫</span><b>每日简报</b></NavLink>
          <NavLink to="/situation"><span aria-hidden="true">◎</span><b>全球局势</b></NavLink>
          <NavLink to="/learn"><span aria-hidden="true">◇</span><b>金融知识库</b></NavLink>
        </nav>
        <div className="sidebar-note"><span>资讯与知识</span><strong>来源逐条标注</strong><small>内容仅供学习与观察</small></div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <NavLink to="/" className="mobile-brand brand"><img className="brand-logo" src={assetUrl('financial-lens-logo.png')} alt="金融透镜标志" /><span>金融透镜</span></NavLink>
          <div><strong>穿过噪音，看清市场</strong><p className="topbar-subtitle">每天看懂一点世界和市场</p></div>
          <span className="demo-badge">资讯与金融知识库</span>
        </header>
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label="主要导航">
        <NavLink to="/" end><span>资讯</span><small>新闻入口</small></NavLink>
        <NavLink to="/brief"><span>简报</span><small>每日重点</small></NavLink>
        <NavLink to="/situation"><span>全球</span><small>局势</small></NavLink>
        <NavLink to="/learn"><span>知识库</span><small>知识地图</small></NavLink>
      </nav>
    </div>
  );
}
