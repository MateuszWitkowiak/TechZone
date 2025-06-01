import "./Product.css";

function ProductCard({ product, onDelete, onEdit }) {

    const onClick = () => {
        window.location.replace(`/product/${product._id}`)
    }
    return (
        <div className="product-card" onClick={onClick}>
            <div className="product-card-image">
                {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} />
                ) : (
                    <div className="product-card-placeholder">Brak zdjęcia</div>
                )}
            </div>
            <div className="product-card-content">
                <h3>{product.name}</h3>
                <p className="product-card-brand">{product.brand}</p>
                <p className="product-card-price">{product.price} zł</p>
                <p className={`product-card-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                    {product.stock > 0 ? `W magazynie: ${product.stock}` : "Brak w magazynie"}
                </p>
                {onEdit && onDelete && (
                    <div className="product-card-actions">
                        <button
                            className="product-card-delete"
                            onClick={e => {
                                e.stopPropagation();
                                onDelete(product._id);
                            }}
                        >
                            Usuń
                        </button>
                        <button className="product-card-edit" onClick={e => {
                            e.stopPropagation();
                            onEdit(product);
                        }}>
                            Edytuj
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductCard;