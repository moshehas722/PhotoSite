import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { FolderView } from './components/FolderView';
import { CartProvider } from './cart/CartContext';
import { CartButton } from './cart/CartButton';
import { CartDrawer } from './cart/CartDrawer';

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="app">
          <header className="app-header">
            <h1>Photo Album</h1>
            <CartButton onClick={() => setCartOpen(true)} />
          </header>
          <div className="app-body">
            <Sidebar />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<FolderView />} />
                <Route path="/folder/:folderId" element={<FolderView />} />
              </Routes>
            </main>
          </div>
          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
