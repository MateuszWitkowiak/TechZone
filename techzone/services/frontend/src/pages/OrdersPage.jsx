import { useEffect, useState } from "react";
import axios from "axios";
import { useKeycloak } from "@react-keycloak/web";

const API_URL = import.meta.env.VITE_API_URL;

export default function OrdersPage() {
  const { keycloak } = useKeycloak();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!keycloak.authenticated) return;
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${API_URL}/api/order/getUserOrders`,
          {
            headers: {
              Authorization: `Bearer ${keycloak.token}`,
            },
          }
        );
        setOrders(response.data);
      } catch {
        setError("Nie udało się pobrać zamówień. Spróbuj ponownie później.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [keycloak]);

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
      case "oczekujące":
        return { background: "#f59e42", color: "#fff" };
      case "w realizacji":
        return { background: "#1e88e5", color: "#fff" };
      case "wysłane":
        return { background: "#1976d2", color: "#fff" };
      case "zrealizowane":
        return { background: "#43a047", color: "#fff" };
      case "anulowane":
        return { background: "#c62828", color: "#fff" };
      default:
        return { background: "#7c8392", color: "#fff" };
    }
  };

  return (
    <div style={{ minHeight: "80vh", background: "#f6f8fa" }}>
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "40px 16px"
      }}>
        <h1 style={{
          textAlign: "center",
          marginBottom: 30,
          color: "#1e293b",
          fontWeight: 700,
          fontSize: 32,
          letterSpacing: "-1px"
        }}>
          Twoje zamówienia
        </h1>

        {loading ? (
          <div style={{
            textAlign: "center",
            fontSize: 20,
            color: "#1e293b",
            marginTop: 40
          }}>
            Ładuję zamówienia...
          </div>
        ) : error ? (
          <div style={{
            textAlign: "center",
            color: "#c62828",
            fontWeight: 500,
            marginTop: 40
          }}>
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            fontSize: 18,
            color: "#7c8392",
            marginTop: 40,
            boxShadow: "0 2px 8px 0 #e7eaee60"
          }}>
            Nie masz jeszcze żadnych zamówień.
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 24
          }}>
            {orders.map(order => (
              <div key={order._id}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px 0 #e7eaee60",
                  padding: "24px 28px",
                  borderLeft: "6px solid #1e88e5"
                }}
              >
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8
                }}>
                  <div style={{ fontWeight: 600, fontSize: 18, color: "#1e293b" }}>
                    Zamówienie <span style={{ color: "#1e88e5" }}>#{order._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div style={{
                    fontSize: 15,
                    color: "#7c8392"
                  }}>
                    {new Date(order.createdAt).toLocaleDateString()} &nbsp;
                    <span style={{ fontSize: 13, color: "#b0b8c9" }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{
                    fontWeight: 500,
                    fontSize: 15,
                    borderRadius: 7,
                    padding: "5px 14px",
                    marginLeft: 12,
                    ...getStatusColor(order.status)
                  }}>
                    {order.status || "Oczekujące"}
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 30,
                  margin: "18px 0 10px 0"
                }}>
                  <div>
                    <span style={{ color: "#476582", fontWeight: 500 }}>Produkty:</span>
                    <ul style={{ margin: "8px 0 0 16px", color: "#222", fontSize: 16, padding: 0, listStyle: "disc" }}>
                      {order.products.map((p, idx) => (
                        <li key={idx} style={{ color: "#222" }}>
                          <span style={{ color: "#222", fontWeight: 500 }}>{p.productId.name || p.productId}</span> <b style={{ color: "#1e88e5" }}>x{p.quantity}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span style={{ color: "#476582", fontWeight: 500 }}>Suma:</span>
                    <div style={{ fontWeight: 700, fontSize: 18, marginTop: 5, color: "#1e293b" }}>
                      {order.total ? order.total.toFixed(2) : "-"} zł
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}