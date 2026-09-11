import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GlobalEvent } from '../data/globalSituationTypes';

const regions = [
  { id:'all', name:'全部地区', short:'全球', x:50, y:50 },
  { id:'united-states', name:'美国', short:'利率 / 财政', x:19, y:39 },
  { id:'europe', name:'欧洲', short:'ECB / 能源', x:49, y:34 },
  { id:'middle-east', name:'中东', short:'能源 / 航运', x:59, y:50 },
  { id:'china', name:'中国', short:'增长 / 政策', x:74, y:44 },
  { id:'japan', name:'日本', short:'BOJ / 日元', x:88, y:44 },
];

export const regionLabel = (region: string) => regions.find(item => item.id === region)?.name ?? '全球';

export function SituationMap({ events }: { events: GlobalEvent[] }) {
  const [selected,setSelected] = useState('all');
  const visible = useMemo(() => selected === 'all' ? events.slice(0,6) : events.filter(event => event.region === selected), [events,selected]);
  return <section className="situation-map" role="region" aria-label="全球金融风险地图">
    <div className="map-copy"><div><p className="eyebrow">GLOBAL RISK MAP</p><h2>全球正在发生什么</h2></div><p>位置为区域级示意；地图表达金融传导主题，不表示边界、战线或精确事发位置。</p></div>
    <div className="map-stage">
      <svg viewBox="0 0 1000 470" role="img" aria-label="简化世界地图，显示美国、欧洲、中东、中国和日本的金融事件位置">
        <g className="continent-shapes" aria-hidden="true">
          <path d="M64 105L141 56 247 77 299 139 258 189 199 181 161 231 92 203 45 148Z" />
          <path d="M230 246L291 255 326 317 294 414 242 383 211 302Z" />
          <path d="M413 90L486 65 531 96 616 80 726 119 817 92 924 143 897 214 812 238 749 198 680 237 611 208 545 224 498 183 432 170Z" />
          <path d="M499 222L583 223 628 292 592 402 521 386 474 293Z" />
          <path d="M801 316L879 292 947 337 912 400 833 392Z" />
        </g>
        {regions.slice(1).map(region => <g key={region.id} className={`map-marker ${selected === region.id ? 'active' : ''}`} transform={`translate(${region.x * 10} ${region.y * 4.7})`} aria-hidden="true"><circle r="15" /><circle r="5" /></g>)}
      </svg>
      <div className="map-controls" aria-label="按地区查看事件">{regions.map(region => <button key={region.id} type="button" aria-pressed={selected === region.id} onClick={() => setSelected(region.id)}><b>{region.name}</b><small>{region.short}</small></button>)}</div>
    </div>
    <div className="map-event-strip">{visible.length ? visible.map(event => <Link key={event.id} to={`/situation/${event.id}`}><span>{regionLabel(event.region)}</span><strong>{event.headline}</strong></Link>) : <p>当前快照没有这一地区的中高关联度事件。</p>}</div>
  </section>;
}
