import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMenu } from '../store/menu.js';
import { ZONES } from '../three/cafe/zones.js';

export default function AboutPage() {
  const info = useMenu((s) => s.info);
  useEffect(() => {
    document.title = 'About · Ember & Bean';
  }, []);

  return (
    <div className="page about-page">
      {info?.isSampleData && (
        <p className="sample-banner" role="note">
          The story, address, phone number and hours below are placeholders. The cafe owner can replace them in Admin → Settings.
        </p>
      )}
      <section className="about-hero">
        <p className="eyebrow">Our story</p>
        <h1>{info?.cafeName || 'Ember & Bean'}</h1>
        <p className="lead">{info?.tagline}</p>
        <p>{info?.about}</p>
      </section>

      <div className="about-grid">
        <section className="card">
          <h2>Visit us</h2>
          <p>{info?.address}</p>
          <p>
            Phone: {info?.phone}
            <br />
            Email: {info?.email && <a href={`mailto:${info.email}`}>{info.email}</a>}
          </p>
        </section>
        <section className="card">
          <h2>Opening hours</h2>
          <table className="hours">
            <tbody>
              {info?.hours?.map((h) => (
                <tr key={h.days}>
                  <th scope="row">{h.days}</th>
                  <td>
                    {h.open} – {h.close}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="about-zones">
        <h2>Inside the cafe</h2>
        <p className="muted">Every area of our cafe can be explored in 3D. Jump straight to one:</p>
        <ul className="zone-cards">
          {ZONES.filter((z) => z.blurb).map((z) => (
            <li key={z.id} className="card zone-card">
              <h3>{z.label}</h3>
              <p className="muted">{z.blurb}</p>
              <Link to={`/?zone=${z.id}`}>Explore in 3D →</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
