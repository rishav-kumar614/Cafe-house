import { geo, mat, tex, repeated } from '../kit.js';
import { Mesh } from '../food/shapes.jsx';
import { SceneFood } from './interactive.jsx';
import { Chair, Table, Umbrella, Planter, Tree, StringLights, Bench, AFrameSign, StreetLamp, Plant } from './Furniture.jsx';

const PATIO_TABLES = [
  { p: [-7.2, 0, 11.2], color: '#c4622d', food: ['cappuccino', 'cinnamon-roll'] },
  { p: [-4.0, 0, 11.6], color: '#7f9a7a', food: ['lemon-iced-tea', 'veg-burger'] },
  { p: [4.4, 0, 11.6], color: '#7f9a7a', food: ['strawberry-milkshake', 'loaded-fries'] },
  { p: [7.6, 0, 11.2], color: '#c4622d', food: ['espresso', 'tiramisu'] },
];

export function Outdoor({ q, reducedMotion, onOpen, specials = [] }) {
  const deck = mat('#ffffff', { map: repeated(tex.woodPlanks(), 5, 2), roughness: 0.7 });
  const concrete = mat('#b9b2a8', { roughness: 0.95 });
  return (
    <group>
      {/* Ground: patio deck, pavement, road, grass */}
      <Mesh g={geo.plane(20.4, 6)} m={deck} p={[0, 0.01, 11]} r={[-Math.PI / 2, 0, 0]} cast={false} />
      <Mesh g={geo.plane(60, 3)} m={concrete} p={[0, 0.005, 15.5]} r={[-Math.PI / 2, 0, 0]} cast={false} />
      <Mesh g={geo.plane(80, 10)} m={mat('#3a3b3d', { roughness: 0.9 })} p={[0, 0.002, 22]} r={[-Math.PI / 2, 0, 0]} cast={false} />
      {[-12, -4, 4, 12].map((x) => (
        <Mesh key={x} g={geo.plane(3, 0.15)} m={mat('#e9e4d4')} p={[x, 0.004, 22]} r={[-Math.PI / 2, 0, 0]} cast={false} />
      ))}
      <Mesh g={geo.plane(140, 140)} m={mat('#6d8a4e', { roughness: 1 })} p={[0, -0.01, 0]} r={[-Math.PI / 2, 0, 0]} cast={false} receive />

      {/* Planters edge the patio, leaving an opening to the door */}
      <Planter p={[-6.2, 0, 13.7]} length={7} seed="pl-left" />
      <Planter p={[6.2, 0, 13.7]} length={7} seed="pl-right" />

      {PATIO_TABLES.map((t, i) => (
        <group key={i}>
          <Table p={t.p} round size={0.9}>
            {q.decor && t.food.map((slug, k) => <SceneFood key={slug} slug={slug} p={[k ? -0.18 : 0.15, 0, k ? 0.05 : -0.05]} s={0.075} quality="low" onOpen={onOpen} />)}
          </Table>
          <Umbrella p={t.p} color={t.color} />
          <Chair p={[t.p[0] - 0.75, 0, t.p[2]]} r={Math.PI / 2} color="#2a1d15" />
          <Chair p={[t.p[0] + 0.75, 0, t.p[2]]} r={-Math.PI / 2} color="#2a1d15" />
        </group>
      ))}

      {/* String lights between posts */}
      {[-9.8, 9.8].map((x) => (
        <group key={x}>
          <Mesh g={geo.cyl(0.05, 0.05, 3.4, 8)} m={mat('#2a1d15')} p={[x, 1.7, 13.4]} />
        </group>
      ))}
      <StringLights from={[-9.8, 3.4, 13.4]} to={[0, 3.2, 8.3]} sag={0.6} reducedMotion={reducedMotion} />
      <StringLights from={[9.8, 3.4, 13.4]} to={[0, 3.2, 8.3]} sag={0.6} reducedMotion={reducedMotion} />
      {q.decor && <StringLights from={[-9.8, 3.4, 13.4]} to={[9.8, 3.4, 13.4]} sag={0.9} count={22} reducedMotion={reducedMotion} />}

      <Tree p={[-11.5, 0, 12]} seed="t1" />
      <Tree p={[11.5, 0, 12.5]} seed="t2" size={1.1} />
      {q.decor && (
        <>
          <Tree p={[-14, 0, 6]} seed="t3" size={1.3} />
          <Tree p={[14, 0, 4]} seed="t4" size={1.2} />
          <Bench p={[-2.6, 0, 9.0]} r={Math.PI} />
          <StreetLamp p={[-8, 0, 16.6]} />
          <StreetLamp p={[8, 0, 16.6]} />
          {/* Neighbouring buildings give the street some depth */}
          {[[-26, 7, 0, '#cbb59a'], [26, 6, 0, '#b9a58f'], [-18, 9, -14, '#a89a88'], [18, 8, -14, '#c2ad94']].map(([x, h, z, c], i) => (
            <Mesh key={i} g={geo.box(12, h, 14)} m={mat(c, { roughness: 0.95 })} p={[x, h / 2, z]} cast={false} />
          ))}
        </>
      )}
      <Plant p={[-1.6, 0, 8.6]} size={1.1} seed="door-l" reducedMotion={reducedMotion} />
      <Plant p={[1.6, 0, 8.6]} size={1.1} seed="door-r" reducedMotion={reducedMotion} />
      <AFrameSign p={[2.4, 0, 10.2]} r={-0.4} title="Today" lines={specials.length ? specials : [['Fresh bakes', ''], ['Wood-fired pizza', '']]} />
    </group>
  );
}
