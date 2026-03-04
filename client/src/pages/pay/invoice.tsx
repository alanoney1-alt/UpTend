/**
 * Public Invoice Payment Page
 * Accessible without login — shown to customers when they receive an invoice link.
 */
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: number;
  partnerSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "void";
  paymentLink: string | null;
  notes: string;
  dueDate: string | null;
  createdAt: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Mark invoice as viewed when page loads
async function markViewed(id: number) {
  try {
    await fetch(`/api/invoices/public/${id}/view`, { method: "POST" });
  } catch (_) { /* best-effort */ }
}

export function InvoicePayPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id || "0");

  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: ["public-invoice", invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/public/${invoiceId}`);
      if (!res.ok) throw new Error("Invoice not found");
      return res.json();
    },
    enabled: !!invoiceId,
  });

  useEffect(() => {
    if (invoiceId) markViewed(invoiceId);
  }, [invoiceId]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error || !invoice) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">Invoice not found</p>
        <p className="text-gray-500 text-sm mt-1">This link may have expired or is invalid.</p>
      </div>
    </div>
  );

  const isPaid = invoice.status === "paid";
  const isVoid = invoice.status === "void";
  const dueDateStr = fmtDate(invoice.dueDate);

  // If there's a Stripe checkout URL stored as paymentLink, redirect
  const isStripeLink = invoice.paymentLink?.startsWith("https://checkout.stripe.com");

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <p className="font-bold text-gray-900 text-lg">UpTend</p>
          <p className="text-sm text-gray-500">Secure Invoice Payment</p>
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Status banner */}
          {isPaid && (
            <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-medium text-sm">This invoice has been paid. Thank you!</p>
            </div>
          )}
          {isVoid && (
            <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-medium text-sm">This invoice has been voided.</p>
            </div>
          )}

          <div className="px-6 py-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Invoice</p>
                <h1 className="text-2xl font-bold text-gray-900">#{invoice.id}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Amount Due</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(invoice.total)}</p>
                {dueDateStr && !isPaid && (
                  <p className="text-xs text-gray-500 mt-0.5">Due {dueDateStr}</p>
                )}
              </div>
            </div>

            {/* Bill to */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Bill To</p>
              <p className="font-semibold text-gray-900">{invoice.customerName}</p>
              {invoice.customerEmail && <p className="text-sm text-gray-600">{invoice.customerEmail}</p>}
              {invoice.customerPhone && <p className="text-sm text-gray-600">{invoice.customerPhone}</p>}
            </div>

            {/* Line items */}
            <div className="mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Services</p>
              <div className="space-y-0 divide-y divide-gray-100">
                {invoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.quantity} × {fmt(item.unitPrice)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 ml-4">{fmt(item.quantity * item.unitPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-4 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax ({(invoice.taxRate * 100).toFixed(1)}%)</span><span>{fmt(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                <span>Total</span><span>{fmt(invoice.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">{invoice.notes}</p>
            )}
          </div>

          {/* CTA */}
          {!isPaid && !isVoid && (
            <div className="px-6 pb-6">
              {isStripeLink ? (
                <a href={invoice.paymentLink!} className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold rounded-xl">
                    Pay {fmt(invoice.total)} Securely
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              ) : (
                <p className="text-center text-sm text-gray-500 bg-yellow-50 border border-yellow-100 rounded-xl py-3 px-4">
                  Contact your service provider to complete payment.
                </p>
              )}
              <p className="text-center text-xs text-gray-400 mt-3">
                Secured by Stripe · Your payment info is never stored by UpTend
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          UPYCK, Inc. d/b/a UpTend · 10125 Peebles St, Orlando, FL 32827
        </p>
      </div>
    </div>
  );
}

export function InvoicePaySuccessPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h1>
        <p className="text-gray-600 mb-2">Thank you for your payment on Invoice #{id}.</p>
        <p className="text-gray-500 text-sm">A receipt has been sent to your email address.</p>
        <div className="mt-8 p-4 bg-gray-100 rounded-xl">
          <p className="text-xs text-gray-500">UPYCK, Inc. d/b/a UpTend · Orlando, FL</p>
        </div>
      </div>
    </div>
  );
}

export default InvoicePayPage;
