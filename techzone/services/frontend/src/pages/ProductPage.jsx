import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useKeycloak } from "@react-keycloak/web";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProductPage() {
  const { keycloak } = useKeycloak();
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    axios.get(`${API_URL}/api/products/getProduct/${productId}`)
      .then(res => {
        if (!res.data || !res.data._id) {
          setNotFound(true);
          setProduct(null);
        } else {
          setProduct(res.data);
          setNotFound(false);
        }
      })
      .catch(() => {
        setNotFound(true);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div style={{ padding: 32 }}>Ładowanie...</div>;
  if (notFound) return <div style={{ padding: 32, color: "red" }}>Nie znaleziono produktu.</div>;

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
    <div style={{
      maxWidth: 1000,
      margin: "0 auto",
      padding: 32,
      display: "flex",
      gap: 40,
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ flex: "1 1 50%", textAlign: "center" }}>
        <h1 style={{ marginBottom: 20, color: "#2c3e50" }}>{product.name}</h1>
        {product.images?.length ? (
          <img
            src={product.images[0]}
            alt={product.name}
            style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8 }}
          />
        ) : (
          <div style={{
            background: "#eee",
            width: "100%",
            height: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            color: "#888"
          }}>
            Brak zdjęcia
          </div>
        )}
      </div>

      <div style={{
        flex: "1 1 50%",
        backgroundColor: "#f9f9f9",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: "bold", color: "#34495e" }}>Marka:</span>{" "}
          <span style={{ color: "#2c3e50" }}>{product.brand}</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: "bold", color: "#34495e" }}>Cena:</span>{" "}
          <span style={{ color: "#27ae60", fontSize: 18 }}>{product.price} zł</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: "bold", color: "#34495e" }}>Opis:</span>{" "}
          <span style={{ color: "#2c3e50" }}>{product.description}</span>
        </div>

        <div>
          <span style={{ fontWeight: "bold", color: "#34495e" }}>Stan magazynowy:</span>{" "}
          <span style={{ color: product.stock > 0 ? "#2980b9" : "#c0392b", display: "flex", flexDirection: "column", alignContent: "center", justifyContent: "center", alignItems: "center" }}>
            {product.stock > 0 ? product.stock : "Brak w magazynie"} <br></br>
            {!product.isActive && <div style={{color: "red"}}>Produkt obecnie niedostępny</div> }
            {product.stock > 0 && product.isActive && !keycloak.hasRealmRole("admin") && (
              <button
                  onClick={() => addToCart(product)}
                  className="add-to-cart-btn"
                  style={{width: "50%"}}
                >
                  Dodaj do koszyka
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
