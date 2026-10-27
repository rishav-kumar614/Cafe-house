import { geo, mat } from '../kit.js';
import { Mesh } from '../food/shapes.jsx';
import { SceneFood, Steam } from './interactive.jsx';
import { Chair, Stool, Sofa, Table, TableSet, Plant, HangingPlant, Pendant, FloorLamp, CeilingFan, Artwork, WallShelf, Rug, FURNITURE_MATERIALS as W } from './Furniture.jsx';

// Tables in the dining hall with what is being eaten at each.
const TABLES = [
  { p: [-1.6, 0, 2.4], n: 1, seats: 2, food: [['classic-burger', [0.12, 0, 0.08], 0.075], ['cold-coffee', [-0.18, 0, -0.1], 0.07]] },
  { p: [1.2, 0, 2.4], n: 2, seats: 2, food: [['cafe-latte', [0.1, 0, 0.1], 0.07], ['butter-croissant', [-0.15, 0, -0.05], 0.08]] },
  { p: [4.0, 0, 2.6], n: 3, seats: 2, food: [['masala-dosa', [0, 0, 0], 0.08]] },
  { p: [-1.6, 0, -1.8], n: 4, seats: 4, round: true, size: 1.1, food: [['margherita-pizza', [0, 0, 0], 0.11], ['mocktail', [0.36, 0, 0.2], 0.07]] },
  { p: [1.6, 0, -1.8], n: 5, seats: 4, round: true, size: 1.1, marble: true, food: [['indian-thali', [0, 0, 0], 0.1]] },
  { p: [4.6, 0, -1.6], n: 6, seats: 4, round: true, size: 1.1, food: [['chicken-biryani', [-0.15, 0, 0], 0.09], ['hakka-noodles', [0.22, 0, 0.1], 0.08]] },
];

function seatsFor(t) {
  const d = (t.size || 0.75) / 2 + 0.32;
  if (t.seats === 2) return [[0, d, Math.PI], [0, -d, 0]];
  return [[0, d, Math.PI], [0, -d, 0], [d, 0, -Math.PI / 2], [-d, 0, Math.PI / 2]];
}

