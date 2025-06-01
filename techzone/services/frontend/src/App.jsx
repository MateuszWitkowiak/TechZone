import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './components/HomePage';
import Cart from './pages/Cart'
import AdminPanel from './pages/AdminPanel';
import OrdersPage from './pages/OrdersPage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<Cart />}/>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/orders/:user" element={<OrdersPage />} />
          <Route path="/search/:query" element={<SearchPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;