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
          <NavLink to="/" end><span aria-hidden="true">⌂</span><b>市场总览</b></NavLink>
          <NavLink to="/brief"><span aria-hidden="true">◫</span><b>每日市场简报</b></NavLink>
          <NavLink to="/situation"><span aria-hidden="true">◎</span><b>全球局势</b></NavLink>
          <NavLink to="/learn"><span aria-hidden="true">◇</span><b>经济与市场学院</b></NavLink>
        </nav>
        <div className="sidebar-note"><span>市场状态</span><strong><i /> 延迟快照</strong><small>数据仅供学习与观察</small></div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <NavLink to="/" className="mobile-brand brand"><img className="brand-logo" src={assetUrl('financial-lens-logo.png')} alt="金融透镜标志" /><span>金融透镜</span></NavLink>
          <div><strong>穿过噪音，看清市场</strong><p className="topbar-subtitle">每天看懂一点世界和市场</p></div>
          <span className="demo-badge">市场与事件快照</span>
        </header>
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label="主要导航">
        <NavLink to="/" end><span>市场</span><small>总览</small></NavLink>
        <NavLink to="/brief"><span>简报</span><small>每日重点</small></NavLink>
        <NavLink to="/situation"><span>全球</span><small>局势</small></NavLink>
        <NavLink to="/learn"><span>学院</span><small>知识地图</small></NavLink>
      </nav>
    </div>
  );
}
