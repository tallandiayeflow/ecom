"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getOrderPubic } from '@/lib/api';
import { ArrowLeft, Loader2, Package, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const statusStyles: any = {
  pending: 'secondary',
  processing: 'warning',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'destructive',
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await getOrderPubic(id!);
      setOrder(data);
    } catch {
      toast.error('Erreur lors du chargement de la commande');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  if (!order) return <div className="text-center p-8">Commande non trouvée</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-2 w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </Button>

      <Card className="shadow-xl border dark:border-gray-700 rounded-2xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl font-bold">
              Commande #{order.id?.substring(0, 8)}
            </CardTitle>

            <Badge
              variant={statusStyles[order.status] || 'default'}
              className="px-3 py-1 text-sm"
            >
              {order.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">

          {/* ----------- Info Client ----------- */}
          <div className="grid md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow-inner">
            <div>
              <h3 className="font-semibold text-lg mb-2">Informations client</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Nom: </span>
                  {order.shippingAddress?.name}
                </p>
                <p>
                  <span className="font-semibold">Téléphone: </span>
                  {order.shippingAddress?.phone}
                </p>
              </div>
            </div>

            {/* ----------- Adresse de livraison ----------- */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Adresse de livraison</h3>
              <div className="space-y-1 text-sm">
                <p>{order.shippingAddress?.name}</p>
                <p>{order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.address}</p>
                <p>{order.shippingAddress?.city}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* ----------- Articles ----------- */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Articles commandés
            </h3>

            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        className="w-16 h-16 object-cover rounded-xl border dark:border-gray-700"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {item.price} FCFA
                      </p>
                    </div>
                  </div>

                  <p className="font-semibold text-right">
                    {(item.quantity * item.price).toFixed(2)} FCFA
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ----------- Totaux ----------- */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-3 text-right shadow-inner">
            <div className="text-sm">
              <span className="font-semibold">Sous-total: </span>
              {order.total?.toFixed(2)} FCFA
            </div>

            {order.discount > 0 && (
              <div className="text-green-600 dark:text-green-400 flex justify-end gap-2 items-center text-sm">
                <Tag className="w-4 h-4" />
                <span className="font-semibold">
                  Réduction ({order.voucherCode}):
                </span>
                -{order.discount?.toFixed(2)} FCFA
              </div>
            )}

            <div className="text-xl font-bold border-t pt-3">
              Total final:{" "}
              <span className="text-green-600 dark:text-green-400">
                {order.finalTotal?.toFixed(2)} FCFA
              </span>
            </div>

            {order.loyaltyPointsEarned > 0 && (
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                +{order.loyaltyPointsEarned} points fidélité
              </p>
            )}
          </div>

          <Separator />

          {/* ----------- Paiement ----------- */}
          <div className="text-sm space-y-1">
            <p>
              <span className="font-semibold">Méthode de paiement : </span>
              {order.paymentMethod || "Non-payé"}
            </p>

            <p>
              <span className="font-semibold">Statut du paiement : </span>
              {order.paymentStatus}
            </p>

            {order.paymentReference && (
              <p>
                <span className="font-semibold">Référence : </span>
                {order.paymentReference}
              </p>
            )}
          </div>

          <Separator />

          {/* ----------- Date ----------- */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Date de commande: </span>
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('fr-FR') +
                " — " +
                new Date(order.createdAt).toLocaleTimeString('fr-FR')
              : "N/A"}
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
