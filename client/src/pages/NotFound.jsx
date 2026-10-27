import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page narrow empty-state">
      <h1>Page not found</h1>
      <p>That table doesn’t exist. Let’s get you back to the food.</p>
      <div className="row gap center">
        <Link className="btn" to="/menu">
          Open the menu
        </Link>
        <Link className="btn btn-ghost" to="/">
          Explore the cafe
        </Link>
      </div>
    </div>
  );
}
