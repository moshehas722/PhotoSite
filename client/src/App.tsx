import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './theme/ThemeContext';
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
import { FolderHierarchyProvider } from './context/FolderHierarchyContext';
import { InfoIcon } from './icons/InfoIcon';
import { ShoppingIcon } from './icons/ShoppingIcon';
import { HomeIcon } from './icons/HomeIcon';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function HeaderCart() {
  const { user } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Link to="/purchases" className="app-header__icon-btn" aria-label="My Purchases">
        <ShoppingIcon />
      </Link>
      <CartButton onClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
      <AuthProvider>
        <TransactionsProvider>
          <CartProvider>
            <FolderHierarchyProvider>
            <BrowserRouter>
              <div className="app">
                <header className="app-header">
                  <Link to="/" className="app-header__title" aria-label="Home" />
                  <div className="app-header__right">
                    <Link to="/about" className="app-header__icon-btn" aria-label="About">
                      <InfoIcon />
                    </Link>
                    <HeaderCart />
                    <Link to="/" className="app-header__icon-btn" aria-label="Home">
                      <HomeIcon />
                    </Link>
                    <UserMenu />
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
            </FolderHierarchyProvider>
          </CartProvider>
        </TransactionsProvider>
      </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
