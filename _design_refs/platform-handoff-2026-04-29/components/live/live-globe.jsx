/* global React, SPEAKING_PINS */
const { useState: useGlobeState, useEffect: useGlobeEffect, useRef: useGlobeRef } = React;

// ──────────────────────────────────────────────────────────────────────
// SpeakingGlobe — animated 3D-style globe flyover
// - SVG orthographic projection
// - Auto-rotates (longitude advances over time)
// - Gold pins light up sequentially as the globe rotates over them
// - Click pin → opens detail card alongside
// ──────────────────────────────────────────────────────────────────────

// Orthographic projection: sphere centered at origin, viewer at +Z
// Returns { x, y, visible } in viewBox units (-1..1)
function project(lat, lon, lon0) {
  const phi   = lat * Math.PI / 180;
  const lam   = (lon - lon0) * Math.PI / 180;
  const cosc  = Math.cos(phi) * Math.cos(lam);
  const x     = Math.cos(phi) * Math.sin(lam);
  const y     = Math.sin(phi);
  return { x, y, visible: cosc >= 0, depth: cosc };
}

// Simplified continent outlines — recognizable but low-poly.
// Each path is a list of [lat, lon] vertices. Drawn as polygons projected each frame.
const CONTINENTS = [
  // ── NORTH AMERICA ─────────────────────────────────────────
  // Mainland: Alaska around through Mexico, up the east coast, across Hudson Bay, back to Alaska
  [[70,-160],[71,-156],[70,-148],[69,-141],[60,-141],[59,-138],[55,-131],[52,-128],[48,-125],[42,-124],[37,-122],[34,-120],[32,-117],[30,-115],[27,-114],[23,-110],[22,-106],[19,-105],[16,-99],[15,-93],[18,-92],[17,-88],[16,-89],[13,-89],[14,-84],[10,-83],[8,-77],[10,-75],[12,-72],[16,-86],[19,-87],[21,-86],[24,-82],[26,-80],[28,-80],[30,-81],[32,-80],[34,-77],[35,-76],[37,-76],[39,-74],[41,-72],[43,-70],[44,-67],[46,-64],[48,-60],[50,-57],[52,-56],[55,-60],[58,-62],[60,-65],[62,-70],[63,-77],[60,-78],[58,-83],[55,-86],[52,-82],[55,-78],[58,-78],[60,-85],[63,-85],[68,-83],[71,-95],[73,-110],[71,-128],[70,-141],[68,-148],[70,-160]],
  // Greenland
  [[83,-30],[82,-20],[78,-18],[72,-22],[66,-36],[60,-43],[64,-52],[71,-55],[76,-65],[81,-58],[83,-40],[83,-30]],
  // ── SOUTH AMERICA ────────────────────────────────────────
  [[12,-72],[11,-68],[10,-62],[6,-60],[4,-52],[1,-50],[-3,-44],[-8,-35],[-13,-39],[-18,-39],[-22,-41],[-25,-48],[-30,-50],[-34,-54],[-38,-58],[-42,-65],[-46,-68],[-50,-69],[-53,-69],[-55,-68],[-54,-72],[-50,-74],[-46,-75],[-42,-74],[-38,-73],[-34,-72],[-30,-71],[-24,-70],[-18,-71],[-12,-77],[-6,-81],[-2,-81],[2,-78],[6,-78],[8,-77],[11,-75],[12,-72]],
  // ── AFRICA ───────────────────────────────────────────────
  [[37,-6],[36,-2],[35,4],[33,11],[32,15],[31,20],[30,25],[31,30],[27,33],[22,36],[15,39],[12,42],[11,44],[12,49],[10,51],[5,48],[2,46],[-2,42],[-7,40],[-12,40],[-18,37],[-25,33],[-30,32],[-34,28],[-34,25],[-34,21],[-32,18],[-28,16],[-22,14],[-18,12],[-12,13],[-7,12],[-2,9],[3,7],[6,3],[5,-3],[6,-9],[10,-13],[14,-17],[20,-17],[24,-16],[28,-12],[32,-9],[34,-7],[37,-6]],
  // Madagascar
  [[-12,49],[-14,50],[-18,49],[-22,48],[-25,46],[-22,44],[-17,44],[-13,47],[-12,49]],
  // ── EUROPE ──────────────────────────────────────────────
  // Western Europe + Scandinavia mainland (Iberia → France → Low Countries → Germany → Denmark → Scandinavia → European Russia)
  [[36,-9],[37,-6],[40,-9],[43,-9],[44,-2],[46,-2],[48,-5],[49,0],[51,2],[52,4],[54,8],[56,8],[58,8],[60,5],[62,5],[64,11],[66,13],[68,15],[70,20],[71,28],[69,32],[66,36],[62,42],[58,42],[55,40],[52,40],[50,38],[48,38],[46,32],[44,28],[42,27],[40,26],[39,23],[38,21],[40,18],[42,15],[44,12],[44,9],[43,7],[43,3],[42,3],[40,0],[38,-1],[37,-3],[36,-5],[36,-9]],
  // British Isles
  [[58,-5],[58,-3],[57,-2],[55,-2],[53,1],[51,1],[51,-1],[50,-4],[51,-5],[53,-5],[54,-3],[55,-5],[57,-7],[58,-5]],
  // Iceland
  [[66,-23],[66,-19],[65,-14],[63,-17],[63,-21],[64,-24],[66,-23]],
  // ── ASIA ────────────────────────────────────────────────
  // Russia/Siberia → China → SE Asia → India → Middle East, joined to Europe block above
  [[71,28],[74,55],[77,80],[78,105],[76,130],[71,150],[66,170],[60,170],[55,162],[52,158],[50,156],[51,142],[55,138],[55,135],[51,131],[47,134],[44,135],[42,130],[40,127],[37,126],[35,125],[33,121],[30,121],[27,120],[24,118],[22,114],[21,109],[18,108],[12,109],[10,107],[9,105],[10,103],[8,100],[6,101],[2,103],[1,104],[5,98],[10,99],[14,98],[16,95],[20,93],[22,90],[22,89],[20,86],[16,82],[12,80],[8,77],[12,75],[16,73],[19,72],[22,69],[24,67],[25,62],[27,57],[30,50],[28,48],[26,50],[25,55],[22,59],[16,53],[12,49],[15,42],[22,36],[27,33],[31,30],[33,35],[36,36],[40,40],[42,46],[44,49],[48,46],[55,40],[60,42],[66,36],[69,32],[71,28]],
  // Japan
  [[45,142],[44,145],[42,143],[40,140],[37,141],[35,140],[33,131],[31,130],[33,132],[34,135],[36,137],[39,141],[42,141],[45,142]],
  // Indonesia / Borneo / Sumatra (chunky)
  [[2,96],[5,98],[2,103],[-1,104],[-5,105],[-6,107],[-8,114],[-9,116],[-7,116],[-3,113],[-1,109],[1,109],[5,118],[7,117],[5,120],[2,118],[-3,120],[-5,123],[-3,128],[0,131],[-2,134],[-4,138],[-8,140],[-9,138],[-8,134],[-6,131],[-4,127],[-2,123],[-1,118],[-3,116],[-2,112],[-1,108],[-2,104],[-3,101],[-1,99],[2,96]],
  // Philippines (rough)
  [[18,121],[16,122],[14,124],[12,125],[10,124],[8,124],[6,122],[8,118],[11,119],[14,120],[16,120],[18,121]],
  // ── AUSTRALIA ───────────────────────────────────────────
  [[-11,131],[-12,137],[-14,140],[-12,142],[-15,145],[-18,146],[-22,150],[-26,153],[-29,153],[-33,151],[-37,150],[-39,146],[-39,141],[-36,139],[-33,137],[-32,134],[-32,127],[-34,123],[-33,119],[-33,115],[-30,115],[-27,114],[-22,113],[-20,118],[-17,123],[-14,127],[-13,130],[-11,131]],
  // Tasmania
  [[-40,144],[-41,148],[-43,148],[-43,145],[-42,144],[-40,144]],
  // New Zealand (North + South simplified as one blob each)
  [[-34,173],[-37,176],[-39,177],[-41,175],[-40,173],[-37,174],[-34,173]],
  [[-41,173],[-43,173],[-46,170],[-46,167],[-44,168],[-41,173]],
  // Sri Lanka
  [[10,80],[8,82],[6,81],[6,80],[8,79],[10,80]],
];

