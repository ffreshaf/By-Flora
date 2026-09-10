import './AppLoader.css';

export default function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-inner">
        <img
          src="/By-Flora.png"
          alt="By Flora"
          className="app-loader-logo"
        />

        <div className="app-loader-spinner" />

        <p>Taking care of her...</p>
      </div>
    </div>
  );
}