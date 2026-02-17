/**
 * Reusable Payment Page Component
 * Used by Buyer, Farmer, and Supplier dashboards for payment flows
 * (e.g. bid acceptance, order checkout, machinery booking)
 *
 * Usage (Buyer - bid payment):
 *   import PaymentPage from '../components/PaymentPage';
 *   import { bidToPaymentItems } from '../utils/paymentService';
 *   <PaymentPage items={bidToPaymentItems(bid)} onComplete={...} onBack={...} t={t} context="bid" payerRole="BUYER" recipientName={farmerName} />
 *
 * Usage (Farmer/Supplier - order or service payment):
 *   import { orderToPaymentItems, serviceToPaymentItems } from '../utils/paymentService';
 *   <PaymentPage items={orderToPaymentItems(order)} onComplete={...} onBack={...} t={t} context="order" payerRole="FARMER" />
 */

import React, { useState } from 'react';
import { recordPayment } from '../utils/paymentService';

/**
 * @param {Object} props
 * @param {string} [props.title] - Page title
 * @param {Array<{description: string, quantity: number, unit?: string, unitPrice: number, lineTotal?: number}>} props.items - Line items
 * @param {number} [props.total] - Override total (default: sum of items' lineTotal or quantity*unitPrice)
 * @param {function} props.onComplete - Called when payment succeeds, receives { simulated: true, total }
 * @param {function} props.onBack - Called when user cancels/backs
 * @param {function} props.t - Translation function (en, hi) => string
 * @param {string} [props.context] - 'bid' | 'order' | 'service' - for display context
 * @param {string} [props.payerRole] - 'BUYER' | 'FARMER' | 'SUPPLIER'
 * @param {string} [props.recipientName] - Name of recipient (for display)
 * @param {Object} [props.recordParams] - When provided, records payment to DB (reference-only, hashed). { bidId?, orderId?, payerUserId, payerRole }
 */
const PaymentPage = ({
  title,
  items = [],
  total: totalOverride,
  onComplete,
  onBack,
  t = (en) => en,
  context = 'order',
  payerRole = 'BUYER',
  recipientName,
  recordParams
}) => {
  const [processing, setProcessing] = useState(false);

  const computedTotal = items.reduce((sum, it) => {
    const lineTotal = it.lineTotal ?? (it.quantity ?? 0) * (it.unitPrice ?? 0);
    return sum + lineTotal;
  }, 0);
  const total = totalOverride ?? computedTotal;

  const handleSimulatePayment = async () => {
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      if (recordParams?.payerUserId) {
        await recordPayment({
          bidId: recordParams.bidId,
          orderId: recordParams.orderId,
          amount: total,
          payerUserId: recordParams.payerUserId,
          payerRole: recordParams.payerRole || payerRole
        });
      }
      onComplete?.({ simulated: true, total });
    } catch (err) {
      console.error('Payment record failed:', err);
      alert(t('Failed to record payment. Please try again.', 'भुगतान रिकॉर्ड करने में विफल। पुनः प्रयास करें।'));
    } finally {
      setProcessing(false);
    }
  };

  const contextLabels = {
    bid: { en: 'Payment for Accepted Bid', hi: 'स्वीकृत बोली के लिए भुगतान' },
    order: { en: 'Order Payment', hi: 'ऑर्डर भुगतान' },
    service: { en: 'Service Payment', hi: 'सेवा भुगतान' }
  };
  const ctxLabel = contextLabels[context] || contextLabels.order;
  const displayTitle = title ?? t(ctxLabel.en, ctxLabel.hi);

  return (
    <div className="dashboard-section">
      <h3>💳 {displayTitle}</h3>
      <div className="payment-card payment-page-card">
        {items.length > 0 && (
          <div className="payment-summary">
            <p className="payment-summary-title"><strong>{t('Order Summary', 'ऑर्डर सारांश')}</strong></p>
            <ul className="payment-line-items">
              {items.map((item, idx) => {
                const lineTotal = item.lineTotal ?? (item.quantity ?? 0) * (item.unitPrice ?? 0);
                return (
                  <li key={idx} className="payment-line-item">
                    <span className="item-desc">
                      {item.description}
                      {item.quantity != null && (
                        <span className="item-qty">
                          {' '}{item.quantity} {item.unit || t('units', 'इकाइयाँ')} × ₹{(item.unitPrice ?? 0).toLocaleString()}/{item.unit || ''}
                        </span>
                      )}
                    </span>
                    <span className="item-total">₹{lineTotal.toLocaleString()}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="payment-total">
          <strong>{t('Total', 'कुल')}:</strong> ₹{total.toLocaleString()}
        </p>
        {recipientName && (
          <p className="payment-recipient" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {t('Pay to', 'भुगतान करें')}: {recipientName}
          </p>
        )}
        <hr className="payment-divider" />
        <p className="payment-disclaimer">
          {t('This is a dummy payment page. Payment integration coming soon.', 'यह एक डमी भुगतान पृष्ठ है। भुगतान एकीकरण जल्द आ रहा है।')}
        </p>
        <div className="payment-actions">
          <button
            className="btn btn-success"
            onClick={handleSimulatePayment}
            disabled={processing}
          >
            {processing ? t('Processing...', 'प्रोसेस हो रहा है...') : t('Simulate Payment', 'भुगतान सिम्युलेट करें')}
          </button>
          <button className="btn btn-secondary" onClick={onBack}>
            {t('Back', 'वापस')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