export function Interior({ q, reducedMotion, onOpen }) {
  const foodQuality = q.detail === 'high' ? 'medium' : 'low';
  return (
    <group>
      {/* ----- Dining hall ----- */}
      {TABLES.map((t) => (
        <group key={t.n}>
          <Table p={t.p} round={t.round} size={t.size || 0.75} marble={t.marble}>
            <TableSet number={t.n} flower={t.n % 2 ? '#e8584a' : '#f2c14e'} />
            {q.decor &&
              t.food.map(([slug, offset, s]) => <SceneFood key={slug} slug={slug} p={offset} s={s} quality={foodQuality} onOpen={onOpen} />)}
          </Table>
          {seatsFor(t).map(([dx, dz, r], i) => (
            <Chair key={i} p={[t.p[0] + dx, 0, t.p[2] + dz]} r={r} />
          ))}
        </group>
      ))}
      <Steam p={[1.3, 0.85, 2.5]} reducedMotion={reducedMotion} />
      {[-1.6, 1.4, 4.2].map((x) => (
        <Pendant key={`p${x}`} p={[x, 4.0, 2.4]} color="#c4622d" drop={1.6} />
      ))}
      {[-1.6, 1.6, 4.6].map((x) => (
        <Pendant key={`r${x}`} p={[x, 4.0, -1.7]} color="#2a1d15" drop={1.5} />
      ))}
      <CeilingFan p={[0, 4.2, 0.4]} reducedMotion={reducedMotion} />
      {q.decor && <CeilingFan p={[5.5, 4.2, 0.4]} reducedMotion={reducedMotion} />}
      <Rug p={[1.4, 0.006, 0.3]} w={7.4} d={6.4} color="#9aa88a" />

      {/* ----- Sofa lounge along the right wall ----- */}
      <Rug p={[8.3, 0.008, -1.3]} w={2.6} d={3.6} color="#c4622d" />
      <Sofa p={[9.35, 0, -1.2]} r={-Math.PI / 2} length={2.6} color="#4d6b5a" />
      <Sofa p={[8.2, 0, -3.5]} r={0} length={1.8} color="#8a5a3a" />
      <group position={[8.2, 0, -1.2]}>
        <Mesh g={geo.rbox(1.0, 0.06, 0.7, 0.02)} m={W.walnut()} p={[0, 0.42, 0]} />
        {[[-0.4, -0.28], [0.4, -0.28], [-0.4, 0.28], [0.4, 0.28]].map(([x, z], i) => (
          <Mesh key={i} g={geo.cyl(0.025, 0.025, 0.4, 8)} m={W.black()} p={[x, 0.2, z]} />
        ))}
        <Mesh g={geo.box(0.3, 0.05, 0.22)} m={mat('#c4622d', { roughness: 0.8 })} p={[-0.25, 0.47, 0.1]} r={[0, 0.3, 0]} />
        <Mesh g={geo.box(0.28, 0.04, 0.2)} m={mat('#2a1d15', { roughness: 0.8 })} p={[-0.25, 0.515, 0.1]} r={[0, 0.5, 0]} />
        <SceneFood slug="cappuccino" p={[0.2, 0.45, 0]} s={0.07} quality={foodQuality} onOpen={onOpen} />
        <SceneFood slug="chocolate-brownie" p={[0.25, 0.45, -0.22]} s={0.07} quality={foodQuality} onOpen={onOpen} />
      </group>
      <Steam p={[8.4, 0.55, -1.2]} reducedMotion={reducedMotion} />
      <FloorLamp p={[9.4, 0, -3.4]} />
      <WallShelf p={[9.85, 1.5, 1.2]} r={-Math.PI / 2} length={1.6} items="books" />
      <WallShelf p={[9.85, 2.0, 1.2]} r={-Math.PI / 2} length={1.6} items="books" />
      <Artwork p={[9.88, 2.4, -1.2]} r={-Math.PI / 2} w={1.6} h={1.0} seed="lounge" palette={['#f3e7cf', '#4d6b5a', '#c4622d', '#2a1d15']} />
      <Plant p={[9.3, 0, 0.6]} size={1.2} seed="lounge-plant" reducedMotion={reducedMotion} />

      {/* ----- Window counter facing the street ----- */}
      <group position={[-5.8, 0, 7.45]}>
        <Mesh g={geo.box(6.4, 0.05, 0.45)} m={W.oak()} p={[0, 1.05, 0]} />
        {[-3, 0, 3].map((x) => (
          <Mesh key={x} g={geo.box(0.05, 1.05, 0.4)} m={W.black()} p={[x, 0.52, 0]} />
        ))}
      </group>
      {[-8.4, -7.1, -5.8, -4.5, -3.2].map((x) => (
        <Stool key={x} p={[x, 0, 6.9]} />
      ))}
      <SceneFood slug="americano" p={[-7.1, 1.075, 7.45]} s={0.07} quality={foodQuality} onOpen={onOpen} />
      <SceneFood slug="blueberry-muffin" p={[-6.85, 1.075, 7.5]} s={0.07} quality={foodQuality} onOpen={onOpen} />
      <SceneFood slug="iced-mocha" p={[-4.5, 1.075, 7.45]} s={0.065} quality={foodQuality} onOpen={onOpen} />

      {/* ----- Greenery and walls ----- */}
      <Plant p={[-2.9, 0, 6.6]} size={1.3} seed="entry-l" reducedMotion={reducedMotion} />
      <Plant p={[2.9, 0, 6.6]} size={1.3} seed="entry-r" reducedMotion={reducedMotion} />
      <Plant p={[-9.4, 0, 3.4]} size={1.1} seed="corner" reducedMotion={reducedMotion} />
      {q.decor && (
        <>
          <HangingPlant p={[-3.8, 3.4, 4.2]} seed="h1" />
          <HangingPlant p={[5.8, 3.4, 3.6]} seed="h2" />
          <HangingPlant p={[-3.6, 3.4, -0.8]} seed="h3" />
          <Plant p={[-2.9, 0, -4.4]} size={0.9} seed="bar-end" reducedMotion={reducedMotion} />
        </>
      )}
      <Artwork p={[-9.88, 2.5, 5.0]} r={Math.PI / 2} seed="window-art" />
      <Artwork p={[9.88, 2.5, 3.2]} r={-Math.PI / 2} seed="right-art" w={0.8} h={1.0} />
      {/* Welcome mat */}
      <Mesh g={geo.plane(2.0, 1.0)} m={mat('#3a2a20', { roughness: 1 })} p={[0, 0.008, 7.3]} r={[-Math.PI / 2, 0, 0]} cast={false} />
    </group>
  );
}
