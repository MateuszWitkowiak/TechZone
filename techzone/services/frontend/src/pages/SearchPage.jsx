import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/Product/Product";
import "./SearchPage.css"

export default function SearchPage() {
  const { query } = useParams();
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Pobierz wszystkie produkty
    const fetchProducts = async () => {
      setMessage("");
      try {
        const response = await axios.get("http://localhost:3001/api/products/getAll");
        setProducts(response.data);
      } catch (err) {
        setMessage("Błąd podczas pobierania produktów.");
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]") ;
    cart.push(product);

    localStorage.setItem("cart", JSON.stringify(cart))
    window.dispatchEvent(new Event("storage"));
  };

  // Filtrowanie produktów względem zapytania
  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(query.toLowerCase())) ||
    (product.brand && product.brand.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="homepage-container">
    <h1 className="searchpage-title">
        Wyniki dla: <span style={{ color: "black" }}>{query}</span>
    </h1>
    {message && <div className="admin-message">{message}</div>}
    <div className="products-list">
        {filtered.length === 0 ? (
        <p>Brak produktów pasujących do wyszukiwania.</p>
        ) : (
        filtered.map(product => (
            <div key={product._id} className="product-card-wrapper">
            <ProductCard product={product} />
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
  );
}