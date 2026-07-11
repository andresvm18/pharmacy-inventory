import { useState, useEffect } from 'react';
import { productService } from '../services/productService';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = filter === 'low-stock'
    ? products.filter(p => p.stockAvailable < p.minStock)
    : products;

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Products</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Products
          </button>
          <button
            onClick={() => setFilter('low-stock')}
            className={`px-4 py-2 rounded-lg ${filter === 'low-stock' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Low Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.sku}</p>
              </div>
              {product.stockAvailable < product.minStock && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  LOW STOCK
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3">{product.description}</p>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{product.categoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supplier:</span>
                <span className="font-medium">{product.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">₡{product.unitPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock:</span>
                <span className={`font-medium ${product.stockAvailable < product.minStock ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stockAvailable} (Min: {product.minStock})
                </span>
              </div>
              {product.stockExpired > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expired:</span>
                  <span className="font-medium text-red-600">{product.stockExpired}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {product.requiresRx && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex-1 text-center">
                  ⚕️ Requires Rx
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No products found
        </div>
      )}
    </div>
  );
}