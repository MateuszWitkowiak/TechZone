import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/Product/Product";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  // Automatycznie pobieraj e-mail z tokena Keycloak
  const email = keycloak.tokenParsed?.email || "";

  useEffect(() => {
    if (!keycloak.authenticated) {
      navigate('/');
      return;
    }
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const productMap = new Map();
    cart.forEach(product => {
      if (productMap.has(product._id)) {
        productMap.get(product._id).quantity += 1;
      } else {
        productMap.set(product._id, { ...product, quantity: 1 });
      }
    });
    setCartItems(Array.from(productMap.values()));
  }, [keycloak, navigate]);

  const updateLocalStorage = (updatedItems) => {
    const flatItems = updatedItems.flatMap(item =>
      Array(item.quantity).fill({ ...item, quantity: undefined })
    );
    localStorage.setItem("cart", JSON.stringify(flatItems));
    setCartItems(updatedItems);
    window.dispatchEvent(new Event("storage"));
  };

  const increaseQuantity = (id) => {
    const updatedItems = cartItems.map(item => {
      if (item._id === id) {
        if (item.quantity < item.stock) {
          return { ...item, quantity: item.quantity + 1 };
        }
      }
      return item;
    });
    updateLocalStorage(updatedItems);
  };

  const decreaseQuantity = (id) => {
    const updatedItems = cartItems
      .map(item => {
        if (item._id === id) {
          const newQty = item.quantity - 1;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);
    updateLocalStorage(updatedItems);
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleOrder = async () => {
    if (!email || cartItems.length === 0) return;
    try {
      await axios.post(
        "http://localhost:3001/api/order/addOrder",
        {
          products: cartItems.map(item => ({
            productId: item._id,
            quantity: item.quantity,
          })),
          total,
        },
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          }
        }
      );
      setOrderPlaced(true);
      localStorage.setItem("cart", "[]");
      setCartItems([]);
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      alert("Nie udało się złożyć zamówienia. Spróbuj ponownie!");
    }
  };

  return (
    <div style={{ minHeight: "80vh", background: "#f6f8fa" }}>
      <h1 style={{ marginBottom: "32px", paddingTop: 32, textAlign: "center", color: "black" }}>Koszyk</h1>
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "40px",
        alignItems: "flex-start",
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 16px 48px 16px"
      }}>
        {/* Produkty po lewej */}
        <div style={{ flex: 2, maxWidth: 600 }}>
          {cartItems.length === 0 ? (
            <div style={{
              background: "#fff",
              borderRadius: 8,
              padding: 32,
              textAlign: "center",
              fontSize: 18,
              color: "#888"
            }}>
              Twój koszyk jest pusty.
            </div>
          ) : (
            <div className="cart-list">
              {cartItems.map(item => (
                <div
                  key={item._id}
                  className="cart-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    padding: "0.7rem 1.1rem",
                    border: "1px solid #e3e8ee",
                    borderRadius: "8px",
                    background: "#fff",
                    boxShadow: "0 2px 6px 0 #e7eaee40"
                  }}
                >
                  <div style={{ flex: 2, minWidth: 220, maxWidth: 260 }}>
                    <ProductCard product={item} />
                  </div>
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontSize: 16,
                    alignItems: "flex-start",
                    justifyContent: "center"
                  }}>
                    <div style={{ color: "black" }}>
                      <strong>Ilość:</strong>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <button
                          onClick={() => decreaseQuantity(item._id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            border: "1px solid #ccc",
                            background: "#f1f3f5",
                            cursor: "pointer",
                            fontSize: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            lineHeight: 1,
                            color: "black"
                          }}
                        >−</button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item._id)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            border: "1px solid #ccc",
                            background: "#f1f3f5",
                            cursor: "pointer",
                            fontSize: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            lineHeight: 1,
                            color: "black"
                          }}
                        >+</button>
                      </div>
                    </div>
                    <div style={{ color: "black" }}>
                      <strong>Łącznie:</strong> {(item.price * item.quantity).toFixed(2)} zł
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Podsumowanie po prawej */}
        <div style={{
          flex: 1,
          minWidth: 270,
          maxWidth: 340,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px 0 #e7eaee60",
          color: "black",
          padding: "32px 28px",
          position: "sticky",
          top: 40,
          alignSelf: "flex-start"
        }}>
          <h2 style={{ marginBottom: 18, fontWeight: 600, fontSize: 22 }}>Podsumowanie</h2>
          <div style={{ marginBottom: 16, fontSize: 17 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Produkty:</span>
              <span>{cartItems.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 500 }}>
              <span>Suma do zapłaty:</span>
              <span>{total.toFixed(2)} zł</span>
            </div>
          </div>
          <hr style={{ margin: "16px 0 22px 0", border: 0, borderTop: "1px solid #ececec" }} />
          {/* Automatycznie pokazuj maila z Keycloaka */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 5,
              display: "block"
            }}>
              Email do powiadomień:
            </label>
            <div
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 6,
                border: "1px solid #d3dae6",
                fontSize: 15,
                background: "#f7f9fd",
                color: "#222"
              }}
            >
              {email || <span style={{ color: "red" }}>Brak adresu e-mail w profilu</span>}
            </div>
          </div>
          <button
            style={{
              width: "100%",
              padding: "12px",
              background: "#1e88e5",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 10,
              transition: "background 0.2s",
              color: "white"
            }}
            disabled={!email || cartItems.length === 0 || orderPlaced}
            onClick={handleOrder}
          >
            {orderPlaced ? "Zamówienie złożone!" : "Złóż zamówienie"}
          </button>
          {orderPlaced && (
            <div style={{
              marginTop: 10,
              color: "#43a047",
              fontWeight: 500,
              fontSize: 15
            }}>
              Zamówienie zostało złożone! Sprawdź swoją skrzynkę e-mail.
            </div>
          )}
          <div style={{
            marginTop: 22,
            color: "#7c8392",
            fontSize: 13,
            lineHeight: 1.5
          }}>
            Na podany adres e-mail będziesz otrzymywać powiadomienia o aktualizacji statusu zamówienia.
          </div>
        </div>
      </div>
    </div>
  );
}