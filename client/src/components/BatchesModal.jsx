import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { batchService } from '../services/batchService';
import { useModalA11y } from '../hooks/useModalA11y';

const emptyReceiveForm = { lotNumber: '', expiryDate: '', quantity: '', costPrice: '' };

export default function BatchesModal({ product, onClose, onChanged }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [receiveForm, setReceiveForm] = useState(emptyReceiveForm);
  const [receiving, setReceiving] = useState(false);

  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchBatches = async () => {
    try {
      const data = await batchService.getByProduct(product.id);
      setBatches(data);
    } catch {
      toast.error('Error loading batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateReceiveForm = (field, value) => setReceiveForm((f) => ({ ...f, [field]: value }));

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();

    if (!receiveForm.lotNumber.trim()) {
      toast.error('Lot number is required');
      return;
    }
    if (!receiveForm.expiryDate) {
      toast.error('Expiry date is required');
      return;
    }
    if (Number(receiveForm.quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (Number(receiveForm.costPrice) <= 0) {
      toast.error('Cost price must be greater than 0');
      return;
    }

    setReceiving(true);
    try {
      await batchService.create({
        productId: product.id,
        lotNumber: receiveForm.lotNumber.trim(),
        expiryDate: receiveForm.expiryDate,
        quantity: Number(receiveForm.quantity),
        costPrice: Number(receiveForm.costPrice),
      });
      toast.success('Batch received');
      setReceiveForm(emptyReceiveForm);
      setShowReceiveForm(false);
      fetchBatches();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error receiving batch');
    } finally {
      setReceiving(false);
    }
  };

  const startAdjust = (batch) => {
    setAdjustingId(batch.id);
    setAdjustQty('');
    setAdjustReason('');
  };

  const handleAdjustSubmit = async (batchId) => {
    const qty = Number(adjustQty);
    if (!qty) {
      toast.error('Enter a non-zero quantity (positive to add, negative to remove)');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Reason is required');
      return;
    }

    setAdjusting(true);
    try {
      await batchService.adjustStock(batchId, { quantity: qty, reason: adjustReason.trim() });
      toast.success('Stock adjusted');
      setAdjustingId(null);
      fetchBatches();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adjusting stock');
    } finally {
      setAdjusting(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div
      className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="batches-modal-title"
        className="bg-white rounded-lg border border-stone-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-stone-900" id="batches-modal-title">
              Batches
            </h2>
            <p className="text-sm text-stone-500">{product.name}</p>
          </div>
          <button
            onClick={() => setShowReceiveForm(!showReceiveForm)}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Receive stock
          </button>
        </div>

        {showReceiveForm && (
          <form onSubmit={handleReceiveSubmit} className="p-6 border-b border-stone-200 bg-stone-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                  Lot number
                </label>
                <input
                  type="text"
                  value={receiveForm.lotNumber}
                  onChange={(e) => updateReceiveForm('lotNumber', e.target.value)}
                  className="input-field data-num"
                  placeholder="ANL-2712A"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                  Expiry date
                </label>
                <input
                  type="date"
                  value={receiveForm.expiryDate}
                  onChange={(e) => updateReceiveForm('expiryDate', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={receiveForm.quantity}
                  onChange={(e) => updateReceiveForm('quantity', e.target.value)}
                  className="input-field data-num"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                  Cost price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={receiveForm.costPrice}
                  onChange={(e) => updateReceiveForm('costPrice', e.target.value)}
                  className="input-field data-num"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowReceiveForm(false)}
                className="btn-secondary flex-1 py-2"
              >
                Cancel
              </button>
              <button type="submit" disabled={receiving} className="btn-primary flex-1 py-2 disabled:opacity-50">
                {receiving ? 'Saving...' : 'Receive batch'}
              </button>
            </div>
          </form>
        )}

        <div className="p-6">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-stone-100 rounded-md" />)}
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-8">No batches recorded for this product</p>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
                <div key={batch.id} className="border border-stone-200 rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded data-num">
                        {batch.lotNumber}
                      </span>
                      <span className="text-sm text-stone-900 font-medium data-num">
                        {batch.quantity} units
                      </span>
                      <span className="text-xs text-stone-500 data-num">
                        ₡{batch.costPrice.toLocaleString()} cost
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {batch.isExpired ? (
                        <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-medium">
                          Expired {formatDate(batch.expiryDate)}
                        </span>
                      ) : batch.daysUntilExpiry <= 30 ? (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium data-num">
                          {batch.daysUntilExpiry}d left
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 data-num">
                          exp. {formatDate(batch.expiryDate)}
                        </span>
                      )}
                      <button
                        onClick={() => startAdjust(batch)}
                        className="text-stone-400 hover:text-clinical-700 transition"
                        aria-label={`Adjust stock for ${batch.lotNumber}`}
                      >
                        <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {adjustingId === batch.id && (
                    <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1">
                          Quantity (+/-)
                        </label>
                        <input
                          type="number"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          className="input-field data-num w-28"
                          placeholder="-5"
                        />
                      </div>
                      <div className="flex-1 min-w-[10rem]">
                        <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-1">
                          Reason
                        </label>
                        <input
                          type="text"
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className="input-field"
                          placeholder="Damaged in transit"
                        />
                      </div>
                      <button
                        onClick={() => setAdjustingId(null)}
                        className="btn-secondary py-2 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAdjustSubmit(batch.id)}
                        disabled={adjusting}
                        className="btn-primary py-2 text-sm disabled:opacity-50"
                      >
                        {adjusting ? 'Saving...' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}