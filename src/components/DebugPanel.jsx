import { useState, useEffect } from 'react';

export default function DebugPanel() {
  const [info, setInfo] = useState({});
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const cs = getComputedStyle(e);
      return { tag: e.tagName, display: cs.display, width: cs.width, height: cs.height, visible: cs.display !== 'none' && cs.visibility !== 'hidden' && cs.width !== '0px' };
    };

    const mqMobile = window.matchMedia('(max-width: 768px)');
    const mqSmall = window.matchMedia('(max-width: 480px)');

    setInfo({
      viewport: `${window.innerWidth} x ${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent.substring(0, 100),
      platform: navigator.platform || '?',
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
      mobileMQ: mqMobile.matches,
      smallMQ: mqSmall.matches,
      hamburger: el('.hamburger'),
      navTabs: el('.nav-tabs'),
      headerInner: el('.header-inner'),
      bundle: document.querySelector('script[src*="index-"]')?.src?.split('/').pop() || '?',
      bodyOverflow: getComputedStyle(document.body).overflowX,
      htmlOverflow: getComputedStyle(document.documentElement).overflowX,
    });
  }, []);

  if (!visible || !info.viewport) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#1a1a2e', color: '#00ff88', fontFamily: 'monospace',
      fontSize: '11px', lineHeight: 1.5, padding: '8px 10px',
      maxHeight: '40vh', overflow: 'auto', borderTop: '2px solid #00ff88',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
        <strong style={{color:'#ffcc00'}}>🐛 DEBUG</strong>
        <button onClick={() => setVisible(false)}
          style={{background:'#444', color:'#fff', border:'none', borderRadius:4, padding:'2px 10px', cursor:'pointer', fontSize:'12px'}}>✕</button>
      </div>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <tbody>
          {Object.entries(info).map(([k, v]) => (
            <tr key={k}>
              <td style={{color:'#888', paddingRight:8, whiteSpace:'nowrap', verticalAlign:'top', width:'120px'}}>{k}</td>
              <td style={{wordBreak:'break-word'}}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:4, color:'#ffcc00', fontSize:'10px'}}>
        Visit with <strong>?debug=1</strong> to see this. Reload and report the values.
      </div>
    </div>
  );
}
