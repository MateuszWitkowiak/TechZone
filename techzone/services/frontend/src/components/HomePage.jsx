import { useState, useEffect } from "react";
import axios from "axios";
import { useKeycloak } from "@react-keycloak/web";
import ProductCard from "../components/Product/Product";
import "./Homepage.css";

const API_URL = import.meta.env.VITE_API_URL;

function HomePage() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState('');
  const { keycloak, initialized } = useKeycloak();

  const getValidToken = async () => {
    if (keycloak?.token && keycloak.isTokenExpired && keycloak.isTokenExpired()) {
      try {
        await keycloak.updateToken(10);
      } catch (e) {
        setMessage("Sesja wygasła, zaloguj się ponownie.");
      }
    }
    return keycloak?.token;
  };

  const axiosConfig = async () => {
    const token = await getValidToken();
    return token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
  };

  useEffect(() => {
    if (initialized) {
      fetchProducts();
    }
  }, [initialized]);

  const fetchProducts = async () => {
    setMessage("");
    try {
      const response = await axios.get(
        `${API_URL}/api/products/getAll`,
        await axiosConfig()
      );
      setProducts(response.data);
    } catch (err) {
      setMessage("Błąd podczas pobierania produktów.");
    }
  };

  const addToCart = (product) => {
    if (!keycloak.authenticated) {
      keycloak.login()
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]") ;
    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart))
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Najlepsze produkty elektroniczne</h1>
      <div className="categories-section">
        <h2 className="categories-title">Kategorie</h2>
        <div className="categories-list">
          <button className="category-btn" onClick={() => setCategory('')}>🛍️ Wszystkie produkty</button>
          <button className="category-btn" onClick={() => setCategory('phones')}>📱 Telefony</button>
          <button className="category-btn" onClick={() => setCategory('laptops')}>💻 Laptopy</button>
          <button className="category-btn" onClick={() => setCategory('audio')}>🎧 Audio</button>
          <button className="category-btn" onClick={() => setCategory('tablets')}>📱 Tablety</button>
          <button className="category-btn" onClick={() => setCategory('accessories')}>🔌 Akcesoria</button>
        </div>
      </div>
      <div className="products-section">
        <h2 className="products-title">Polecane produkty</h2>
        {message && <div className="admin-message">{message}</div>}
        <div className="products-list">
          {products.length === 0 ? (
            <p>Brak produktów.</p>
          ) : (
            (category === '' ? products : products.filter(product => product.category === category)).filter(product => product.stock > 0).filter(product => product.isActive).map((product) => (
              <div key={product._id} className="product-card-wrapper">
                <ProductCard key={product._id} product={product} />
                <button
                  onClick={() => addToCart(product)}
                  className="add-to-cart-btn"
                >
                  Dodaj do koszyka
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;