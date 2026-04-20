import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { FolderView } from './components/FolderView';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { UserMenu } from './auth/UserMenu';
import { CartProvider } from './cart/CartContext';
import { CartButton } from './cart/CartButton';
import { CartDrawer } from './cart/CartDrawer';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function HeaderCart() {
  const { user } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <CartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="app">
              <header className="app-header">
                <h1>Photo Album</h1>
                <div className="app-header__right">
                  <UserMenu />
                  <HeaderCart />
                </div>
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
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