// Latitude / longitude graticule lines
const GRATICULE = (() => {
  const lines = [];
  // Latitude rings
  for (let lat = -60; lat <= 60; lat += 30) {
    const ring = [];
    for (let lon = -180; lon <= 180; lon += 6) ring.push([lat, lon]);
    lines.push(ring);
  }
  // Longitude meridians
  for (let lon = -180; lon < 180; lon += 30) {
    const merid = [];
    for (let lat = -90; lat <= 90; lat += 6) merid.push([lat, lon]);
    lines.push(merid);
  }
  return lines;
})();

function pathFromPoints(pts, lon0, R, cx, cy, closed) {
  let d = '';
  let started = false;
  for (let i = 0; i < pts.length; i++) {
    const [lat, lon] = pts[i];
    const p = project(lat, lon, lon0);
    if (!p.visible) { started = false; continue; }
    const x = cx + p.x * R;
    const y = cy - p.y * R;
    if (!started) { d += `M ${x} ${y} `; started = true; }
    else d += `L ${x} ${y} `;
  }
  if (closed && d) d += 'Z';
  return d;
}

// Clip a closed polygon to the visible hemisphere. Returns array of sub-paths.
// When the polyline crosses the horizon, we interpolate to a point on the rim
// and walk along the rim to the next entry point so the polygon stays closed.
function clipPolygonToHemisphere(pts, lon0, R, cx, cy) {
  const projected = pts.map(([lat, lon]) => {
    const p = project(lat, lon, lon0);
    return { x: cx + p.x * R, y: cy - p.y * R, visible: p.visible, depth: p.depth };
  });
  const n = projected.length;
  if (n < 2) return '';

  // Find rim intersection between two consecutive points where one is visible & other is not.
  // We binary-search the great-circle arc parameter t for the horizon (depth = 0).
  const interpRim = (a, b) => {
    const A = pts[a], B = pts[b];
    let lo = 0, hi = 1;
    const visAt = (t) => {
      const lat = A[0] + (B[0] - A[0]) * t;
      const lon = A[1] + (B[1] - A[1]) * t;
      return project(lat, lon, lon0);
    };
    // ensure lo is visible side
    let pLo = visAt(0), pHi = visAt(1);
    if (pLo.visible === pHi.visible) return null;
    for (let it = 0; it < 18; it++) {
      const mid = (lo + hi) / 2;
      const pm = visAt(mid);
      if (pm.visible === pLo.visible) lo = mid; else hi = mid;
    }
    const pm = visAt((lo + hi) / 2);
    return { x: cx + pm.x * R, y: cy - pm.y * R };
  };

  // Walk the polygon, emitting segments and rim arcs as needed.
  let d = '';
  let inside = projected[0].visible;
  let started = false;
  // Find a starting index that is visible if any
  let start = 0;
  if (!inside) {
    for (let i = 0; i < n; i++) if (projected[i].visible) { start = i; inside = true; break; }
    if (!inside) return ''; // entire polygon hidden
  }

  let firstPointEmitted = false;
  let firstX = 0, firstY = 0;
  let lastVisibleIdx = -1;

  for (let k = 0; k <= n; k++) {
    const i = (start + k) % n;
    const cur = projected[i];
    const prevK = k === 0 ? -1 : (start + k - 1) % n;
    const prev = prevK === -1 ? null : projected[prevK];

    if (k === 0) {
      // start: cur is visible
      d += `M ${cur.x} ${cur.y} `;
      firstX = cur.x; firstY = cur.y;
      firstPointEmitted = true;
      lastVisibleIdx = i;
      continue;
    }

    if (cur.visible && prev.visible) {
      d += `L ${cur.x} ${cur.y} `;
      lastVisibleIdx = i;
    } else if (prev.visible && !cur.visible) {
      // exiting: line to rim point
      const rim = interpRim(prevK, i);
      if (rim) d += `L ${rim.x} ${rim.y} `;
    } else if (!prev.visible && cur.visible) {
      // entering: arc along rim from previous exit to new entry, then line
      const rim = interpRim(prevK, i);
      if (rim) {
        // Arc from last point on rim to this rim entry — sweep along sphere edge
        // Use SVG A command: rx=ry=R, large-arc=0, sweep=1 traces the rim clockwise from last point.
        d += `A ${R} ${R} 0 0 1 ${rim.x} ${rim.y} `;
        d += `L ${cur.x} ${cur.y} `;
      } else {
        d += `M ${cur.x} ${cur.y} `;
      }
      lastVisibleIdx = i;
    }
    // both invisible → skip
  }

  // close back to first point along rim if last segment was offscreen
  const lastVisible = projected[(start + n - 1) % n].visible;
  if (firstPointEmitted) {
    if (!lastVisible) {
      d += `A ${R} ${R} 0 0 1 ${firstX} ${firstY} `;
    }
    d += 'Z';
  }
  return d;
}

