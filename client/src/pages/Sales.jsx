import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import SaleResultModal from '../components/SaleResultModal';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch {
      toast.error('Error loading products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, search]);

  // Available = stock minus what's already in the cart
  const availableFor = (product) => {
    const inCart = cart.find((i) => i.productId === product.id)?.quantity ?? 0;
    return product.stockAvailable - inCart;
  };

  const addToCart = (product) => {
    if (availableFor(product) <= 0) {
      toast.warning(`No more stock available for ${product.name}`);
      return;
    }
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { productId: product.id, quantity: 1, product }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, rawValue) => {
    // Guard against NaN (empty input) — keep the item, clamp to 1
    const parsed = parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) return;

    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    if (parsed <= 0) {
      removeFromCart(productId);
      return;
    }

    const clamped = Math.min(parsed, item.product.stockAvailable);
    if (clamped < parsed) {
      toast.warning(`Only ${item.product.stockAvailable} units available`);
    }

    setCart(cart.map((i) =>
      i.productId === productId ? { ...i, quantity: clamped } : i
    ));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const sale = await salesService.create(items);
      setCompletedSale(sale);
      setCart([]);
      fetchProducts(); // Refresh stock numbers
      toast.success(`Sale #${sale.id} completed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating sale');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Create Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-2xl font-bold">Available Products</h2>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                className="input-field sm:w-64"
              />
            </div>

            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No products match "{search}"
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const available = availableFor(product);
                  return (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-mono text-xs">{product.sku}</span>
                          {' · '}Stock: {available}
                          {' · '}₡{product.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={available <= 0}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {available <= 0 ? 'Out of stock' : 'Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="card h-fit lg:sticky lg:top-6">
          <h2 className="text-2xl font-bold mb-4">
            Cart {cart.length > 0 && (
              <span className="text-base font-normal text-gray-500">
                ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            )}
          </h2>

          {cart.length === 0 ? (
            <p className="text-gray-600">
              Cart is empty. Add products to start a sale.
            </p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="bg-gray-200 hover:bg-gray-300 w-7 h-7 rounded transition"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.product.stockAvailable}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, e.target.value)}
                          className="w-14 text-center border rounded py-1"
                        />
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="bg-gray-200 hover:bg-gray-300 w-7 h-7 rounded transition"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800 text-sm transition"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm font-medium mt-1 text-right">
                      ₡{(item.product.unitPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-2xl font-bold">
                    ₡{total.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SaleResultModal
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
}