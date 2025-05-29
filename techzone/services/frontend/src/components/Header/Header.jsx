import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { useKeycloak } from '@react-keycloak/web';

function Header() {
  const { keycloak, initialized } = useKeycloak();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartSize, setCartSize] = useState(0)

  
  useEffect(() => {
    const updateCartSize = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartSize(cart.length);
    };

    updateCartSize();
    window.addEventListener("storage", updateCartSize);

    return () => window.removeEventListener("storage", updateCartSize);
  }, []);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    setSearchQuery('');
  };

  const handleCart = () => {
    navigate('/cart');
  };

  const handleOrders = () => {
    navigate('/orders');
  };
  const handleLogout = () => {
    localStorage.setItem("cart", "[]");
    window.dispatchEvent(new Event("storage"));
    keycloak.logout();
  }

  return (
    <div className="header">
      <div className="logo" onClick={handleLogoClick}>
        TechZone
      </div>
      <form className="search-container" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="search"
          placeholder="Szukaj produktów..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="search-button" type="submit" aria-label="Search">
          <Search className="search-icon" />
        </button>
      </form>
      <div className="nav-buttons">
        {keycloak.authenticated ? (
          <>
            <span className="user-nick" style={{ fontWeight: 'bold', marginRight: '1rem' }}>
              Witaj, {keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.email || "User"}
            </span>
            {keycloak.hasRealmRole('admin') && (
              <button
                className="admin-panel-button"
                onClick={() => navigate('/admin')}
              >
                Panel admina
              </button>
            )}
            {!keycloak.hasRealmRole('admin') && (
              <button className="orders-button" onClick={handleOrders}>Zamówienia</button>
            )}
            <button className="cart-button" onClick={handleCart}>Cart {cartSize > 0 ? `(${cartSize})` : ""}</button>
            <button className="auth-button logout-button" onClick={handleLogout}>Wyloguj</button>
          </>
        ) : (
          <>
            <button className="auth-button login-button" onClick={() => keycloak.login()}>Zaloguj</button>
            <button className="auth-button register-button" onClick={() => keycloak.register()}>Zarejestruj</button>
            <button className="cart-button" onClick={handleCart}>Cart {cartSize > 0 ? `(${cartSize})` : ""}</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Header;