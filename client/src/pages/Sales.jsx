import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        setMessage('Error loading products');
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { productId: product.id, quantity: 1, product }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMessage('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const response = await salesService.create(items);
      setMessage(`Sale #${response.id} created successfully!`);
      setCart([]);

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating sale');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.product.unitPrice * item.quantity), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Create Sale</h1>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Available Products</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stockAvailable} | ₡{product.unitPrice}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stockAvailable === 0}
                    className="btn-primary disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="card h-fit">
          <h2 className="text-2xl font-bold mb-4">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-600">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.productId} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="bg-gray-200 px-2 py-1 rounded"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                          className="w-12 text-center border rounded"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="bg-gray-200 px-2 py-1 rounded"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm font-medium mt-1">
                      ₡{(item.product.unitPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <p className="text-2xl font-bold mb-4">
                  Total: ₡{total.toLocaleString()}
                </p>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}