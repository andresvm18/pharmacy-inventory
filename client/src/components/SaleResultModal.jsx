export default function SaleResultModal({ sale, onClose }) {
  if (!sale) return null;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-pharmacy-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Sale #{sale.id} Completed</h2>
            <p className="text-sm text-pharmacy-50 opacity-90">
              Sold by {sale.username}
            </p>
          </div>
          <span className="text-2xl font-bold">
            ₡{sale.total.toLocaleString()}
          </span>
        </div>

        {/* FEFO allocation breakdown */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-900">Batch Allocation</h3>
            <span
              className="bg-pharmacy-50 text-pharmacy-700 text-xs px-2 py-1 rounded-full font-medium"
              title="First Expired, First Out: stock is deducted from the batch closest to expiration"
            >
              FEFO
            </span>
          </div>

          <div className="space-y-3">
            {sale.items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.productSku}</p>
                  </div>
                  <p className="font-bold">
                    ₡{item.subtotal.toLocaleString()}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">
                      {item.lotNumber}
                    </span>
                    <span className="text-gray-600">
                      {item.quantity} × ₡{item.unitPrice.toLocaleString()}
                    </span>
                  </div>
                  {item.expiryDate && (
                    <span className="text-gray-500 text-xs">
                      Expires {formatDate(item.expiryDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Stock was automatically deducted from the earliest-expiring batches
            to minimize waste.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button onClick={onClose} className="btn-primary w-full">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}