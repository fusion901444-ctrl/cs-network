// 아이소메트릭 네트워크 장비 일러스트 (로그인 화면, 헤더 로고)

const K = 0.866;
const O: [number, number] = [200, 130];
type Pt = [number, number, number];

const P = ([x, y, z]: Pt) => `${O[0] + (x - y) * K},${O[1] + (x + y) * 0.5 - z}`;
const poly = (pts: Pt[]) => pts.map(P).join(" ");

// (x, y, z) 위치에 가로 a, 세로 b, 높이 c 상자. 윗면 / 왼쪽 앞면 / 오른쪽 앞면 색
function Box({ x, y, z, a, b, c, top, left, right }: {
  x: number; y: number; z: number; a: number; b: number; c: number; top: string; left: string; right: string;
}) {
  const X = x + a, Y = y + b, Z = z + c;
  return (
    <g>
      <polygon points={poly([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]])} fill={left} />
      <polygon points={poly([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]])} fill={right} />
      <polygon points={poly([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]])} fill={top} />
      <polyline points={poly([[x, Y, Z], [X, Y, Z], [X, y, Z]])} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={1.2} />
    </g>
  );
}

const xy = (p: Pt) => P(p).split(",").map(Number) as [number, number];

export function NetworkArt() {
  const racks = [32, 52, 72, 92, 112];
  const ports = [122, 130, 138, 146, 154, 162];
  const link = (from: Pt, to: Pt, d = 0) => {
    const [x1, y1] = xy(from), [x2, y2] = xy(to);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} className="flow" style={{ animationDelay: `${d}s` }} />;
  };
  return (
    <svg viewBox="0 0 400 350" className="art" role="img" aria-label="네트워크 장비 일러스트">
      <defs>
        <radialGradient id="orb" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#1e3a8a" />
        </radialGradient>
        <radialGradient id="orb2" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor="#5eead4" />
          <stop offset="1" stopColor="#0f766e" />
        </radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>

      <ellipse cx="200" cy="325" rx="150" ry="18" fill="rgba(30,58,138,.28)" filter="url(#soft)" />
      <Box x={0} y={0} z={0} a={200} b={200} c={12} top="#ffffff" left="#dfe6f5" right="#c3cee8" />

      <g stroke="#3355c4" strokeWidth={3} strokeLinecap="round">
        {link([52, 52, 12], [145, 50, 12])}
        {link([145, 50, 12], [150, 145, 12], 0.4)}
        {link([150, 145, 12], [62, 147, 12], 0.8)}
        {link([62, 147, 12], [52, 52, 12], 1.2)}
      </g>

      {/* 서버 랙 */}
      <Box x={25} y={25} z={12} a={55} b={55} c={115} top="#6d8be6" left="#2a4cb3" right="#1e3a8a" />
      {racks.map((z, i) => {
        const [x1, y1] = xy([32, 80, z]), [x2, y2] = xy([62, 80, z]), [lx, ly] = xy([72, 80, z]);
        return (
          <g key={z}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.3)" strokeWidth={5} strokeLinecap="round" />
            <circle cx={lx} cy={ly} r={2.6} fill="#4ade80" className="led" style={{ animationDelay: `${i * 0.3}s` }} />
          </g>
        );
      })}

      {/* 스위치 */}
      <Box x={115} y={30} z={12} a={60} b={40} c={22} top="#99f6e4" left="#14b8a6" right="#0f766e" />
      {ports.map((x, i) => {
        const [px, py] = xy([x, 70, 23]);
        return <circle key={x} cx={px} cy={py} r={2.2} fill="#ecfeff" className="led" style={{ animationDelay: `${i * 0.2}s` }} />;
      })}

      {/* 방화벽 */}
      <Box x={40} y={125} z={12} a={45} b={45} c={40} top="#ddd6fe" left="#8b5cf6" right="#6d28d9" />
      {(() => {
        const [cx, cy] = xy([62, 147, 52]);
        return <path d={`M${cx} ${cy - 11} l9 4 v6 c0 6 -4 9 -9 11 c-5 -2 -9 -5 -9 -11 v-6 z`} fill="#7c3aed" stroke="#fff" strokeWidth={1.5} />;
      })()}

      {/* 무선AP */}
      <Box x={130} y={125} z={12} a={40} b={40} c={18} top="#fed7aa" left="#f97316" right="#c2410c" />
      {(() => {
        const [ax, ay] = xy([140, 135, 30]), [bx, by] = xy([160, 135, 30]);
        return (
          <g stroke="#9a3412" strokeWidth={2.5} strokeLinecap="round">
            <line x1={ax} y1={ay} x2={ax - 4} y2={ay - 24} />
            <line x1={bx} y1={by} x2={bx + 4} y2={by - 24} />
          </g>
        );
      })()}

      <circle cx="330" cy="70" r="16" fill="url(#orb)" className="float" />
      <circle cx="62" cy="230" r="10" fill="url(#orb2)" className="float" style={{ animationDelay: "1s" }} />
      <circle cx="352" cy="200" r="7" fill="url(#orb2)" className="float" style={{ animationDelay: "2s" }} />
    </svg>
  );
}

// 헤더용 입체 큐브 로고
export function CubeLogo() {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <polygon points="12,2 21,7 12,12 3,7" fill="#a5b4fc" />
      <polygon points="3,7 12,12 12,22 3,17" fill="#e0e7ff" />
      <polygon points="21,7 12,12 12,22 21,17" fill="#6366f1" />
    </svg>
  );
}
