import axios from "axios"
import { useState } from "react"
import { useKeycloak } from "@react-keycloak/web";
import ProductCard from "../components/Product/Product";
import "./AdminPanel.css";

const API_URL = import.meta.env.VITE_API_URL;

function AdminPanel() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [view, setView] = useState("");
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: "",
        description: "",
        price: "",
        category: "laptops",
        brand: "",
        images: "",
        stock: 0,
        isActive: true
    });
    const [message, setMessage] = useState("");
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [orderStatusUpdates, setOrderStatusUpdates] = useState({});
    const { keycloak } = useKeycloak();

    const [orderStatusFilter, setOrderStatusFilter] = useState("");
    const [orderSearch, setOrderSearch] = useState("");
    const [productCategoryFilter, setProductCategoryFilter] = useState("");
    const [productBrandFilter, setProductBrandFilter] = useState("");
    const [productActiveFilter, setProductActiveFilter] = useState("");
    const [productSearch, setProductSearch] = useState("");

    if (!keycloak.hasRealmRole('admin')) {
        window.location.replace("/")
    }

    const getValidToken = async () => {
        if (keycloak.token && keycloak.isTokenExpired && keycloak.isTokenExpired()) {
            try {
                await keycloak.updateToken(10);
            } catch (e) {
                setMessage("Sesja wygasła, zaloguj się ponownie.");
            }
        }
        return keycloak.token;
    };

    const axiosConfig = async () => ({
        headers: {
            Authorization: `Bearer ${await getValidToken()}`
        }
    });

    const fetchOrders = async () => {
        setMessage("");
        try {
            const response = await axios.get(
                `${API_URL}/api/order/getAll`,
                await axiosConfig()
            );
            setOrders(response.data);
            setView("orders");
        } catch (err) {
            setMessage("Błąd podczas pobierania zamówień.");
        }
    };

    const deleteOrder = async (orderId) => {
        try {
            const response = await axios.delete(`${API_URL}/api/order/delete/${orderId}`, await axiosConfig())
            setMessage("Zamówienie usunięte!")
            setOrders(prev => prev.filter(order => order._id != orderId))
        } catch (err) {
            setMessage("Błąd podczas usuwania zamówienia.");
        }
    }

    const fetchProducts = async () => {
        setMessage("");
        try {
            const response = await axios.get(
                `${API_URL}/api/products/getAll`,
                await axiosConfig()
            );
            setProducts(response.data);
            setView("products");
        } catch (err) {
            setMessage("Błąd podczas pobierania produktów.");
        }
    };

    const deleteProduct = async (id) => {
        try {
            await axios.delete(
                `${API_URL}/api/products/delete/${id}`,
                await axiosConfig()
            );
            setMessage("Produkt usunięty!");
            fetchProducts();
        } catch (err) {
            setMessage("Błąd podczas usuwania produktu.");
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || "",
            description: product.description || "",
            price: product.price || "",
            category: product.category || "",
            brand: product.brand || "",
            images: (product.images || []).join(", "),
            stock: product.stock || 0,
            isActive: typeof product.isActive === "boolean" ? product.isActive : true
        });
        setView("editProduct");
    };

    const handleProductFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProductForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }))
    };

    const handleProductFormSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            const images = productForm.images
                ? productForm.images.split(",").map(img => img.trim())
                : [];
            const payload = {
                ...productForm,
                price: Number(productForm.price),
                stock: Number(productForm.stock),
                images
            };

            if (editingProduct) {
                await axios.put(
                    `${API_URL}/api/products/update/${editingProduct._id}`,
                    payload,
                    await axiosConfig()
                );
                setMessage("Produkt zaktualizowany!");
            } else {
                await axios.post(
                    `${API_URL}/api/products/addProduct`,
                    payload,
                    await axiosConfig()
                );
                setMessage("Produkt dodany pomyślnie!");
            }
            setView("products");
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            setMessage("Błąd podczas zapisywania produktu.");
        }
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
        setView("products");
        setProductForm({
            name: "",
            description: "",
            price: "",
            category: "laptops",
            brand: "",
            images: "",
            stock: 0,
            isActive: true
        });
    };

    const orderStatusOptions = [
        "Oczekujące",
        "W realizacji",
        "Wysłane",
        "Zrealizowane",
        "Anulowane"
    ];

    const handleEditOrderStatus = (orderId, currentStatus) => {
        setEditingOrderId(orderId);
        setOrderStatusUpdates(prev => ({
            ...prev,
            [orderId]: currentStatus || orderStatusOptions[0]
        }));
    };

    const handleOrderStatusChange = (orderId, newStatus) => {
        setOrderStatusUpdates(prev => ({
            ...prev,
            [orderId]: newStatus
        }));
    };

    const handleSaveOrderStatus = async (orderId) => {
        setMessage("");
        try {
            await axios.put(
                `${API_URL}/api/order/updateStatus/${orderId}`,
                { status: orderStatusUpdates[orderId] },
                await axiosConfig()
            );
            setMessage("Status zamówienia zaktualizowany!");
            setEditingOrderId(null);
            fetchOrders();
        } catch (err) {
            setMessage("Błąd podczas aktualizacji statusu zamówienia.");
        }
    };

    const [expandedOrders, setExpandedOrders] = useState({});
    const toggleOrderDetails = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const filteredOrders = orders.filter(order => {
        const statusMatch = orderStatusFilter === "" || (order.status && order.status.toLowerCase() === orderStatusFilter.toLowerCase());
        const searchMatch =
            orderSearch.trim() === "" ||
            (order._id && order._id.toLowerCase().includes(orderSearch.toLowerCase())) ||
            (order.userEmail && order.userEmail.toLowerCase().includes(orderSearch.toLowerCase())) ||
            (order.userName && order.userName.toLowerCase().includes(orderSearch.toLowerCase()));
        return statusMatch && searchMatch;
    });

    const filteredProducts = products.filter(product => {
        const categoryMatch = !productCategoryFilter || product.category === productCategoryFilter;
        const brandMatch = !productBrandFilter || product.brand.toLowerCase() === productBrandFilter.toLowerCase();
        const activeMatch = !productActiveFilter || (productActiveFilter === "active" ? product.isActive : !product.isActive);
        const searchMatch =
            productSearch.trim() === "" ||
            product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            product.description.toLowerCase().includes(productSearch.toLowerCase()) ||
            product.brand.toLowerCase().includes(productSearch.toLowerCase());
        return categoryMatch && brandMatch && activeMatch && searchMatch;
    });

    const allCategories = Array.from(new Set(products.map(p => p.category)));
    const allBrands = Array.from(new Set(products.map(p => p.brand)));

    return (
        <div className="admin-panel">
            <div className="admin-categories">
                <button onClick={fetchOrders}>Zamówienia użytkowników</button>
                <button onClick={fetchProducts}>Produkty</button>
                <button onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                        name: "",
                        description: "",
                        price: "",
                        category: "laptops",
                        brand: "",
                        images: "",
                        stock: 0,
                        isActive: true
                    });
                    setView("addProduct");
                }}>
                    Dodaj nowy produkt
                </button>
            </div>

            {message && <div className="admin-message">{message}</div>}

            {view === "orders" && (
                <div className="admin-orders" style={{color: "black"}}>
                    <h2>Zamówienia</h2>
                    <div style={{display: "flex", alignItems: "center", gap: 16, marginBottom: 14}}>
                        <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                            <option value="">Wszystkie statusy</option>
                            {orderStatusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Szukaj po ID, mailu lub nazwie klienta..."
                            value={orderSearch}
                            onChange={e => setOrderSearch(e.target.value)}
                            style={{padding: 4, minWidth: 230}}
                        />
                        <button onClick={() => { setOrderStatusFilter(""); setOrderSearch(""); }}>Wyczyść filtry</button>
                    </div>
                    {filteredOrders.length === 0 ? (
                        <p>Brak zamówień.</p>
                    ) : (
                        <div className="admin-orders-list" >
                            {filteredOrders.map(order => (
                                <div className={`order-card ${expandedOrders[order._id] ? "expanded" : ""}`} key={order._id}>
                                    <div className="order-summary-row" onClick={() => toggleOrderDetails(order._id)}>
                                        <div className="order-summary-col" title={order._id}>
                                            <span className="order-label">ID:</span> <span className="order-value">{order._id.slice(-6)}</span>
                                        </div>
                                        <div className="order-summary-col">
                                            <span className="order-label">Klient:</span>{" "}
                                            <span className="order-value">
                                                {order.userEmail || order.userName || "-"}
                                            </span>
                                        </div>
                                        <div className="order-summary-col">
                                            <span className="order-label">Suma:</span>{" "}
                                            <span className="order-value">{order.total?.toFixed(2) || "-"} zł</span>
                                        </div>
                                        <div className="order-summary-col">
                                            <span className={`order-status status-${(order.status || '').toLowerCase().replace(/\s/g, "-")}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="order-summary-col">
                                            <span className="order-date">
                                                {new Date(order.createdAt).toLocaleDateString()}<br/>
                                                <span style={{fontSize:12, color:"#888"}}>
                                                    {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="order-summary-col" style={{minWidth: 50}}>
                                            <button
                                                className="order-details-btn"
                                                aria-label="Szczegóły zamówienia"
                                            >
                                                {expandedOrders[order._id] ? "▲" : "▼"}
                                            </button>
                                        </div>
                                    </div>
                                    {expandedOrders[order._id] && (
                                        <div className="order-details">
                                            <div style={{marginBottom: 6}}>
                                                <b>Produkty:</b>
                                                <ul>
                                                    {order.products && order.products.map((p, idx) => (
                                                        <li key={idx}>
                                                            {(p.productId?.name || p.productId)} <span style={{fontWeight:600}}>x {p.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <b>Data utworzenia:</b> {new Date(order.createdAt).toLocaleString()}<br/>
                                            </div>
                                            <div style={{marginTop: 12}}>
                                                <b>Status zamówienia:</b>
                                                {editingOrderId === order._id ? (
                                                    <span style={{marginLeft: 10, display: "inline-flex", gap: 8, alignItems: "center"}}>
                                                        <select
                                                            value={orderStatusUpdates[order._id]}
                                                            onChange={e =>
                                                                handleOrderStatusChange(order._id, e.target.value)
                                                            }
                                                        >
                                                            {orderStatusOptions.map(status => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            className="save-btn"
                                                            onClick={() => handleSaveOrderStatus(order._id)}
                                                        >
                                                            Zapisz
                                                        </button>
                                                        <button
                                                            className="cancel-btn"
                                                            onClick={() => setEditingOrderId(null)}
                                                        >
                                                            Anuluj
                                                        </button>
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="edit-btn"
                                                        style={{marginLeft: 16}}
                                                        onClick={() => handleEditOrderStatus(order._id, order.status)}
                                                    >
                                                        Edytuj status
                                                    </button>
                                                )}
                                            </div>
                                            <button onClick={() => deleteOrder(order._id)} style={{color: "white", backgroundColor: "red", marginTop: "15px"}}>
                                                Usuń
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === "products" && (
                <div className="admin-products">
                    <div style={{color: "black", fontSize: "25px"}}><b>Produkty:</b></div>
                    <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap"}}>
                        <select value={productCategoryFilter} onChange={e => setProductCategoryFilter(e.target.value)}>
                            <option value="">Wszystkie kategorie</option>
                            {allCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select value={productBrandFilter} onChange={e => setProductBrandFilter(e.target.value)}>
                            <option value="">Wszystkie marki</option>
                            {allBrands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                        <select value={productActiveFilter} onChange={e => setProductActiveFilter(e.target.value)}>
                            <option value="">Aktywne i nieaktywne</option>
                            <option value="active">Tylko aktywne</option>
                            <option value="inactive">Tylko nieaktywne</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Szukaj po nazwie, opisie, marce..."
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            style={{padding: 4, minWidth: 230}}
                        />
                        <button onClick={() => { setProductCategoryFilter(""); setProductBrandFilter(""); setProductActiveFilter(""); setProductSearch(""); }}>Wyczyść filtry</button>
                    </div>
                    <div className="product-list">
                        {filteredProducts.length === 0 ? (
                            <p>Brak produktów.</p>
                        ) : (
                            filteredProducts.map(product => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onDelete={deleteProduct}
                                    onEdit={handleEditProduct}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {(view === "addProduct" || view === "editProduct") && (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh"
                }}>
                    <div className="admin-add-product" style={{
                        width: "100%",
                        maxWidth: 420,
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 2px 8px 0 #e7eaee60",
                        padding: "32px 28px",
                        margin: "0 auto"
                    }}>
                        <h2 style={{ textAlign: "center" }}>
                            {editingProduct ? "Edytuj produkt" : "Dodaj nowy produkt"}
                        </h2>
                        <form onSubmit={handleProductFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                            <input type="text" name="name" placeholder="Nazwa" value={productForm.name} onChange={handleProductFormChange} required style={{ color: "#000" }} />
                            <input type="text" name="brand" placeholder="Marka" value={productForm.brand} onChange={handleProductFormChange} required style={{ color: "#000" }} />
                            <input type="text" name="category" placeholder="Kategoria" value={productForm.category} onChange={handleProductFormChange} required style={{ color: "#000" }} />
                            <input type="number" name="price" placeholder="Cena" value={productForm.price} onChange={handleProductFormChange} required style={{ color: "#000" }} />
                            <input type="number" name="stock" placeholder="Stan magazynowy" value={productForm.stock} onChange={handleProductFormChange} required style={{ color: "#000" }} />
                            <input type="text" name="images" placeholder="Adresy zdjęć (oddzielone przecinkami)" value={productForm.images} onChange={handleProductFormChange} style={{ color: "#000" }} />
                            <textarea name="description" placeholder="Opis" value={productForm.description} onChange={handleProductFormChange} required style={{ color: "#000" }} />
                            <label style={{ color: "#000" }}>
                                Aktywny:
                                <input type="checkbox" name="isActive" checked={productForm.isActive} onChange={handleProductFormChange} style={{ marginLeft: 8 }} />
                            </label>
                            <button type="submit">{editingProduct ? "Zapisz zmiany" : "Dodaj produkt"}</button>
                            {editingProduct && (
                                <button className="cancel-button" type="button" onClick={handleCancelEdit} style={{ marginLeft: 8 }}>
                                    Anuluj
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminPanel;