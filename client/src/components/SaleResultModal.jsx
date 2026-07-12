import { useModalA11y } from '../hooks/useModalA11y';

export default function SaleResultModal({ sale, onClose, closeLabel = 'New sale' }) {
  if (!sale) return null;

  const containerRef = useModalA11y(onClose);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div
      className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-modal-title"
        className="bg-white rounded-lg border border-stone-200 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-stone-900" id="sale-modal-title">
              Sale #{sale.id} completed
            </h2>
            <p className="text-sm text-stone-500">
              Sold by {sale.userFullName} on {formatDate(sale.createdAt)}
            </p>
          </div>
          <span className="text-xl font-semibold text-clinical-700 data-num">
            ₡{sale.total.toLocaleString()}
          </span>
        </div>

        {/* FEFO allocation breakdown */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-stone-900">Batch allocation</h3>
            <span
              className="bg-clinical-50 text-clinical-700 text-xs px-2 py-0.5 rounded font-medium tracking-wide"
              title="First Expired, First Out: stock is deducted from the batch closest to expiration"
            >
              FEFO
            </span>
          </div>

          <div className="space-y-3">
            {sale.items.map((item) => (
              <div
                key={item.id}
                className="border border-stone-200 rounded-md p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-stone-900">{item.productName}</p>
                    <p className="text-xs text-stone-400 data-num">{item.productSku}</p>
                  </div>
                  <p className="font-medium text-sm text-stone-900 data-num">
                    ₡{item.subtotal.toLocaleString()}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between bg-stone-50 rounded-md px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded data-num">
                      {item.lotNumber}
                    </span>
                    <span className="text-stone-600 data-num text-xs">
                      {item.quantity} × ₡{item.unitPrice.toLocaleString()}
                    </span>
                  </div>
                  {item.expiryDate && (
                    <span className="text-stone-400 text-xs data-num">
                      exp. {formatDate(item.expiryDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-400 mt-4">
            Stock was automatically deducted from the earliest-expiring batches
            to minimize waste.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button onClick={onClose} className="btn-primary w-full py-2.5">
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}