function SpeakingGlobe({ pins = [], height = 560, autoRotate = true, onPinClick }) {
  const [lon0, setLon0] = useGlobeState(-30);   // current center longitude
  const [hovered, setHovered] = useGlobeState(null);
  const [active, setActive] = useGlobeState(null);
  const [highlightIdx, setHighlightIdx] = useGlobeState(null);
  const rafRef = useGlobeRef(null);
  const lastRef = useGlobeRef(performance.now());
  const pausedRef = useGlobeRef(false);

  // SVG viewBox: we'll use a 800x800 box, sphere fills with margin
  const VB = 800;
  const cx = VB / 2;
  const cy = VB / 2;
  const R  = VB * 0.42;

  useGlobeEffect(() => {
    if (!autoRotate) return;
    const tick = (t) => {
      const dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      if (!pausedRef.current) {
        setLon0(prev => prev + dt * 12); // 12 deg/sec
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoRotate]);

  // Sequentially highlight pins as the globe rotates over them
  useGlobeEffect(() => {
    if (pins.length === 0) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % pins.length;
      setHighlightIdx(i);
    }, 1800);
    return () => clearInterval(id);
  }, [pins.length]);

  const onMouseEnter = () => { pausedRef.current = true; };
  const onMouseLeave = () => { pausedRef.current = false; setHovered(null); };

  // Project all pins, normalize for current rotation
  const projectedPins = pins.map((p, idx) => {
    const proj = project(p.lat, p.lon, lon0);
    return {
      ...p, idx,
      x: cx + proj.x * R,
      y: cy - proj.y * R,
      visible: proj.visible,
      depth: proj.depth,
      isHighlight: idx === highlightIdx,
    };
  }).sort((a, b) => a.depth - b.depth); // back-to-front

  return (
    <div style={{
      position: 'relative',
      width: '100%', height,
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 40%, #14223a 0%, #0A0F18 70%, #050810 100%)',
    }}>
      {/* Starfield */}
      <Starfield />

      {/* Globe SVG */}
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(92%, 760px)', height: 'auto',
          display: 'block',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <defs>
          {/* Sphere gradient — subtle ocean glow */}
          <radialGradient id="sphereGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1f3257"/>
            <stop offset="55%" stopColor="#11203a"/>
            <stop offset="100%" stopColor="#070b14"/>
          </radialGradient>
          {/* Atmospheric halo */}
          <radialGradient id="atmoGrad" cx="50%" cy="50%" r="55%">
            <stop offset="80%" stopColor="rgba(96,165,250,0)"/>
            <stop offset="92%" stopColor="rgba(96,165,250,0.18)"/>
            <stop offset="100%" stopColor="rgba(96,165,250,0)"/>
          </radialGradient>
          {/* Specular highlight (sun) */}
          <radialGradient id="specGrad" cx="32%" cy="28%" r="45%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
          {/* Pin glow */}
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232,181,71,1)"/>
            <stop offset="40%" stopColor="rgba(232,181,71,0.6)"/>
            <stop offset="100%" stopColor="rgba(232,181,71,0)"/>
          </radialGradient>
          <radialGradient id="pinGlowHot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,225,140,1)"/>
            <stop offset="35%" stopColor="rgba(232,181,71,0.85)"/>
            <stop offset="100%" stopColor="rgba(232,181,71,0)"/>
          </radialGradient>
          <radialGradient id="pinGlowRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,120,140,1)"/>
            <stop offset="35%" stopColor="rgba(239,14,48,0.85)"/>
            <stop offset="100%" stopColor="rgba(239,14,48,0)"/>
          </radialGradient>
        </defs>

        {/* Atmosphere halo */}
        <circle cx={cx} cy={cy} r={R * 1.08} fill="url(#atmoGrad)"/>

        {/* Sphere base */}
        <circle cx={cx} cy={cy} r={R} fill="url(#sphereGrad)" />

        {/* Graticule */}
        {GRATICULE.map((line, i) => (
          <path key={`grat-${i}`}
            d={pathFromPoints(line, lon0, R, cx, cy, false)}
            fill="none"
            stroke="rgba(96,165,250,0.10)"
            strokeWidth="0.8"
          />
        ))}

        {/* Continents */}
        {CONTINENTS.map((cont, i) => (
          <path key={`cont-${i}`}
            d={clipPolygonToHemisphere(cont, lon0, R, cx, cy)}
            fill="rgba(96,165,250,0.18)"
            stroke="rgba(96,165,250,0.55)"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        ))}

        {/* Specular highlight */}
        <circle cx={cx} cy={cy} r={R} fill="url(#specGrad)" pointerEvents="none"/>

        {/* Equator emphasis */}
        <path
          d={pathFromPoints(
            (() => { const r = []; for (let lon = -180; lon <= 180; lon += 4) r.push([0, lon]); return r; })(),
            lon0, R, cx, cy, false
          )}
          fill="none" stroke="rgba(201,168,76,0.22)" strokeWidth="0.8" strokeDasharray="3 4"
        />

        {/* Pins */}
        {projectedPins.map(p => p.visible && (
          <g key={`pin-${p.idx}`}>
            {/* Outer glow halo */}
            <circle cx={p.x} cy={p.y} r={p.isHighlight ? 26 : (p.featured ? 18 : 14)}
              fill={p.featured ? 'url(#pinGlowRed)' : (p.isHighlight ? 'url(#pinGlowHot)' : 'url(#pinGlow)')}
              opacity={p.featured ? 0.85 : (p.isHighlight ? 0.95 : 0.55)}
            >
              {(p.isHighlight || p.featured) && (
                <animate attributeName="r" values={p.featured ? "16;26;16" : "14;30;14"} dur={p.featured ? "1.8s" : "1.6s"} repeatCount="indefinite"/>
              )}
            </circle>
            {/* Pin core */}
            <circle cx={p.x} cy={p.y} r={p.featured ? 4.5 : (p.isHighlight ? 4.5 : 3.2)}
              fill={p.featured ? '#ef0e30' : (p.isHighlight ? '#FFE18C' : '#E8B547')}
              stroke="rgba(10,15,24,0.9)"
              strokeWidth="0.8"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(p.idx)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { setActive(p.idx); onPinClick && onPinClick(p); }}
            />
            {/* Vertical beam (only if highlighted, faint) */}
            {p.isHighlight && (
              <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - 18}
                stroke="rgba(232,181,71,0.7)" strokeWidth="1"
              >
                <animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/>
              </line>
            )}
          </g>
        ))}

        {/* Hover tooltip */}
        {hovered != null && (() => {
          const p = projectedPins.find(x => x.idx === hovered);
          if (!p || !p.visible) return null;
          const label = `${p.city}, ${p.country}`;
          const w = 8 + label.length * 6.5;
          return (
            <g pointerEvents="none">
              <rect x={p.x + 10} y={p.y - 26} width={w} height={20} rx="0"
                fill="rgba(10,15,24,0.92)" stroke="rgba(232,181,71,0.55)" strokeWidth="0.8"/>
              <text x={p.x + 14} y={p.y - 12}
                fontFamily="Barlow Condensed, sans-serif"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.12em"
                fill="#E8B547"
                style={{ textTransform: 'uppercase' }}
              >{label.toUpperCase()}</text>
            </g>
          );
        })()}
      </svg>

      {/* Active pin detail card */}
      {active != null && (() => {
        const p = pins[active];
        if (!p) return null;
        return (
          <div style={{
            position: 'absolute',
            top: 24, right: 24,
            width: 280,
            background: 'rgba(10,15,24,0.92)',
            border: '1px solid rgba(232,181,71,0.4)',
            backdropFilter: 'blur(12px)',
            padding: '20px 22px',
            zIndex: 5,
          }}>
            <button type="button" onClick={() => setActive(null)} style={{
              position: 'absolute', top: 8, right: 10,
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0,
            }}>×</button>
            <p style={{
              margin: 0,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 10,
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: '#E8B547',
            }}>{p.year} · Speaking</p>
            <h4 style={{
              margin: '6px 0 4px',
              fontFamily: 'Playfair Display, Georgia, serif',
              fontWeight: 700, fontSize: 22, lineHeight: 1.15,
              color: '#fff',
            }}>{p.city}</h4>
            <p style={{
              margin: '0 0 12px',
              fontFamily: 'Barlow, sans-serif',
              fontSize: 12, letterSpacing: '0.04em',
              color: 'rgba(255,255,255,0.55)',
            }}>{p.country}</p>
            {p.event && (
              <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{
                  margin: 0, fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                }}>Event</p>
                <p style={{ margin: '3px 0 8px', fontFamily: 'Barlow, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.event}</p>
                {p.talk && (
                  <>
                    <p style={{
                      margin: 0, fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.5)',
                    }}>Talk</p>
                    <p style={{
                      margin: '3px 0 0',
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 14, lineHeight: 1.4,
                      color: '#E8B547',
                    }}>"{p.talk}"</p>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Now Spotlighting strip */}
      <div style={{
        position: 'absolute',
        bottom: 24, left: 24,
        display: 'inline-flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        background: 'rgba(10,15,24,0.7)',
        border: '1px solid rgba(232,181,71,0.35)',
        backdropFilter: 'blur(10px)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#E8B547', boxShadow: '0 0 8px #E8B547',
        }}/>
        <span style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 10,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
        }}>Now Spotlighting</span>
        <span style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 16,
          color: '#E8B547',
        }}>{highlightIdx != null && pins[highlightIdx] ? `${pins[highlightIdx].city}, ${pins[highlightIdx].country}` : '—'}</span>
      </div>

      {/* Legend / count */}
      <div style={{
        position: 'absolute',
        bottom: 24, right: 24,
        textAlign: 'right',
      }}>
        <p style={{
          margin: 0,
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 48, lineHeight: 1, letterSpacing: '0.04em',
          color: '#E8B547',
        }}>{pins.length}</p>
        <p style={{
          margin: '2px 0 0',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 10,
          letterSpacing: '0.32em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
        }}>Stages · {new Set(pins.map(p => p.country)).size} countries</p>
      </div>
    </div>
  );
}

// Subtle starfield behind the globe
function Starfield() {
  const stars = useGlobeRef(null);
  if (!stars.current) {
    const arr = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.6 + 0.2,
        d: Math.random() * 4 + 2,
      });
    }
    stars.current = arr;
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
    }}>
      {stars.current.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s * 0.08} fill="#fff" opacity={s.a}>
          <animate attributeName="opacity"
            values={`${s.a};${s.a * 0.2};${s.a}`}
            dur={`${s.d}s`}
            repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  );
}

window.SpeakingGlobe = SpeakingGlobe;
