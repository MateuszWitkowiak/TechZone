import axios from "axios"
import { useState } from "react"
import { useKeycloak } from "@react-keycloak/web";
import ProductCard from "../components/Product/Product";
import "./AdminPanel.css";

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
    const { keycloak } = useKeycloak();

    if (!keycloak.hasRealmRole('admin')) {
        window.location.replace("/")
    }
    // --- Token refresh helper ---
    // Funkcja, która automatycznie odświeży token jeśli potrzeba
    const getValidToken = async () => {
        if (keycloak.token && keycloak.isTokenExpired && keycloak.isTokenExpired()) {
            try {
                await keycloak.updateToken(10); // odśwież jeśli mniej niż 10s ważności
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
                "http://localhost:3001/api/order/getAll",
                await axiosConfig()
            );
            setOrders(response.data);
            setView("orders");
        } catch (err) {
            setMessage("Błąd podczas pobierania zamówień.");
        }
    };

    const fetchProducts = async () => {
        setMessage("");
        try {
            const response = await axios.get(
                "http://localhost:3001/api/products/getAll",
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
                `http://localhost:3001/api/products/delete/${id}`,
                await axiosConfig()
            );
            setMessage("Produkt usunięty!");
            fetchProducts();
        } catch (err) {
            setMessage("Błąd podczas usuwania produktu.");
        }
    };

    // Ustawia produkt do edycji i przełącza formularz w tryb edycji
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
                    `http://localhost:3001/api/products/update/${editingProduct._id}`,
                    payload,
                    await axiosConfig()
                );
                setMessage("Produkt zaktualizowany!");
            } else {
                // Dodanie nowego produktu
                await axios.post(
                    "http://localhost:3001/api/products/addProduct",
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
                <div className="admin-orders">
                    <h2>Zamówienia</h2>
                    {orders.length === 0 ? (
                        <p>Brak zamówień.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>User ID</th>
                                    <th>Produkty</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id}>
                                        <td>{order._id}</td>
                                        <td>{order.userId}</td>
                                        <td>
                                            {order.products && order.products.map((p, idx) =>
                                                <div key={idx}>{p.productId} x {p.quantity}</div>
                                            )}
                                        </td>
                                        <td>{order.status}</td>
                                        <td>{(new Date(order.createdAt)).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {view === "products" && (
                <div className="admin-products">
                    <h2>
                        Produkty
                    </h2>
                    <div className="product-list">
                        {products.length === 0 ? (
                            <p>Brak produktów.</p>
                        ) : (
                            products.map(product => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onDelete={deleteProduct}
                                    onEdit={handleEditProduct}
                                    onClick={() => {/* tu np. możesz zrobić nawigację do szczegółów */}}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {(view === "addProduct" || view === "editProduct") && (
                <div className="admin-add-product">
                    <h2>{editingProduct ? "Edytuj produkt" : "Dodaj nowy produkt"}</h2>
                    <form onSubmit={handleProductFormSubmit}>
                        <input type="text" name="name" placeholder="Nazwa" value={productForm.name} onChange={handleProductFormChange} required />
                        <input type="text" name="brand" placeholder="Marka" value={productForm.brand} onChange={handleProductFormChange} required />
                        <input type="text" name="category" placeholder="Kategoria" value={productForm.category} onChange={handleProductFormChange} required />
                        <input type="number" name="price" placeholder="Cena" value={productForm.price} onChange={handleProductFormChange} required />
                        <input type="number" name="stock" placeholder="Stan magazynowy" value={productForm.stock} onChange={handleProductFormChange} required />
                        <input type="text" name="images" placeholder="Adresy zdjęć (oddzielone przecinkami)" value={productForm.images} onChange={handleProductFormChange} />
                        <textarea name="description" placeholder="Opis" value={productForm.description} onChange={handleProductFormChange} required />
                        <label>
                            Aktywny:
                            <input type="checkbox" name="isActive" checked={productForm.isActive} onChange={handleProductFormChange} />
                        </label>
                        <button type="submit">{editingProduct ? "Zapisz zmiany" : "Dodaj produkt"}</button>
                        {editingProduct && (
                            <button className="cancel-button" type="button" onClick={handleCancelEdit} style={{marginLeft: 8}}>
                                Anuluj
                            </button>
                        )}
                    </form>
                </div>
            )}
        </div>
    )
}

export default AdminPanel;