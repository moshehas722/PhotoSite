import './App.css';
import { Gallery } from './components/Gallery';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Photo Album</h1>
      </header>
      <main className="app-main">
        <Gallery />
      </main>
    </div>
  );
}

export default App;
