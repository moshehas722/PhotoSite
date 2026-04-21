import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { FolderView } from './components/FolderView';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { UserMenu } from './auth/UserMenu';
import { CartProvider } from './cart/CartContext';
import { CartButton } from './cart/CartButton';
import { CartDrawer } from './cart/CartDrawer';
import { TransactionsProvider } from './transactions/TransactionsContext';
import { PurchasesView } from './pages/PurchasesView';
import { AdminView } from './pages/AdminView';
import { AboutView } from './pages/AboutView';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function HeaderCart() {
  const { user } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Link to="/purchases" className="app-header__link">My Purchases</Link>
      {user.isAdmin && (
        <Link to="/admin" className="app-header__link">Admin</Link>
      )}
      <CartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <TransactionsProvider>
          <CartProvider>
            <BrowserRouter>
              <div className="app">
                <header className="app-header">
                  <Link to="/" className="app-header__title"><h1>Photo Album</h1></Link>
                  <nav className="app-header__nav">
                    <Link to="/" className="app-header__link">Home</Link>
                    <Link to="/about" className="app-header__link">About</Link>
                  </nav>
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
                      <Route path="/purchases" element={<PurchasesView />} />
                      <Route path="/admin" element={<AdminView />} />
                      <Route path="/about" element={<AboutView />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </BrowserRouter>
          </CartProvider>
        </TransactionsProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
